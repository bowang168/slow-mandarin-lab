"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CSS = fs.readFileSync(path.join(__dirname, "..", "assets", "css", "style.css"), "utf8");

// brand-color-system v2 (ytfactory scripts/design/brand_color_system.py)
const CORE = {
  "--jade": "#1A8F76",
  "--ink": "#16211F",
  "--paper": "#F5EFE3",
  "--coral": "#F0613E",
};
const SUPPORT = {
  "--jade-light": "#37B89B",
  "--jade-deep": "#0C5C4B",
  "--coral-deep": "#BF4026",
  "--mist": "#DCE8E2",
  "--ink-soft": "#22322F",
};
const SURFACE = {
  "--xuan": "#FAF9F5",
  "--nong-mo": "#172126",
  "--dan-mo": "#878A84",
  "--wusi": "#696C67",
  "--warm-paper": "#F7F4ED",
  "--gold": "#FFD166",
  "--ec-jade": "#1F8A70",
};

function assertTokens(tokens) {
  for (const [name, hex] of Object.entries(tokens)) {
    assert.match(CSS, new RegExp(`${name}: ${hex}`, "i"), `${name} must be ${hex}`);
  }
}

test("core brand tokens mirror brand-color-system v2", () => {
  assertTokens(CORE);
});

test("support ramp tokens mirror brand-color-system v2", () => {
  assertTokens(SUPPORT);
});

test("纸墨 surface tokens mirror brand-color-system v2 §3", () => {
  assertTokens(SURFACE);
});

test("surface tokens stay theme-independent (not overridden in dark theme)", () => {
  const dark = CSS.slice(CSS.indexOf('html[data-theme="dark"]'));
  for (const name of Object.keys(SURFACE)) {
    const redefined = new RegExp(`${name}:`).test(dark.slice(0, dark.indexOf("}")));
    assert.equal(redefined, false, `${name} must not be re-themed`);
  }
});
