---
layout: home
title: Slow Mandarin Lab · Study Notes
---

<div class="hero">
  <img class="hero-logo" src="{{ '/assets/img/logo.png' | relative_url }}" alt="Slow Mandarin Lab — 慢">
  <h1>Slow Mandarin Lab</h1>
  <p class="tagline-zh">听懂完整意思，再开口使用。</p>
  <p class="tagline-en">Slow enough to follow. Complete enough to use.<br>
  Two native hosts, natural conversations, and whole-sentence captions in
  <strong>Hanzi + pinyin + English</strong> — so you follow complete Mandarin thoughts,
  not isolated words.</p>
  <a class="btn btn-coral" href="https://www.youtube.com/@SlowMandarinLab" target="_blank" rel="noopener">▶ Watch on YouTube</a>
  <a class="btn btn-ghost" href="https://open.spotify.com/show/033Llgmynn7dS3qmLspdA2" target="_blank" rel="noopener">🎧 Listen on Spotify</a>
  <p class="start-here">New here? <a href="{{ '/episodes/001-why-you-forget-chinese-words/' | relative_url }}">Start with Episode 1 →</a></p>
</div>

## Episodes

Newest first — every episode gets a free study page: the full transcript (汉字 · pinyin · English, with
switchable layers), key vocabulary, the pattern of the day, and a speaking task.

{% assign eps = site.pages | where_exp: "p", "p.url contains '/episodes/'" | sort: "url" %}
{% assign published = "" | split: "" %}{% assign upcoming = "" | split: "" %}
{% for ep in eps %}{% if ep.youtube_id %}{% assign published = published | push: ep %}{% else %}{% assign upcoming = upcoming | push: ep %}{% endif %}{% endfor %}
{% assign published = published | reverse %}
<div class="cards">
{% for ep in published %}{% assign parts = ep.title | split: " · " %}{% assign num = ep.url | split: "/episodes/" | last | slice: 0, 3 | plus: 0 %}
  <a class="card" {% if ep.hsk %}data-hsk="{{ ep.hsk }}"{% endif %} href="{{ ep.url | relative_url }}">
    <img class="ep-thumb" loading="lazy" width="480" height="270"
      src="https://i.ytimg.com/vi/{{ ep.youtube_id }}/hqdefault.jpg" alt="">
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

## Coming soon 预告

Study pages are already live for the rest of Season 1 — videos are added as they publish.

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

## How to use a study page

1. **Listen first** — play the episode once without reading.
2. **Read along** — replay it with the study page open; use the layer buttons to hide
   pinyin or English when you're ready.
3. **Speak** — do the speed round out loud, then post your sentence in the video comments.
   We read them and reply.

---

慢慢来，比较快。 — *Take it slow; it's faster.*
