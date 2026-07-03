/* Slow Mandarin Lab — study page enhancements (no dependencies)
   1. Wraps three-layer transcript blocks (hanzi / pinyin / English) in styled spans.
   2. Adds a sticky layer bar so learners can hide pinyin / English (subtitle ladder). */
(function () {
  "use strict";

  function cjkHeavy(html) {
    var text = html.replace(/<[^>]*>/g, "");
    var cjk = (text.match(/[一-鿿]/g) || []).length;
    var latin = (text.match(/[A-Za-z]/g) || []).length;
    return cjk > 0 && cjk >= latin;
  }

  /* Dialogue turns: <p><strong>莎莎：</strong>汉字<br>pinyin<br><em>gloss</em></p> */
  document.querySelectorAll("article p").forEach(function (p) {
    var parts = p.innerHTML.split(/<br\s*\/?>/i);
    if (parts.length !== 3) return;
    var m = parts[0].match(/^<strong>(莎莎|波哥)[：:]<\/strong>\s*([\s\S]*)$/);
    if (!m) return;
    var spk = m[1];
    p.classList.add("turn", spk === "莎莎" ? "spk-shasha" : "spk-boge");
    p.innerHTML =
      '<span class="spk">' + spk + "</span>" +
      '<span class="zh">' + m[2].trim() + "</span>" +
      '<span class="py">' + parts[1].trim() + "</span>" +
      '<span class="en">' + parts[2].trim() + "</span>";
  });

  /* Teaching cards in blockquotes: zh<br>pinyin<br><em>gloss</em> */
  document.querySelectorAll("blockquote p").forEach(function (p) {
    var parts = p.innerHTML.split(/<br\s*\/?>/i);
    if (parts.length !== 3 || parts[2].indexOf("<em>") === -1) return;
    if (!cjkHeavy(parts[0])) return;
    p.classList.add("qcard");
    p.innerHTML =
      '<span class="zh">' + parts[0].trim() + "</span>" +
      '<span class="py">' + parts[1].trim() + "</span>" +
      parts[2].trim();
  });

  /* Layer bar (only on pages that have a transcript) */
  var firstTurn = document.querySelector(".turn");
  if (!firstTurn) return;

  var LAYERS = ["zh", "py", "en"];
  var bar = document.createElement("div");
  bar.className = "layer-bar";
  bar.innerHTML =
    '<span class="lb-label">Layers</span>' +
    '<button type="button" class="layer-toggle" data-layer="zh">汉字 Hanzi</button>' +
    '<button type="button" class="layer-toggle" data-layer="py">拼音 Pinyin</button>' +
    '<button type="button" class="layer-toggle" data-layer="en">English</button>';
  firstTurn.parentNode.insertBefore(bar, firstTurn);

  function apply(layer, show) {
    document.body.classList.toggle("hide-" + layer, !show);
    bar.querySelector('[data-layer="' + layer + '"]').classList.toggle("on", show);
    try { localStorage.setItem("sml_show_" + layer, show ? "1" : "0"); } catch (e) {}
  }
  function shownCount() {
    return LAYERS.filter(function (l) {
      return bar.querySelector('[data-layer="' + l + '"]').classList.contains("on");
    }).length;
  }
  LAYERS.forEach(function (layer) {
    var stored = null;
    try { stored = localStorage.getItem("sml_show_" + layer); } catch (e) {}
    apply(layer, stored !== "0");
  });
  if (shownCount() === 0) apply("zh", true); /* never start fully blank */
  bar.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".layer-toggle");
    if (!btn) return;
    var layer = btn.getAttribute("data-layer");
    var turningOff = btn.classList.contains("on");
    if (turningOff && shownCount() === 1) return; /* keep at least one layer visible */
    apply(layer, !turningOff);
  });
})();
