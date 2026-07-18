/* Slow Mandarin Lab — pinyin syllable logic (no dependencies)
   Pure functions shared by study-ui.js (ruby mode, tone colors) and node tests.
   Segmentation is count-constrained: the number of syllables in a line must
   equal the number of CJK characters in its hanzi line, which resolves nearly
   all boundary ambiguity (xiān vs xī'ān etc.). Anything that cannot be aligned
   returns null and the caller falls back to the plain pinyin line. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SMLPinyin = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* tone-marked vowel → [base letter, tone number] */
  var TONED = {
    "ā": ["a", 1], "á": ["a", 2], "ǎ": ["a", 3], "à": ["a", 4],
    "ē": ["e", 1], "é": ["e", 2], "ě": ["e", 3], "è": ["e", 4],
    "ī": ["i", 1], "í": ["i", 2], "ǐ": ["i", 3], "ì": ["i", 4],
    "ō": ["o", 1], "ó": ["o", 2], "ǒ": ["o", 3], "ò": ["o", 4],
    "ū": ["u", 1], "ú": ["u", 2], "ǔ": ["u", 3], "ù": ["u", 4],
    "ǖ": ["v", 1], "ǘ": ["v", 2], "ǚ": ["v", 3], "ǜ": ["v", 4],
    "ü": ["v", 0], "ń": ["n", 2], "ň": ["n", 3], "ǹ": ["n", 4],
    "ḿ": ["m", 2], "ê": ["e", 0]
  };

  var INITIALS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l",
    "g", "k", "h", "j", "q", "x", "r", "z", "c", "s", "y", "w"];

  var FINALS = ["a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang",
    "eng", "ong", "er", "i", "ia", "ie", "iao", "iu", "ian", "in", "iang",
    "ing", "iong", "u", "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng",
    "ue", "v", "ve", "van", "vn"];
  var FINAL_SET = {};
  FINALS.forEach(function (f) { FINAL_SET[f] = true; });

  /* standalone syllables: erhua "r" and syllabic "er"; interjection-only
     syllables (n/ng/m for 嗯 etc.) are excluded from in-word splitting —
     they create spurious splits — and instead match as whole words only */
  var BARE = { "r": true, "er": true };
  var INTERJ = { "ng": true, "n": true, "m": true, "hng": true, "hm": true };

  var CJK_RE = /[㐀-鿿豈-﫿]/;

  /* NFC + lowercase + strip tone marks; returns { base, tone } for a syllable
     candidate, or null if it contains non-pinyin letters after stripping */
  function baseOf(str) {
    var s = str.normalize ? str.normalize("NFC") : str;
    var base = "", tone = 0, i, ch, low, hit;
    for (i = 0; i < s.length; i++) {
      ch = s[i];
      low = ch.toLowerCase();
      hit = TONED[low];
      if (hit) {
        base += hit[0];
        if (hit[1]) tone = hit[1];
      } else if (low >= "a" && low <= "z") {
        base += low === "ü" ? "v" : low;
      } else {
        return null;
      }
    }
    return { base: base, tone: tone };
  }

  /* neutral tone = 5 when the syllable carries no mark */
  function toneOf(syl) {
    var b = baseOf(syl);
    if (!b || !b.base) return 0;
    return b.tone === 0 ? 5 : b.tone;
  }

  function isValidSyllable(base) {
    if (!base) return false;
    if (BARE[base]) return true;
    var i, ini, rest;
    for (i = 0; i < INITIALS.length; i++) {
      ini = INITIALS[i];
      if (base.indexOf(ini) === 0) {
        rest = base.slice(ini.length);
        if (FINAL_SET[rest]) return true;
      }
    }
    /* zero-initial syllables must start with a / o / e */
    if (FINAL_SET[base] && (base[0] === "a" || base[0] === "o" || base[0] === "e"))
      return true;
    return false;
  }

  /* all segmentations of one word (base string) into valid syllables,
     as arrays of [start, end) index pairs; capped to keep DP tiny */
  function wordSplits(base) {
    var memo = {};
    function rec(pos) {
      if (memo[pos]) return memo[pos];
      if (pos === base.length) return (memo[pos] = [[]]);
      var out = [], len, cand, rest, i;
      /* longest-first so the preferred (fewest-syllable) split comes first */
      for (len = Math.min(6, base.length - pos); len >= 1; len--) {
        cand = base.slice(pos, pos + len);
        if (!isValidSyllable(cand)) continue;
        rest = rec(pos + len);
        for (i = 0; i < rest.length && out.length < 24; i++)
          out.push([[pos, pos + len]].concat(rest[i]));
      }
      return (memo[pos] = out);
    }
    return rec(0);
  }

  /* tokenize a pinyin line into letter-run words and passthrough runs;
     apostrophes split words (they are explicit syllable boundaries) */
  function tokenize(line) {
    var s = (line.normalize ? line.normalize("NFC") : line);
    var tokens = [], cur = "", i, ch, isLetter;
    for (i = 0; i < s.length; i++) {
      ch = s[i];
      isLetter = /[A-Za-zÀ-ɏḀ-ỿ]/.test(ch) && baseOf(ch) !== null;
      if (isLetter) { cur += ch; continue; }
      if (cur) { tokens.push({ word: cur }); cur = ""; }
      tokens.push({ sep: ch });
    }
    if (cur) tokens.push({ word: cur });
    return tokens;
  }

  /* split a whole line into syllables (original spelling, tones kept),
     choosing per-word splits so the total count equals target; null if
     impossible */
  function splitLine(line, target) {
    var tokens = tokenize(line);
    var words = tokens.filter(function (t) { return t.word; });
    var options = [], w, base, splits, counts, seen, i;
    for (w = 0; w < words.length; w++) {
      base = baseOf(words[w].word);
      if (base === null) return null;
      splits = INTERJ[base.base]
        ? [[[0, words[w].word.length]]]
        : wordSplits(base.base);
      if (!splits.length) return null;
      /* dedupe by syllable count, keeping first (longest-first) variant */
      counts = []; seen = {};
      for (i = 0; i < splits.length; i++) {
        if (!seen[splits[i].length]) { seen[splits[i].length] = true; counts.push(splits[i]); }
      }
      options.push(counts);
    }
    /* DP over words to reach the target syllable count */
    var choice = pickCombo(options, target);
    if (!choice) return null;
    var sylls = [];
    for (w = 0; w < words.length; w++) {
      var word = words[w].word;
      choice[w].forEach(function (pair) {
        sylls.push(word.slice(pair[0], pair[1]));
      });
    }
    return sylls;
  }

  function pickCombo(options, target) {
    var states = { 0: [] }; /* count → chosen splits so far */
    for (var w = 0; w < options.length; w++) {
      var next = {};
      for (var c in states) {
        for (var k = 0; k < options[w].length; k++) {
          var n = Number(c) + options[w][k].length;
          if (n > target) continue;
          if (!(n in next)) next[n] = states[c].concat([options[w][k]]);
        }
      }
      states = next;
    }
    return states[target] || null;
  }

  /* align hanzi text with its pinyin line.
     Returns [{ch, syl|null, tone}] per hanzi character (non-CJK chars pass
     through with syl null), or null when alignment is impossible. */
  function align(hanzi, pyLine) {
    var chars = Array.from ? Array.from(hanzi) : hanzi.split("");
    var target = 0, i;
    for (i = 0; i < chars.length; i++) if (CJK_RE.test(chars[i])) target++;
    if (!target) return null;
    var sylls = splitLine(pyLine, target);
    if (!sylls) return null;
    var out = [], s = 0;
    for (i = 0; i < chars.length; i++) {
      if (CJK_RE.test(chars[i])) {
        out.push({ ch: chars[i], syl: sylls[s], tone: toneOf(sylls[s]) });
        s++;
      } else {
        out.push({ ch: chars[i], syl: null, tone: 0 });
      }
    }
    return out;
  }

  /* best-effort syllable spans for tone coloring (no count constraint):
     greedy longest-first per word; words that don't segment stay uncolored */
  function colorTokens(line) {
    var tokens = tokenize(line);
    var out = [];
    tokens.forEach(function (t) {
      if (t.sep !== undefined) { out.push({ text: t.sep, tone: 0 }); return; }
      var base = baseOf(t.word);
      var splits = base ? wordSplits(base.base) : [];
      if (!splits.length) { out.push({ text: t.word, tone: 0 }); return; }
      splits[0].forEach(function (pair) {
        var syl = t.word.slice(pair[0], pair[1]);
        out.push({ text: syl, tone: toneOf(syl) });
      });
    });
    return out;
  }

  return {
    toneOf: toneOf,
    splitLine: splitLine,
    align: align,
    colorTokens: colorTokens,
    _internal: { baseOf: baseOf, isValidSyllable: isValidSyllable, wordSplits: wordSplits }
  };
});
