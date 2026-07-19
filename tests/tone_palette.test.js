"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CSS = fs.readFileSync(path.join(__dirname, "..", "assets", "css", "style.css"), "utf8");

const PAPER = ["#3E5678", "#7D5C23", "#306252", "#8C3A30", "#5F6461"];
const INK = ["#8AA4C8", "#C0A05F", "#75AE9B", "#CD8276", "#A9B2AF"];

function luminance(hexColor) {
  const channels = [1, 3, 5].map((offset) => parseInt(hexColor.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("tone palette CSS mirrors the ytfactory PAPER and INK SSOT", () => {
  PAPER.forEach((color, index) => {
    assert.match(CSS, new RegExp(`--tone-paper-${index + 1}: ${color}`, "i"));
  });
  INK.forEach((color, index) => {
    assert.match(CSS, new RegExp(`--tone-ink-${index + 1}: ${color}`, "i"));
  });
  assert.doesNotMatch(CSS, /#2D6FE0|#C8860D|#E04A2F|#6FA8FF|#3FD9B0|#FF7A66|#C7CFD6/i);
});

test("surface palettes meet WCAG AA on every study and print state", () => {
  const surfaces = [
    [PAPER, ["#F5EFE3", "#E3E7DA", "#FAF9F5", "#FFFFFF"]],
    [INK, ["#101A18", "#152B26", "#1C2524"]]
  ];
  for (const [palette, backgrounds] of surfaces) {
    for (const color of palette) {
      for (const background of backgrounds) {
        assert.ok(contrast(color, background) >= 4.5, `${color} fails on ${background}`);
      }
    }
  }
});

test("dark mode selects INK and print always returns to PAPER", () => {
  assert.match(CSS, /html\[data-theme="dark"\][\s\S]*--tone1: var\(--tone-ink-1\)/);
  assert.match(
    CSS,
    /@media print[\s\S]*html\[data-theme="dark"\][\s\S]*--tone1: var\(--tone-paper-1\)/
  );
});
