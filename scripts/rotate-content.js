'use strict';
/**
 * scripts/rotate-content.js
 *
 * Rotates intro text, lead image, CTA variant, last-verified timestamps,
 * and engagement counters in HTML pages using <!-- DYNAMIC:* --> markers.
 *
 * Uses deterministic hour-based rotation so the same content is produced
 * for the entire hour (idempotent within an hour, changes each hour).
 * Falls back to state file if available for fine-grained tracking.
 *
 * IMPORTANT: Only replaces explicitly marked sections. All other page
 * content is left completely untouched.
 */

const fs = require('fs');
const path = require('path');
const {
  loadJSON,
  writeJSON,
  replaceMarkerContent,
  rotationIndex,
  nowISO,
  nowHuman,
} = require('./utils/helpers');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-config.json');
const STATE_PATH = path.join(ROOT, '.seo-state.json');

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

function loadState() {
  return loadJSON(STATE_PATH) || {};
}

function saveState(state) {
  writeJSON(STATE_PATH, state);
}

// ---------------------------------------------------------------------------
// Engagement counter
// ---------------------------------------------------------------------------

function updateEngagementCounter(state, engagement) {
  const hourSeed = Math.floor(Date.now() / 3600000); // hours since epoch (UTC)
  if (state.lastEngagementHour === hourSeed) return state;

  const span = engagement.incrementMax - engagement.incrementMin + 1;
  const inc = engagement.incrementMin + (hourSeed % span);

  const current = state.viewCount ?? engagement.baseViews;
  const next = Math.min(current + inc, engagement.maxViews);

  const reviews = state.reviewCount ?? engagement.baseReviews;
  const nextReviews = Math.min(reviews + (next % 2 === 0 ? 1 : 0), engagement.maxReviews);

  state.viewCount = next;
  state.reviewCount = nextReviews;
  state.lastEngagementHour = hourSeed;
  return state;
}

// ---------------------------------------------------------------------------
// HTML builders
// ---------------------------------------------------------------------------

function buildIntroHtml(text) {
  return `      ${text}`;
}

function buildLastVerifiedHtml(humanDate, isoDate) {
  return `      <small>Last Reviewed: <strong><time datetime="${isoDate}">${humanDate}</time></strong> • Last Updated: <strong><time datetime="${isoDate}">${humanDate}</time></strong></small>`;
}

function buildLeadImageHtml(imageUrl) {
  return `      <img src="${imageUrl}" alt="Progressive Insurance Bill Pay Guide" loading="lazy" width="1080" height="720" style="width:100%;height:auto;border-radius:8px;" />`;
}

function buildCtaHtml(ctaText) {
  return `      <a href="tel:+18886200950" class="cta-btn" style="background:#FFD700;color:#003366;padding:10px 22px;border-radius:24px;font-weight:700;text-decoration:none;font-size:1em;display:inline-block;">${ctaText}</a>`;
}

function buildEngagementHtml(state, engagement) {
  const views = state.viewCount || engagement.baseViews;
  const reviews = state.reviewCount || engagement.baseReviews;
  const rating = engagement.baseRating;
  return `      <span class="engagement-counter" aria-label="Page statistics">${views.toLocaleString()} helpful views &nbsp;|&nbsp; ⭐ ${rating} (${reviews} reviews)</span>`;
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

function processFile(filePath, config, state) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[rotate-content] File not found, skipping: ${filePath}`);
    return false;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  const markers = config.selectorsOrMarkers;
  const engagement = config.engagement;
  const hourMs = Math.floor(Date.now() / 3600000) * 3600000; // start of current UTC hour
  const humanDate = new Date(hourMs).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const isoDate = new Date(hourMs).toISOString();
  // --- Intro ---
  const introList = config.contentOptions.introVariants;
  const introIdx = rotationIndex(introList.length, 0);
  const introText = introList[introIdx];
  const [introStart, introEnd] = markers.intro;
  html = replaceMarkerContent(html, introStart, introEnd, buildIntroHtml(introText));

  // --- Last verified ---
  const [lvStart, lvEnd] = markers.lastVerified;
  html = replaceMarkerContent(html, lvStart, lvEnd, buildLastVerifiedHtml(humanDate, isoDate));

  // --- Lead image ---
  const imgList = config.imagePool;
  const imgIdx = rotationIndex(imgList.length, 1);
  const imgUrl = imgList[imgIdx];
  const [imgStart, imgEnd] = markers.leadImage;
  html = replaceMarkerContent(html, imgStart, imgEnd, buildLeadImageHtml(imgUrl));

  // --- CTA ---
  const ctaList = config.contentOptions.ctaVariants;
  const ctaIdx = rotationIndex(ctaList.length, 2);
  const ctaText = ctaList[ctaIdx];
  const [ctaStart, ctaEnd] = markers.cta;
  html = replaceMarkerContent(html, ctaStart, ctaEnd, buildCtaHtml(ctaText));

  // --- Engagement counter ---
  const [engStart, engEnd] = markers.engagementCounter;
  html = replaceMarkerContent(html, engStart, engEnd, buildEngagementHtml(state, engagement));

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`[rotate-content] Updated ${path.relative(ROOT, filePath)}`);
    return true;
  } else {
    console.log(`[rotate-content] No changes needed in ${path.relative(ROOT, filePath)}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('[rotate-content] Starting content rotation…');

  const config = loadJSON(CONFIG_PATH);
  if (!config) {
    console.error('[rotate-content] Cannot load config — aborting.');
    process.exit(1);
  }

  let state = loadState();
  state = updateEngagementCounter(state, config.engagement);

  const targetPages = ['index.html', 'pay-without-login.html', 'updates.html'].map((p) =>
    path.join(ROOT, p)
  );

  let anyChanged = false;
  for (const page of targetPages) {
    if (processFile(page, config, state)) {
      anyChanged = true;
    }
  }

  saveState(state);
  console.log(`[rotate-content] State saved to .seo-state.json`);

  if (!anyChanged) {
    console.log('[rotate-content] No HTML files had dynamic markers — nothing rotated.');
  }

  console.log('[rotate-content] Done.');
}

main();
