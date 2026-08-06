'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load and parse a JSON file safely. Returns null on error.
 */
function loadJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[utils] Could not load JSON from ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Write JSON to a file, creating parent directories as needed.
 */
function writeJSON(filePath, data, indent = 2) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, indent) + '\n', 'utf8');
}

/**
 * Ensure a directory exists (mkdir -p).
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Replace content between two comment markers in an HTML string.
 * If markers are absent the original string is returned unchanged.
 *
 * @param {string} html       - full file content
 * @param {string} startMarker - e.g. '<!-- DYNAMIC:INTRO -->'
 * @param {string} endMarker   - e.g. '<!-- /DYNAMIC:INTRO -->'
 * @param {string} replacement - new inner content (markers are preserved)
 * @returns {string}
 */
function replaceMarkerContent(html, startMarker, endMarker, replacement) {
  const escapedStart = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escapedStart})[\\s\\S]*?(${escapedEnd})`, 'g');
  if (!re.test(html)) {
    console.warn(`[utils] Markers not found: "${startMarker}" / "${endMarker}" — skipping replacement`);
    return html;
  }
  re.lastIndex = 0;
  return html.replace(re, `$1\n${replacement}\n$2`);
}

/**
 * Deterministic rotation index based on current UTC hour modulo list length.
 */
function rotationIndex(listLength, seed) {
  const now = new Date();
  const hourSeed = Math.floor(now.getTime() / 3600000); // hours since epoch
  return (hourSeed + (seed || 0)) % listLength;
}

/**
 * Return current UTC ISO timestamp string.
 */
function nowISO() {
  return new Date().toISOString();
}

/**
 * Return a human-readable UTC date string like "August 6, 2026".
 */
function nowHuman() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

module.exports = {
  loadJSON,
  writeJSON,
  ensureDir,
  replaceMarkerContent,
  rotationIndex,
  nowISO,
  nowHuman,
};
