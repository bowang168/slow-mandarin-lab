/* Slow Mandarin Lab — study page UI extras (no dependencies)
   Runs after study.js (layer bar, SMLIcons) and pinyin.js (SMLPinyin).
   - transcript enhancement: ruby pinyin over characters + vocab-in-context
     highlights, built once at load and switched purely via CSS classes
   - "Aa" display popover: hanzi size, tone colors, ruby mode, print
   - section-jump popover + thin reading progress bar
   - Anki .tsv export under each vocabulary table
   - home page: easiest-first sort for the episode wall */
(function () {
  "use strict";

  var ICONS = window.SMLIcons || {};
  var P = window.SMLPinyin || null;
  var CJK_RE = /[㐀-鿿]/;

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------------- toast ---------------- */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "sml-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 4000);
  }

  /* ---------------- popover plumbing (one open at a time) ---------------- */
  var openPop = null;
  function closePop() {
    if (!openPop) return;
    openPop.pop.classList.remove("open");
    openPop.btn.setAttribute("aria-expanded", "false");
    openPop = null;
  }
  function wirePop(btn, pop) {
    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var isOpen = openPop && openPop.pop === pop;
      closePop();
      if (!isOpen) {
        pop.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        openPop = { btn: btn, pop: pop };
      }
    });
    pop.addEventListener("click", function (ev) { ev.stopPropagation(); });
  }
  document.addEventListener("click", closePop);
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closePop();
  });

  /* ================= transcript pages ================= */
  var bar = document.querySelector(".layer-bar");
  var article = document.querySelector("article");

  /* ---------------- vocabulary tables ---------------- */
  function vocabTables() {
    var tables = [];
    if (!article) return tables;
    article.querySelectorAll("table").forEach(function (tb) {
      var items = [];
      tb.querySelectorAll("tr").forEach(function (tr) {
        var tds = tr.querySelectorAll("td");
        if (tds.length < 3) return;
        var w = tds[0].textContent.trim();
        if (!w || w.length > 8 || !CJK_RE.test(w)) return;
        if (/[A-Za-z0-9（）()]/.test(w)) return; /* descriptive first column, not a headword */
        items.push({
          w: w,
          py: tds[1].textContent.trim(),
          en: tds[2].textContent.trim()
        });
      });
      if (items.length >= 3) tables.push({ table: tb, items: items });
    });
    return tables;
  }

  var tables = bar ? vocabTables() : [];
  var vocab = [];
  var seenWords = {};
  tables.forEach(function (t) {
    t.items.forEach(function (it) {
      if (seenWords[it.w]) return;
      seenWords[it.w] = true;
      vocab.push({ w: it.w, py: it.py, en: it.en, chars: Array.from(it.w) });
    });
  });
  vocab.sort(function (a, b) { return b.chars.length - a.chars.length; });

  /* ---------------- line renderer: ruby + vocab spans in one pass ----------------
     rt elements are hidden unless body.ruby-on; vocab spans always get their
     dotted underline. Built once — toggles are pure CSS afterwards. */
  /* ranges are in code-point space (same indexing as align()'s output) */
  function vocabRanges(chars) {
    var ranges = [], i = 0, v, k;
    while (i < chars.length) {
      var hit = null;
      for (k = 0; k < vocab.length; k++) {
        v = vocab[k];
        if (chars.slice(i, i + v.chars.length).join("") === v.w) { hit = v; break; }
      }
      if (hit) { ranges.push({ start: i, end: i + hit.chars.length, v: hit }); i += hit.chars.length; }
      else i++;
    }
    return ranges;
  }

  function renderLine(zhText, aligned, withVocab) {
    var chars = Array.from(zhText);
    var ranges = withVocab ? vocabRanges(chars) : [];
    var html = "", r = 0, s = 0, i;
    for (i = 0; i < chars.length; i++) {
      if (r < ranges.length && ranges[r].start === i) {
        var v = ranges[r].v;
        html += '<span class="vocab-hit" role="button" tabindex="0" data-w="' + esc(v.w) +
          '" data-py="' + esc(v.py) + '" data-en="' + esc(v.en) + '">';
      }
      if (aligned && aligned[i] && aligned[i].syl !== null) {
        html += '<ruby class="t' + aligned[i].tone + '">' + esc(chars[i]) +
          "<rt>" + esc(aligned[i].syl) + "</rt></ruby>";
      } else {
        html += esc(chars[i]);
      }
      if (r < ranges.length && ranges[r].end === i + 1) { html += "</span>"; r++; }
    }
    return html;
  }

  function enhanceTranscript() {
    if (!bar) return;
    document.querySelectorAll(".turn, .qcard").forEach(function (row) {
      var zh = row.querySelector(".zh"), py = row.querySelector(".py");
      if (!zh || !py) return;
      /* allow one plain bold wrapper (target sentences in blockquotes) */
      var host = zh;
      if (zh.children.length === 1 && !zh.children[0].children.length &&
          /^(STRONG|B)$/.test(zh.children[0].tagName) &&
          zh.textContent === zh.children[0].textContent) {
        host = zh.children[0];
      } else if (zh.children.length) {
        return; /* formatted line — leave untouched, ruby/vocab skip it */
      }
      var text = host.textContent;
      if (!CJK_RE.test(text)) return;
      var aligned = P ? P.align(text, py.textContent) : null;
      var withVocab = row.classList.contains("turn"); /* qcards teach the word already */
      host.innerHTML = renderLine(text, aligned, withVocab);
      if (aligned) row.classList.add("has-ruby");
    });

    /* tone-color spans on the pinyin lines */
    if (P) document.querySelectorAll(".turn .py, .qcard .py").forEach(function (el) {
      if (el.children.length) return;
      var toks = P.colorTokens(el.textContent);
      if (!toks.some(function (t) { return t.tone > 0; })) return;
      var html = "";
      toks.forEach(function (t) {
        html += t.tone > 0
          ? '<span class="pys t' + t.tone + '">' + esc(t.text) + "</span>"
          : esc(t.text);
      });
      el.innerHTML = html;
    });
  }

  /* ---------------- vocab tooltip ---------------- */
  function wireVocabTips() {
    var hits = document.querySelectorAll(".vocab-hit");
    if (!hits.length) return;
    var tip = document.createElement("div");
    tip.className = "vocab-tip";
    document.body.appendChild(tip);
    function hideTip() { tip.classList.remove("show"); }
    function showTip(el) {
      tip.innerHTML =
        '<span class="vt-w">' + esc(el.getAttribute("data-w")) + "</span>" +
        '<span class="vt-py">' + esc(el.getAttribute("data-py")) + "</span>" +
        '<span class="vt-en">' + esc(el.getAttribute("data-en")) + "</span>";
      tip.classList.add("show");
      var r = el.getBoundingClientRect();
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
      var y = r.top - h - 8;
      if (y < 60) y = r.bottom + 8; /* below the line when too close to the sticky bar */
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    }
    hits.forEach(function (el) {
      el.addEventListener("click", function (ev) {
        ev.stopPropagation(); /* keep the tap from seeking the video */
        if (tip.classList.contains("show") && tip._for === el) { hideTip(); tip._for = null; return; }
        tip._for = el;
        showTip(el);
      });
      el.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); el.click(); }
      });
    });
    document.addEventListener("click", hideTip);
    window.addEventListener("scroll", hideTip, { passive: true });
  }

  /* ---------------- Anki export ---------------- */
  function wireAnkiExport() {
    var slug = location.pathname.split("/").filter(Boolean).pop() || "episode";
    tables.forEach(function (t) {
      var row = document.createElement("p");
      row.className = "anki-row";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "anki-btn";
      btn.innerHTML = (ICONS.download || "") + " Export for Anki (.tsv)";
      btn.title = "Download these words as a tab-separated file — File → Import in Anki";
      row.appendChild(btn);
      t.table.parentNode.insertBefore(row, t.table.nextSibling);
      btn.addEventListener("click", function () {
        var tsv = t.items.map(function (it) {
          return it.w + "\t" + it.py + "\t" + it.en;
        }).join("\n") + "\n";
        var blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = slug + "-vocab.tsv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
        toast(t.items.length + " cards exported — import the .tsv in Anki (File → Import)");
      });
    });
  }

  /* ---------------- Aa display settings popover ---------------- */
  var SCALES = [0.85, 1, 1.15, 1.3];
  function wireDisplayPop() {
    var printBtn = bar.querySelector(".lb-print");
    var btnAa = document.createElement("button");
    btnAa.type = "button";
    btnAa.className = "layer-toggle lb-aa";
    btnAa.textContent = "Aa";
    btnAa.title = "Display settings — text size, tone colors, pinyin position";
    btnAa.setAttribute("aria-label", "Display settings");
    btnAa.setAttribute("aria-expanded", "false");
    btnAa.setAttribute("aria-haspopup", "true");
    printBtn.parentNode.insertBefore(btnAa, printBtn.nextSibling);

    var pop = document.createElement("div");
    pop.className = "bar-pop aa-pop";
    pop.innerHTML =
      '<div class="pop-row pop-layout">' +
        '<span class="pop-label">Layout</span>' +
        '<span class="lay-seg" role="group" aria-label="Transcript layout">' +
          '<button type="button" class="lay-btn" data-lay="classic" ' +
            'title="Classic — speaker pills and timestamps always visible">经典</button>' +
          '<button type="button" class="lay-btn" data-lay="dots" ' +
            'title="Dots — compact color dots, timestamps appear on the playing line">圆点</button>' +
          '<button type="button" class="lay-btn" data-lay="zen" ' +
            'title="Zen — pure text, other lines fade while one plays">纯净</button>' +
        "</span></div>" +
      '<div class="pop-row pop-size">' +
        '<span class="pop-label">汉字 size</span>' +
        '<span class="pop-size-ctl">' +
          '<button type="button" class="pop-btn size-dn" aria-label="Smaller hanzi">A−</button>' +
          '<span class="size-val">100%</span>' +
          '<button type="button" class="pop-btn size-up" aria-label="Bigger hanzi">A+</button>' +
        "</span></div>" +
      '<button type="button" class="pop-row pop-switch" data-set="tones" aria-pressed="false">' +
        '<span class="pop-label">Tone colors' +
          ' <span class="tone-demo" aria-hidden="true"><i class="t1">mā</i><i class="t2">má</i>' +
          '<i class="t3">mǎ</i><i class="t4">mà</i><i class="t5">ma</i></span></span>' +
        '<span class="pop-knob" aria-hidden="true"></span></button>' +
      '<button type="button" class="pop-row pop-switch" data-set="ruby" aria-pressed="false">' +
        '<span class="pop-label">拼音 on top <ruby class="pop-ruby">字<rt>zì</rt></ruby></span>' +
        '<span class="pop-knob" aria-hidden="true"></span></button>' +
      '<div class="pop-sep"></div>' +
      '<button type="button" class="pop-row pop-action pop-print">' + (ICONS.printer || "") +
        ' Print / PDF<span class="pop-hint">prints only the visible layers</span></button>';
    bar.appendChild(pop);
    wirePop(btnAa, pop);

    /* hanzi size */
    var scale = parseFloat(read("sml_zh_scale")) || 1;
    if (SCALES.indexOf(scale) === -1) scale = 1;
    var valEl = pop.querySelector(".size-val");
    var dn = pop.querySelector(".size-dn"), up = pop.querySelector(".size-up");
    function applyScale() {
      document.documentElement.style.setProperty("--zh-scale", scale);
      valEl.textContent = Math.round(scale * 100) + "%";
      dn.disabled = scale === SCALES[0];
      up.disabled = scale === SCALES[SCALES.length - 1];
      store("sml_zh_scale", String(scale));
    }
    dn.addEventListener("click", function () {
      scale = SCALES[Math.max(0, SCALES.indexOf(scale) - 1)]; applyScale();
    });
    up.addEventListener("click", function () {
      scale = SCALES[Math.min(SCALES.length - 1, SCALES.indexOf(scale) + 1)]; applyScale();
    });
    applyScale();

    /* tone colors + ruby switches (pure CSS classes; DOM was built at load) */
    var SWITCHES = { tones: "tones-on", ruby: "ruby-on" };
    pop.querySelectorAll(".pop-switch").forEach(function (sw) {
      var key = sw.getAttribute("data-set");
      function paint(on) {
        document.body.classList.toggle(SWITCHES[key], on);
        sw.setAttribute("aria-pressed", on ? "true" : "false");
        sw.classList.toggle("on", on);
      }
      paint(read("sml_" + key) === "1");
      sw.addEventListener("click", function () {
        var on = !sw.classList.contains("on");
        paint(on);
        store("sml_" + key, on ? "1" : "0");
      });
    });

    pop.querySelector(".pop-print").addEventListener("click", function () {
      closePop();
      window.print();
    });

    /* transcript layout: classic pills / compact dots / zen focus reading */
    var LAYOUTS = ["classic", "dots", "zen"];
    var layBtns = pop.querySelectorAll(".lay-btn");
    function applyLayout(lay) {
      LAYOUTS.forEach(function (l) {
        document.body.classList.toggle("layout-" + l, l === lay);
      });
      layBtns.forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-lay") === lay);
      });
      store("sml_layout", lay);
    }
    layBtns.forEach(function (b) {
      b.addEventListener("click", function () { applyLayout(b.getAttribute("data-lay")); });
    });
    var storedLay = read("sml_layout");
    applyLayout(LAYOUTS.indexOf(storedLay) > -1 ? storedLay : "zen");

    /* dot-layout legend, shown by CSS only when that layout is active */
    var firstTurn = document.querySelector(".turn");
    if (firstTurn) {
      var legend = document.createElement("p");
      legend.className = "spk-legend";
      legend.innerHTML = '<i class="ld ld-shasha"></i>莎莎 <i class="ld ld-boge"></i>波哥';
      firstTurn.parentNode.insertBefore(legend, firstTurn);
    }
  }

  /* ---------------- heading order: English first, 中文 after ----------------
     Transcript h3s arrive from the pipeline as "开场 · Cold open" while the
     h2s read "Full transcript 全文" — flip the h3s at display time so every
     heading is English-first. Only titles whose right half is pure Latin are
     flipped; bilingual-both-sides ones (会: a learned skill) stay put. */
  function normalizeHeads() {
    var scope = document.querySelector(".notes-col") || article;
    if (!scope) return;
    scope.querySelectorAll("h3").forEach(function (h) {
      var m = h.textContent.trim().match(/^([^A-Za-z]+?)\s*·\s*([A-Za-z][^㐀-鿿]*)$/);
      if (!m) return;
      h.textContent = m[2].trim() + " · " + m[1].trim();
    });
  }

  /* ---------------- section jump popover ---------------- */
  function wireSectionsPop() {
    var scope = document.querySelector(".notes-col") || article;
    if (!scope) return;
    var heads = scope.querySelectorAll("h2, h3");
    if (heads.length < 3) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layer-toggle lb-sections";
    btn.innerHTML = ICONS.list || "☰";
    btn.title = "Jump to a section";
    btn.setAttribute("aria-label", "Jump to a section");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-haspopup", "true");
    var aa = bar.querySelector(".lb-aa");
    aa.parentNode.insertBefore(btn, aa.nextSibling);

    var pop = document.createElement("div");
    pop.className = "bar-pop sec-pop";
    heads.forEach(function (h) {
      var it = document.createElement("button");
      it.type = "button";
      it.className = "pop-row sec-item sec-" + h.tagName.toLowerCase();
      it.textContent = h.textContent;
      it.addEventListener("click", function () {
        closePop();
        h.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto" : "smooth"
        });
      });
      pop.appendChild(it);
    });
    bar.appendChild(pop);
    wirePop(btn, pop);
  }

  /* ---------------- reading progress bar ---------------- */
  function wireProgress() {
    var prog = document.createElement("div");
    prog.className = "read-progress";
    prog.setAttribute("aria-hidden", "true");
    document.body.appendChild(prog);
    var ticking = false;
    function upd() {
      ticking = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(upd); }
    }, { passive: true });
    upd();
  }

  /* auto-hide the sticky chrome while reading down, bring it back on the
     first scroll up — CSS applies this on phones only */
  (function () {
    var lastY = window.scrollY || 0, acc = 0;
    window.addEventListener("scroll", function () {
      var y = Math.max(0, window.scrollY);
      var dy = y - lastY;
      lastY = y;
      if (openPop) return; /* never hide the bar under an open popover */
      if (y < 120) { document.body.classList.remove("chrome-hidden"); acc = 0; return; }
      acc = (dy > 0) === (acc > 0) ? acc + dy : dy;
      if (acc > 28) document.body.classList.add("chrome-hidden");
      else if (acc < -12) document.body.classList.remove("chrome-hidden");
    }, { passive: true });
  })();

  if (bar) {
    enhanceTranscript();
    wireVocabTips();
    wireAnkiExport();
    wireDisplayPop();
    normalizeHeads();
    wireSectionsPop();
    wireProgress();
  }

  /* ================= home page: easiest-first sort ================= */
  (function () {
    var fbar = document.querySelector(".filter-bar");
    if (!fbar) return;
    var grids = document.querySelectorAll(".cards");
    if (!grids.length) return;
    function keyOf(card) {
      var hsk = (card.getAttribute("data-hsk") || "").match(/\d+/);
      var ep = (card.querySelector(".ep-no") || { textContent: "" })
        .textContent.match(/\d+/);
      return [hsk ? Number(hsk[0]) : 99, ep ? Number(ep[0]) : 999];
    }
    var original = [];
    grids.forEach(function (g) {
      original.push(Array.prototype.slice.call(g.querySelectorAll(".card")));
    });
    var sep = document.createElement("span");
    sep.className = "pctl-sep";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layer-toggle sort-toggle";
    btn.textContent = "Easiest first";
    btn.title = "Order the wall from easiest to hardest instead of newest first";
    fbar.appendChild(sep);
    fbar.appendChild(btn);
    function apply(on) {
      btn.classList.toggle("on", on);
      grids.forEach(function (g, gi) {
        var cards = original[gi].slice();
        if (on) cards.sort(function (a, b) {
          var ka = keyOf(a), kb = keyOf(b);
          return ka[0] - kb[0] || ka[1] - kb[1];
        });
        cards.forEach(function (c) { g.appendChild(c); });
      });
      store("sml_sort", on ? "1" : "0");
    }
    btn.addEventListener("click", function () {
      apply(!btn.classList.contains("on"));
    });
    if (read("sml_sort") === "1") apply(true);
  })();
})();
