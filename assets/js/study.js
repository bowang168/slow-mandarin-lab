/* Slow Mandarin Lab — study page enhancements (no dependencies)
   1. Wraps three-layer transcript blocks (hanzi / pinyin / English) in styled spans.
   2. Adds a sticky layer bar so learners can hide pinyin / English (subtitle ladder). */
(function () {
  "use strict";

  /* Inline SVG icons (lucide-style, currentColor) — shared with study-ui.js.
     Emoji render differently on every OS; these keep the UI consistent. */
  var S = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var F = '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">';
  var ICONS = {
    play: F + '<path d="M8 5.4v13.2a.5.5 0 0 0 .76.43l10.5-6.6a.5.5 0 0 0 0-.86L8.76 4.97a.5.5 0 0 0-.76.43z"/></svg>',
    pause: F + '<rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>',
    loop: S + '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    printer: S + '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
    sun: S + '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: S + '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    list: S + '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    download: S + '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    close: S + '<path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  window.SMLIcons = ICONS;

  /* Theme toggle — init happens pre-paint in default.html; this wires the button */
  var toggle = document.querySelector(".theme-toggle");
  function paintToggle() {
    if (!toggle) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    toggle.innerHTML = dark ? ICONS.sun : ICONS.moon;
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
    '<button type="button" class="layer-toggle" data-layer="zh" ' +
      'title="汉字 Hanzi — show / hide the characters">汉字</button>' +
    '<button type="button" class="layer-toggle" data-layer="py" ' +
      'title="拼音 Pinyin — show / hide the romanization">拼音</button>' +
    '<button type="button" class="layer-toggle" data-layer="en" ' +
      'title="English — show / hide the gloss">EN</button>' +
    '<button type="button" class="layer-toggle lb-print" aria-label="Print / PDF" ' +
      'title="Print / PDF — prints only the layers you have switched on">' +
      window.SMLIcons.printer + '</button>';
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

/* Click-to-seek + follow-along highlight + player controls (turn-times JSON
   exported by the ytfactory pipeline from the episode's zh-Hans captions).
   No autoplay: playback only ever starts from a user click.
   - ▶ chip / row click  = play from that line (chip on the active line = replay it)
   - click the PLAYING line's text = pause; click again = resume in place
   - sticky-bar ⏯ = pause/resume anywhere; 🔁 = loop the current line */
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
  function turnTime(i) {
    if (i < 0 || i >= turns.length) return NaN;
    return parseFloat(turns[i].getAttribute("data-t"));
  }
  turns.forEach(function (p, i) {
    if (i >= times.length || times[i] == null) return;
    p.classList.add("seekable");
    p.setAttribute("data-t", times[i]);
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "seek-chip";
    chip.innerHTML = window.SMLIcons.play + " " + fmt(times[i]);
    chip.title = "Play from this line (click again to replay it)";
    p.insertBefore(chip, p.firstChild);
  });

  /* player controls in the sticky layer bar */
  var bar = document.querySelector(".layer-bar");
  var btnPlay = null, btnLoop = null, btnRate = null, timeLabel = null;
  if (bar) {
    var sep = document.createElement("span");
    sep.className = "pctl-sep";
    btnPlay = document.createElement("button");
    btnPlay.type = "button";
    btnPlay.className = "pctl pctl-play";
    btnPlay.innerHTML = window.SMLIcons.play;
    btnPlay.title = "Play / pause";
    btnPlay.setAttribute("aria-label", "Play / pause");
    btnLoop = document.createElement("button");
    btnLoop.type = "button";
    btnLoop.className = "pctl pctl-loop";
    btnLoop.innerHTML = window.SMLIcons.loop;
    btnLoop.title = "Loop the current line";
    btnLoop.setAttribute("aria-label", "Loop the current line");
    btnRate = document.createElement("button");
    btnRate.type = "button";
    btnRate.className = "pctl pctl-rate";
    btnRate.textContent = "1\u00D7";
    btnRate.title = "Playback speed \u2014 slow it down to shadow along";
    btnRate.setAttribute("aria-label", "Playback speed");
    timeLabel = document.createElement("span");
    timeLabel.className = "pctl-time";
    bar.appendChild(sep);
    bar.appendChild(btnPlay);
    bar.appendChild(btnLoop);
    bar.appendChild(btnRate);
    bar.appendChild(timeLabel);
  }

  var player = null, ready = false, pendingSeek = null;

  /* playback speed — the whole channel is about slowing down, so make it
     one tap: 1× → 0.75× → 0.5× → 1× (remembered across pages) */
  var RATES = [1, 0.75, 0.5];
  var rate = 1;
  try { rate = parseFloat(localStorage.getItem("sml_rate")) || 1; } catch (e) {}
  if (RATES.indexOf(rate) === -1) rate = 1;
  function paintRate() {
    if (!btnRate) return;
    btnRate.textContent = rate + "×";
    btnRate.classList.toggle("on", rate !== 1);
  }
  function applyRate() {
    if (ready && typeof player.setPlaybackRate === "function") player.setPlaybackRate(rate);
  }
  if (btnRate) {
    paintRate();
    btnRate.addEventListener("click", function () {
      rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
      try { localStorage.setItem("sml_rate", String(rate)); } catch (e) {}
      paintRate();
      applyRate();
    });
  }

  /* resume memory — most learners don't finish an episode in one sitting */
  var posKey = "sml_pos_" + location.pathname;
  var savedPos = 0;
  try { savedPos = parseFloat(localStorage.getItem(posKey)) || 0; } catch (e) {}
  var resumePill = null;
  function hideResume() {
    if (resumePill) { resumePill.parentNode.removeChild(resumePill); resumePill = null; }
  }
  if (savedPos >= 45) {
    resumePill = document.createElement("button");
    resumePill.type = "button";
    resumePill.className = "follow-pill resume-pill show";
    resumePill.innerHTML = window.SMLIcons.play + " Continue at " + fmt(savedPos);
    resumePill.title = "Resume where you left off last time";
    document.body.appendChild(resumePill);
    resumePill.addEventListener("click", function () {
      var t = savedPos;
      hideResume();
      seek(Math.max(0, t - 2));
    });
  }
  var lastSaved = 0;
  function savePos(t, dur) {
    if (t < 20 || (dur && t > dur - 45)) {
      if (lastSaved) { try { localStorage.removeItem(posKey); } catch (e) {} }
      lastSaved = 0;
      return;
    }
    if (Math.abs(t - lastSaved) < 3) return;
    lastSaved = t;
    try { localStorage.setItem(posKey, String(Math.floor(t))); } catch (e) {}
  }

  function create() {
    if (player || !(window.YT && window.YT.Player)) return;
    player = new YT.Player(iframe, {
      events: {
        onReady: function () {
          ready = true;
          applyRate();
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
  function seek(t) { setFollow(true); if (ready) doSeek(t); else pendingSeek = t; }
  function playing() { return ready && player.getPlayerState() === 1; }
  window.SMLPlayer = function () { return player; }; /* debug hook */

  /* smart follow-scroll: track the playing line while the user's hands are
     off; ANY manual scroll intent pauses following, the pill (or clicking a
     line) resumes it */
  var follow = true;
  var followPill = document.createElement("button");
  followPill.type = "button";
  followPill.className = "follow-pill";
  followPill.innerHTML = window.SMLIcons.download + " Follow audio";
  followPill.title = "Scroll back to the playing line and keep following";
  document.body.appendChild(followPill);
  function setFollow(on) { follow = on; }
  function scrollToCurrent() {
    if (current < 0) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    turns[current].scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }
  followPill.addEventListener("click", function () { setFollow(true); scrollToCurrent(); });
  ["wheel", "touchmove"].forEach(function (ev) {
    window.addEventListener(ev, function () { setFollow(false); }, { passive: true });
  });
  window.addEventListener("keydown", function (e) {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].indexOf(e.key) > -1)
      setFollow(false);
  });

  var loopOn = false, loopIdx = -1, current = -1;

  if (btnPlay) btnPlay.addEventListener("click", function () {
    if (!ready) { seek(0); return; }
    if (playing()) player.pauseVideo(); else player.playVideo();
  });
  if (btnLoop) btnLoop.addEventListener("click", function () {
    loopOn = !loopOn;
    btnLoop.classList.toggle("on", loopOn);
    if (loopOn) loopIdx = current;
  });

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
    var idx = turns.indexOf(el);
    var t = parseFloat(el.getAttribute("data-t"));
    if (isNaN(t)) return;
    /* row click on the active line toggles pause/resume in place;
       the chip always (re)starts the line — that's the repeat gesture */
    if (!chip && ready && idx === current) {
      if (playing()) { player.pauseVideo(); return; }
      if (player.getPlayerState() === 2) { player.playVideo(); return; }
    }
    if (loopOn) loopIdx = idx;
    seek(Math.max(0, t - 0.2));
  });

  function nextTime(i) {
    for (var j = i + 1; j < turns.length; j++) {
      var tj = turnTime(j);
      if (!isNaN(tj)) return tj;
    }
    return ready && player.getDuration ? player.getDuration() : NaN;
  }

  var lastPlayIcon = "";
  setInterval(function () {
    if (!ready) return;
    var st = player.getPlayerState();
    var icon = st === 1 ? "pause" : "play";
    if (btnPlay && icon !== lastPlayIcon) {
      btnPlay.innerHTML = window.SMLIcons[icon];
      lastPlayIcon = icon;
    }
    followPill.classList.toggle("show", !follow && st === 1);
    if (timeLabel && typeof player.getCurrentTime === "function")
      timeLabel.textContent = fmt(player.getCurrentTime() || 0);
    if (st !== 1) return;
    hideResume();
    savePos(player.getCurrentTime() || 0,
      typeof player.getDuration === "function" ? player.getDuration() || 0 : 0);
    var t = player.getCurrentTime(), idx = -1;
    for (var i = 0; i < turns.length; i++) {
      var ti = turnTime(i);
      if (isNaN(ti)) continue;
      if (ti <= t + 0.3) idx = i;
      else break;
    }
    if (idx !== current) {
      if (current > -1) turns[current].classList.remove("now");
      if (idx > -1) turns[idx].classList.add("now");
      current = idx;
      if (follow && current > -1) scrollToCurrent();
    }
    /* sentence loop: jump back at the line's end; re-anchor if the user
       scrubbed far away instead of fighting them */
    if (loopOn) {
      if (loopIdx < 0) loopIdx = idx;
      var start = turnTime(loopIdx), end = nextTime(loopIdx);
      if (isNaN(start) || isNaN(end)) return;
      if (t > end + 2 || t < start - 2) loopIdx = idx;
      else if (t >= end - 0.2) player.seekTo(Math.max(0, start - 0.2), true);
    }
  }, 300);
})();

/* Home page: HSK level filter over the episode cards */
(function () {
  "use strict";
  var grid = document.querySelector(".cards");
  if (!grid) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll(".cards .card[data-hsk]"));
  if (cards.length < 4) return;
  var seen = [];
  cards.forEach(function (c) {
    var v = c.getAttribute("data-hsk");
    if (seen.indexOf(v) === -1) seen.push(v);
  });
  seen.sort();
  var bar = document.createElement("div");
  bar.className = "filter-bar";
  bar.innerHTML = '<span class="lb-label">Level</span>';
  ["All"].concat(seen).forEach(function (v) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "layer-toggle" + (v === "All" ? " on" : "");
    b.setAttribute("data-hsk", v);
    b.textContent = v;
    bar.appendChild(b);
  });
  grid.parentNode.insertBefore(bar, grid);
  bar.addEventListener("click", function (ev) {
    var btn = ev.target.closest("button[data-hsk]");
    if (!btn) return;
    var want = btn.getAttribute("data-hsk");
    bar.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b === btn); });
    cards.forEach(function (c) {
      c.style.display = want === "All" || c.getAttribute("data-hsk") === want ? "" : "none";
    });
  });
})();

/* Focus mode (wide screens): dock the player small in the corner so the notes
   take the full width — audio keeps playing, the player stays VISIBLE (YouTube
   embeds must never be hidden or undersized, or watch time is discounted). */
(function () {
  "use strict";
  var col = document.querySelector(".video-col");
  var hint = document.querySelector(".video-hint");
  if (!col || !hint) return;
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "focus-toggle";
  btn.textContent = "\u2913 Focus mode";
  btn.title = "Dock the player to the corner and read full-width";
  hint.appendChild(btn);
  var exit = document.createElement("button");
  exit.type = "button";
  exit.className = "focus-exit";
  exit.textContent = "\u2922 Expand player";
  col.insertBefore(exit, col.firstChild);
  function apply(on) {
    document.body.classList.toggle("focus-mode", on);
    try { localStorage.setItem("sml_focus", on ? "1" : "0"); } catch (e) {}
  }
  btn.addEventListener("click", function () { apply(true); });
  exit.addEventListener("click", function () { apply(false); });
  var stored = null;
  try { stored = localStorage.getItem("sml_focus"); } catch (e) {}
  if (stored === "1") apply(true);
})();
