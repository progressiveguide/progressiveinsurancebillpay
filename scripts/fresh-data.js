'use strict';
/**
 * scripts/fresh-data.js
 *
 * Generates mock "fresh" data for related searches and latest news,
 * writes it to data/fresh-data.json, and injects it into dynamic
 * marker sections of index.html (and any other configured pages).
 *
 * No external API dependencies — all data is deterministically generated
 * from the current UTC hour so CI runs are repeatable within a given hour.
 */

const fs = require('fs');
const path = require('path');
const { loadJSON, writeJSON, ensureDir, replaceMarkerContent, rotationIndex, nowISO, nowHuman } = require('./utils/helpers');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-config.json');
const DATA_PATH = path.join(ROOT, 'data', 'fresh-data.json');

// ---------------------------------------------------------------------------
// Mock data pools
// ---------------------------------------------------------------------------
const RELATED_SEARCHES_POOL = [
  'progressive bill pay online',
  'pay progressive insurance without login',
  'progressive one-time payment',
  'progressive guest payment',
  'progressive autopay setup',
  'progressive phone payment 1-888-620-0950',
  'progressive quick pay options',
  'pay progressive by phone 24/7',
  'progressive insurance payment methods 2026',
  'progressive bill pay guest checkout',
  'how to pay progressive insurance online',
  'progressive insurance billing support',
  'progressive payment portal',
  'progressive bill pay app',
  'pay progressive with credit card',
  'progressive insurance cancel autopay',
  'progressive payment confirmation',
  'progressive insurance bill due date',
  'progressive insurance payment history',
  'progressive bill pay login',
];

const NEWS_HEADLINES_POOL = [
  'Progressive Insurance Enhances Online Bill Pay Portal with Faster Checkout',
  'Customers Report Smooth One-Time Payment Experience on Progressive.com',
  'Progressive AutoPay Now Supports Google Pay and Apple Pay',
  'Independent Guide: Fastest Ways to Pay Your Progressive Insurance Bill',
  'Progressive Adds Guest Payment Option — No Account Required',
  'Progressive Insurance 24/7 Phone Support Praised by Policyholders',
  'How to Avoid a Lapse: Timely Bill Pay Tips for Progressive Customers',
  'Progressive Insurance Rolls Out Improved Mobile App Billing Features',
  'Paying Progressive Insurance By Phone: What You Need to Know in 2026',
  'AutoPay vs. One-Time Payment: Which Is Better for Progressive Customers?',
  'Progressive Insurance Bill Pay: Complete 2026 Guide Released',
  'Guest Checkout Now Available: Pay Progressive Without an Account',
  'Progressive Insurance Customers Can Now Pay in Under 2 Minutes Online',
  'Progressive Quick Pay: New Features Speed Up the Payment Process',
  'Independent Review: Progressive Insurance Bill Pay is Among the Easiest',
];

// ---------------------------------------------------------------------------

function pickItems(pool, count, offsetSeed) {
  const shuffled = [];
  const base = rotationIndex(pool.length, offsetSeed);
  for (let i = 0; i < count; i++) {
    shuffled.push(pool[(base + i) % pool.length]);
  }
  return shuffled;
}

function generateFreshData(config) {
  const ts = nowISO();
  const humanDate = nowHuman();

  const relatedSearches = pickItems(RELATED_SEARCHES_POOL, 8, 0);

  const newsItems = pickItems(NEWS_HEADLINES_POOL, 5, 5).map((headline, i) => {
    const d = new Date(Date.now() - i * 3600000 * 2);
    return {
      headline,
      timestamp: d.toISOString(),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    };
  });

  return {
    generatedAt: ts,
    humanDate,
    relatedSearches,
    newsItems,
  };
}

function buildRelatedSearchesHtml(searches) {
  const items = searches
    .map(
      (s) =>
        `      <li><a href="https://progressiveguide.github.io/progressiveinsurancebillpay/?q=${encodeURIComponent(s)}" ` +
        `rel="nofollow">${s}</a></li>`
    )
    .join('\n');
  return `    <ul class="related-searches-list">\n${items}\n    </ul>`;
}

function buildNewsTickerHtml(newsItems) {
  const items = newsItems
    .map(
      (n) =>
        `      <li class="news-item"><time datetime="${n.timestamp}">${n.label}</time> — ${n.headline}</li>`
    )
    .join('\n');
  return `    <ul class="news-ticker-list">\n${items}\n    </ul>`;
}

function injectIntoFile(filePath, markers, freshData) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[fresh-data] File not found, skipping: ${filePath}`);
    return;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  const [rsStart, rsEnd] = markers.relatedSearches;
  const [ntStart, ntEnd] = markers.newsTicker;

  html = replaceMarkerContent(html, rsStart, rsEnd, buildRelatedSearchesHtml(freshData.relatedSearches));
  html = replaceMarkerContent(html, ntStart, ntEnd, buildNewsTickerHtml(freshData.newsItems));

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`[fresh-data] Updated dynamic sections in ${path.relative(ROOT, filePath)}`);
  } else {
    console.log(`[fresh-data] No marker sections found in ${path.relative(ROOT, filePath)} — content unchanged`);
  }
}

function main() {
  console.log('[fresh-data] Starting fresh data generation…');

  const config = loadJSON(CONFIG_PATH);
  if (!config) {
    console.error('[fresh-data] Cannot load config — aborting.');
    process.exit(1);
  }

  const freshData = generateFreshData(config);

  // Persist generated data
  ensureDir(path.join(ROOT, 'data'));
  writeJSON(DATA_PATH, freshData);
  console.log(`[fresh-data] Wrote fresh data to data/fresh-data.json`);

  // Inject into HTML pages
  const markers = config.selectorsOrMarkers;
  const targetPages = ['index.html', 'pay-without-login.html', 'updates.html'].map((p) =>
    path.join(ROOT, p)
  );

  for (const page of targetPages) {
    injectIntoFile(page, markers, freshData);
  }

  console.log('[fresh-data] Done.');
}

main();
