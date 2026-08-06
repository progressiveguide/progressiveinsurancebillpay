'use strict';
/**
 * scripts/update-schema.js
 *
 * Finds JSON-LD <script> blocks in HTML files and updates freshness-related
 * fields (dateModified, lastReviewed) without touching other properties.
 */

const fs = require('fs');
const path = require('path');
const { loadJSON, nowISO } = require('./utils/helpers');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-config.json');

const HTML_FILES = ['index.html', 'pay-without-login.html', 'updates.html'];

/**
 * Update a single parsed JSON-LD object with freshness fields appropriate
 * to its @type. Returns the (potentially modified) object.
 */
function freshenSchema(obj, nowTs) {
  if (!obj || typeof obj !== 'object') return obj;

  const type = obj['@type'];

  // Types that support dateModified
  const modifiableTypes = [
    'WebPage', 'Article', 'NewsArticle', 'BlogPosting',
    'WebSite', 'ItemPage', 'AboutPage', 'FAQPage',
  ];

  if (modifiableTypes.includes(type)) {
    obj['dateModified'] = nowTs;
    if (type === 'FAQPage' || type === 'WebPage' || type === 'ItemPage') {
      obj['lastReviewed'] = nowTs;
    }
  }

  // FAQPage: add dateModified to mainEntity items if present
  if (type === 'FAQPage' && Array.isArray(obj['mainEntity'])) {
    // FAQPage Question items don't carry dateModified per schema.org spec;
    // we only update the parent.
  }

  return obj;
}

/**
 * Process all JSON-LD blocks in one HTML file.
 */
function processFile(filePath, nowTs) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[update-schema] File not found, skipping: ${filePath}`);
    return false;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  // Match <script type="application/ld+json">...</script>
  const re = /(<script\s+type="application\/ld\+json">)([\s\S]*?)(<\/script>)/gi;

  html = html.replace(re, (match, open, jsonContent, close) => {
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e) {
      console.warn(`[update-schema] Could not parse JSON-LD in ${path.basename(filePath)}: ${e.message}`);
      return match; // leave unchanged
    }

    // Handle both single object and @graph array
    if (Array.isArray(parsed)) {
      parsed = parsed.map((item) => freshenSchema(item, nowTs));
    } else if (parsed['@graph']) {
      parsed['@graph'] = parsed['@graph'].map((item) => freshenSchema(item, nowTs));
    } else {
      parsed = freshenSchema(parsed, nowTs);
    }

    const pretty = JSON.stringify(parsed, null, 2)
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n');
    return `${open}\n${pretty}\n${close}`;
  });

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`[update-schema] Updated JSON-LD in ${path.relative(ROOT, filePath)}`);
    return true;
  }

  console.log(`[update-schema] No JSON-LD changes needed in ${path.relative(ROOT, filePath)}`);
  return false;
}

function main() {
  console.log('[update-schema] Updating JSON-LD structured data…');

  const config = loadJSON(CONFIG_PATH);
  if (!config) {
    console.error('[update-schema] Cannot load config — aborting.');
    process.exit(1);
  }

  const nowTs = nowISO();

  for (const file of HTML_FILES) {
    processFile(path.join(ROOT, file), nowTs);
  }

  console.log('[update-schema] Done.');
}

main();
