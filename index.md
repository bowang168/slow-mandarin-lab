---
layout: home
title: Slow Mandarin Lab · Study Notes
---

<div class="hero">
  <img class="hero-logo" src="{{ '/assets/img/logo.png' | relative_url }}" alt="Slow Mandarin Lab — 慢">
  <h1>Slow Mandarin Lab</h1>
  <p class="tagline-zh">听懂完整意思，再开口使用。</p>
  <p class="tagline-en">Slow enough to follow. Complete enough to use.<br>
  Two native hosts, real conversations — every sentence in <strong>汉字 · pinyin · English</strong>.</p>
  <a class="btn btn-coral" href="https://www.youtube.com/@SlowMandarinLab" target="_blank" rel="noopener"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.4v13.2a.5.5 0 0 0 .76.43l10.5-6.6a.5.5 0 0 0 0-.86L8.76 4.97a.5.5 0 0 0-.76.43z"/></svg> Watch on YouTube</a>
  <p class="also-on">Audio-only? Also on <a href="https://open.spotify.com/show/033Llgmynn7dS3qmLspdA2" target="_blank" rel="noopener">Spotify</a>.</p>
  <a class="start-banner" href="{{ '/episodes/016-dont-fear-tones/' | relative_url }}">
    <span class="sb-tag">New here?</span>
    <span class="sb-txt"><strong>Start with Episode 16 — 声调，别怕</strong><span class="sb-sub">a gentle first episode: tones, minus the fear</span></span>
    <span class="sb-arrow" aria-hidden="true">→</span>
  </a>
</div>

## Episodes

Every episode has a free study page — the full transcript in three switchable layers, key vocabulary, and a speaking task.

{% assign eps = site.pages | where_exp: "p", "p.url contains '/episodes/'" | sort: "url" %}
{% assign published = "" | split: "" %}{% assign upcoming = "" | split: "" %}
{% for ep in eps %}{% if ep.youtube_id %}{% assign published = published | push: ep %}{% else %}{% assign upcoming = upcoming | push: ep %}{% endif %}{% endfor %}
{% assign published = published | reverse %}
<div class="cards">
{% for ep in published %}{% assign parts = ep.title | split: " · " %}{% assign num = ep.url | split: "/episodes/" | last | slice: 0, 3 | plus: 0 %}
  <a class="card" {% if ep.hsk %}data-hsk="{{ ep.hsk }}"{% endif %} href="{{ ep.url | relative_url }}">
    <img class="ep-thumb" loading="lazy" width="1280" height="720"
      src="https://i.ytimg.com/vi/{{ ep.youtube_id }}/maxresdefault.jpg"
      onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/{{ ep.youtube_id }}/mqdefault.jpg'" alt="">
    <span class="card-body">
      <span class="ep-no">EP {{ num }}{% if ep.star %} · ⭐{% endif %}</span>
      {% if ep.hsk %}<span class="ep-hsk">{{ ep.hsk }}</span>{% endif %}
      <span class="ep-en">{{ parts[0] }}</span>
      <span class="ep-zh">{{ parts[1] }}</span>
      {% if ep.note %}<span class="ep-note">{{ ep.note }}</span>{% endif %}
    </span>
  </a>
{% endfor %}
</div>

{% if upcoming.size > 0 %}
## Coming soon 预告

Study pages are live already — videos unlock as they publish.

<div class="cards cards-upcoming">
{% for ep in upcoming %}{% assign parts = ep.title | split: " · " %}{% assign num = ep.url | split: "/episodes/" | last | slice: 0, 3 | plus: 0 %}
  <a class="card" {% if ep.hsk %}data-hsk="{{ ep.hsk }}"{% endif %} href="{{ ep.url | relative_url }}">
    <span class="card-body">
      <span class="ep-no moon">EP {{ num }}{% if ep.star %} · ⭐{% endif %}</span>
      {% if ep.hsk %}<span class="ep-hsk">{{ ep.hsk }}</span>{% endif %}
      <span class="ep-en">{{ parts[0] }}</span>
      <span class="ep-zh">{{ parts[1] }}</span>
      {% if ep.note %}<span class="ep-note">{{ ep.note }}</span>{% endif %}
    </span>
  </a>
{% endfor %}
</div>
{% endif %}

## How to use a study page

1. **Listen first** — play the episode once, no reading.
2. **Read along** — replay with the study page open; the playing line follows the audio. Hide English first, later 拼音, as you level up.
3. **Speak** — shadow one line at a time: loop it, slow it to 0.75×, say it out loud. Then post your sentence in the comments — we reply.

Every page adds tap-to-define vocabulary, 拼音 above characters, tone colors matching the videos, and one-tap Anki export — open **Aa** on any episode.
