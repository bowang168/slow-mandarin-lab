"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../assets/js/pinyin.js");

test("toneOf: four tones, neutral, ü", () => {
  assert.equal(P.toneOf("shēng"), 1);
  assert.equal(P.toneOf("má"), 2);
  assert.equal(P.toneOf("mǎ"), 3);
  assert.equal(P.toneOf("mà"), 4);
  assert.equal(P.toneOf("de"), 5);
  assert.equal(P.toneOf("ma"), 5);
  assert.equal(P.toneOf("lǜ"), 4);
  assert.equal(P.toneOf("nǚ"), 3);
  assert.equal(P.toneOf("À"), 4);
});

test("splitLine: multi-syllable words split against char count", () => {
  assert.deepEqual(P.splitLine("wǒmen", 2), ["wǒ", "men"]);
  assert.deepEqual(P.splitLine("Shēngdiào.", 2), ["Shēng", "diào"]);
  assert.deepEqual(P.splitLine("yìdiǎn", 2), ["yì", "diǎn"]);
  assert.deepEqual(P.splitLine("Māma huì biànchéng mǎ.", 6),
    ["Mā", "ma", "huì", "biàn", "chéng", "mǎ"]);
});

test("splitLine: apostrophe is an explicit boundary", () => {
  assert.deepEqual(P.splitLine("Xī'ān", 2), ["Xī", "ān"]);
});

test("splitLine: count constraint resolves ambiguity", () => {
  // xiān is one syllable; forced to 2 it must fail (xi + ān: ān is valid zero-initial)
  assert.deepEqual(P.splitLine("xiān", 1), ["xiān"]);
  // impossible target → null
  assert.equal(P.splitLine("nǐ", 2), null);
  assert.equal(P.splitLine("wǒmen", 3), null);
});

test("splitLine: erhua r attaches as its own syllable for 儿", () => {
  assert.deepEqual(P.splitLine("wánr", 2), ["wán", "r"]);
  assert.deepEqual(P.splitLine("yìdiǎnr", 3), ["yì", "diǎn", "r"]);
});

test("align: real episode line (ep16 cold open)", () => {
  const a = P.align(
    "波哥，我说两个字，很多人一听就紧张。",
    "Bōgē, wǒ shuō liǎng ge zì, hěn duō rén yì tīng jiù jǐnzhāng."
  );
  assert.ok(a, "alignment should succeed");
  const cjk = a.filter((x) => x.syl !== null);
  assert.equal(cjk.length, 15);
  assert.equal(cjk[0].ch, "波");
  assert.equal(cjk[0].syl, "Bō");
  assert.equal(cjk[0].tone, 1);
  assert.equal(cjk[14].ch, "张");
  assert.equal(cjk[14].syl, "zhāng");
  // punctuation passes through unaligned
  assert.equal(a[2].ch, "，");
  assert.equal(a[2].syl, null);
});

test("align: line with sentence-initial accented uppercase", () => {
  const a = P.align(
    "啊，声调……你说对了，我真的怕它。",
    "À, shēngdiào…… nǐ shuō duì le, wǒ zhēnde pà tā."
  );
  assert.ok(a);
  const cjk = a.filter((x) => x.syl !== null);
  assert.equal(cjk.length, 12);
  assert.equal(cjk[0].syl, "À");
  assert.equal(cjk[0].tone, 4);
  assert.equal(cjk[6].ch, "了");
  assert.equal(cjk[6].syl, "le");
  assert.equal(cjk[6].tone, 5);
});

test("align: neutral-tone convention (méi guānxi, ěrduo)", () => {
  const a = P.align("耳朵", "ěrduo");
  assert.ok(a);
  assert.deepEqual(a.map((x) => x.syl), ["ěr", "duo"]);
  assert.deepEqual(a.map((x) => x.tone), [3, 5]);
});

test("align: erhua sentence", () => {
  const a = P.align("我想去玩儿。", "Wǒ xiǎng qù wánr.");
  assert.ok(a);
  const cjk = a.filter((x) => x.syl !== null);
  assert.equal(cjk.length, 5);
  assert.equal(cjk[4].ch, "儿");
  assert.equal(cjk[4].syl, "r");
});

test("align: graceful null on mismatch or junk", () => {
  assert.equal(P.align("你好", "nǐ"), null);
  assert.equal(P.align("你好", "hello world"), null);
  assert.equal(P.align("...", "nǐ hǎo"), null); // no CJK chars at all
});

test("align: mixed hanzi + latin passthrough", () => {
  const a = P.align("我用APP学习。", "Wǒ yòng APP xuéxí.");
  // "APP" in the pinyin line is 3 un-parseable letters → must not crash;
  // A/P/P are plain letters so they segment-fail → null fallback
  assert.equal(a, null);
});

test("colorTokens: greedy syllable spans with tones", () => {
  const t = P.colorTokens("Wǒ hǎo, OK?");
  const sylls = t.filter((x) => x.tone > 0);
  assert.deepEqual(sylls.map((x) => x.text), ["Wǒ", "hǎo"]);
  assert.deepEqual(sylls.map((x) => x.tone), [3, 3]);
  // OK stays uncolored, punctuation passes through
  assert.ok(t.some((x) => x.text === "OK" && x.tone === 0));
});

test("colorTokens: word-grouped pinyin colors every syllable", () => {
  const t = P.colorTokens("shēngdiào jiù qīngchǔ le");
  const sylls = t.filter((x) => x.tone > 0);
  assert.deepEqual(sylls.map((x) => x.text), ["shēng", "diào", "jiù", "qīng", "chǔ", "le"]);
  assert.deepEqual(sylls.map((x) => x.tone), [1, 4, 4, 1, 3, 5]);
});

test("real transcript bulk: every ep16 turn aligns", () => {
  // representative sample across the episode
  const lines = [
    ["两个字？你说。", "Liǎng ge zì? Nǐ shuō."],
    ["为什么怕？", "Wèishénme pà?"],
    ["老师说，声调错了，词就错了。妈妈会变成马。",
      "Lǎoshī shuō, shēngdiào cuò le, cí jiù cuò le. Māma huì biànchéng mǎ."],
    ["哈哈，妈妈不能变成马。", "Hāhā, māma bù néng biànchéng mǎ."],
    ["对啊！所以我每次开口，都先想声调，越想越不敢说。",
      "Duì a! Suǒyǐ wǒ měi cì kāikǒu, dōu xiān xiǎng shēngdiào, yuè xiǎng yuè bù gǎn shuō."],
    ["很多朋友都是这样。别怕，今天没有表格，没有考试，只有三件事。",
      "Hěn duō péngyou dōu shì zhèyàng. Bié pà, jīntiān méiyǒu biǎogé, méiyǒu kǎoshì, zhǐyǒu sān jiàn shì."],
    ["声调是什么，为什么不用那么怕，还有一个小办法。",
      "Shēngdiào shì shénme, wèishénme búyòng nàme pà, háiyǒu yí ge xiǎo bànfǎ."],
    ["说慢一点，声调就清楚了。", "Shuō màn yìdiǎn, shēngdiào jiù qīngchǔ le."]
  ];
  for (const [zh, py] of lines) {
    const a = P.align(zh, py);
    assert.ok(a, "failed to align: " + zh);
    const cjkCount = Array.from(zh).filter((c) => /[㐀-鿿]/.test(c)).length;
    assert.equal(a.filter((x) => x.syl !== null).length, cjkCount, "count off: " + zh);
  }
});

test("align: interjection 嗯 (Ǹg) matches as a whole word", () => {
  const a = P.align("嗯，十个，不少。", "Ǹg, shí ge, bù shǎo.");
  assert.ok(a);
  const cjk = a.filter((x) => x.syl !== null);
  assert.equal(cjk[0].ch, "嗯");
  assert.equal(cjk[0].syl, "Ǹg");
  assert.equal(cjk[0].tone, 4);
  // but ng must never split off inside a normal word
  assert.equal(P.splitLine("míng", 2), null);
});
