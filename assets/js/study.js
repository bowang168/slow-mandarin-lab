/* Slow Mandarin Lab — study page enhancements (no dependencies)
   1. Wraps three-layer transcript blocks (hanzi / pinyin / English) in styled spans.
   2. Adds a sticky layer bar so learners can hide pinyin / English (subtitle ladder). */
(function () {
  "use strict";

  /* Theme toggle — init happens pre-paint in default.html; this wires the button */
  var toggle = document.querySelector(".theme-toggle");
  function paintToggle() {
    if (!toggle) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    toggle.textContent = dark ? "\u2600\uFE0F" : "\uD83C\uDF19"; /* sun / moon */
    toggle.setAttribute("aria-pressed", dark ? "true" : "false");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      var next = dark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("sml_theme", next); } catch (e) {}
      paintToggle();
    });
    paintToggle();
  }

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
    '<button type="button" class="layer-toggle" data-layer="en">English</button>' +
    '<button type="button" class="layer-toggle lb-print" title="Prints only the layers you have switched on">🖨 PDF</button>';
  firstTurn.parentNode.insertBefore(bar, firstTurn);
  bar.querySelector(".lb-print").addEventListener("click", function () { window.print(); });

  var brand = document.createElement("div");
  brand.className = "print-brand";
  brand.textContent = "Slow Mandarin Lab · Study Notes — bowang168.github.io/slow-mandarin-lab";
  document.body.insertBefore(brand, document.body.firstChild);

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
    if (!layer) return; /* print button — handled by its own listener */
    var turningOff = btn.classList.contains("on");
    if (turningOff && shownCount() === 1) return; /* keep at least one layer visible */
    apply(layer, !turningOff);
  });
})();

/* Click-to-seek + follow-along highlight (turn-times JSON exported by the
   ytfactory pipeline from the episode's zh-Hans caption track). No autoplay:
   playback only ever starts from a user click. */
(function () {
  "use strict";

  var dataEl = document.querySelector("script.turn-times");
  var iframe = document.querySelector(".video-embed iframe");
  if (!dataEl || !iframe) return;
  var times;
  try { times = JSON.parse(dataEl.textContent).t || []; } catch (e) { return; }
  var turns = Array.prototype.slice.call(document.querySelectorAll("p.turn"));
  if (!turns.length) return;

  function fmt(t) {
    t = Math.floor(t);
    var m = Math.floor(t / 60), s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  turns.forEach(function (p, i) {
    if (i >= times.length || times[i] == null) return;
    p.classList.add("seekable");
    p.setAttribute("data-t", times[i]);
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "seek-chip";
    chip.textContent = "▶ " + fmt(times[i]);
    chip.title = "Play the video from this line";
    p.insertBefore(chip, p.firstChild);
  });

  var player = null, ready = false, pendingSeek = null;
  function create() {
    if (player || !(window.YT && window.YT.Player)) return;
    player = new YT.Player(iframe, {
      events: {
        onReady: function () {
          ready = true;
          if (pendingSeek !== null) { doSeek(pendingSeek); pendingSeek = null; }
        }
      }
    });
  }
  var prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () { if (prev) prev(); create(); };
  var api = document.createElement("script");
  api.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(api);

  function doSeek(t) { player.seekTo(t, true); player.playVideo(); }
  function seek(t) { if (ready) doSeek(t); else pendingSeek = t; }
  window.SMLPlayer = function () { return player; }; /* debug hook */

  document.addEventListener("click", function (ev) {
    var chip = ev.target.closest(".seek-chip");
    var row = ev.target.closest("p.turn.seekable");
    if (!chip && !row) return;
    if (!chip) {
      var sel = window.getSelection();
      if (sel && String(sel).length) return;   /* don't hijack text selection */
      if (ev.target.closest("a")) return;
    }
    var el = chip ? chip.parentNode : row;
    var t = parseFloat(el.getAttribute("data-t"));
    if (!isNaN(t)) seek(Math.max(0, t - 0.2));
  });

  /* follow-along: highlight the line under the playhead while playing */
  var current = -1;
  setInterval(function () {
    if (!ready || !player || player.getPlayerState() !== 1) return;
    var t = player.getCurrentTime(), idx = -1;
    for (var i = 0; i < turns.length; i++) {
      var ti = parseFloat(turns[i].getAttribute("data-t"));
      if (isNaN(ti)) continue;
      if (ti <= t + 0.3) idx = i;
      else break;
    }
    if (idx === current) return;
    if (current > -1) turns[current].classList.remove("now");
    if (idx > -1) turns[idx].classList.add("now");
    current = idx;
  }, 600);
})();
