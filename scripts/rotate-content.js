#!/usr/bin/env node

/**
 * rotate-content.js
 * Rotates intro text, lead image, CTA variant, last-verified timestamps, and engagement counters
 */

const fs = require('fs');
const path = require('path');

// Load config and state
const configPath = path.join(__dirname, '..', 'config', 'seo-config.json');
const statePath = path.join(__dirname, '..', '.seo-state.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

// Helper: Get random item from array
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Rotate intro text
const newIntro = getRandomItem(config.contentOptions.introVariants);

// Rotate CTA button text
const newCTA = getRandomItem(config.contentOptions.ctaVariants);

// Rotate lead image
const newImage = getRandomItem(config.imagePool);

// Update timestamps
const now = new Date();
const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const isoDate = now.toISOString();

// Update engagement counters
const { baseViews, maxViews, incrementMin, incrementMax, baseReviews, maxReviews } = config.engagement;
const viewIncrement = Math.floor(Math.random() * (incrementMax - incrementMin + 1)) + incrementMin;
const reviewIncrement = Math.floor(Math.random() * 3);

state.viewCount = Math.min(state.viewCount + viewIncrement, maxViews);
state.reviewCount = Math.min(state.reviewCount + reviewIncrement, maxReviews);
state.lastEngagementHour = Math.floor(Date.now() / (60 * 60 * 1000));

// Save updated state
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

const engagement = `${state.viewCount.toLocaleString()} helpful views &nbsp;|&nbsp; ⭐ ${config.engagement.baseRating} (${state.reviewCount} reviews)`;

// Apply to HTML files
const pagesDir = path.join(__dirname, '..');
const htmlFiles = ['index.html', 'pay-without-login.html', 'updates.html'];

htmlFiles.forEach(filename => {
  const filePath = path.join(pagesDir, filename);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Rotate intro
  content = content.replace(
    /<!-- DYNAMIC:INTRO -->[

\S]*?<!-- \/DYNAMIC:INTRO -->/,
    `<!-- DYNAMIC:INTRO -->\n      ${newIntro}\n<!-- /DYNAMIC:INTRO -->`
  );

  // Rotate last verified date
  content = content.replace(
    /<!-- DYNAMIC:LAST-VERIFIED -->[

\S]*?<!-- \/DYNAMIC:LAST-VERIFIED -->/,
    `<!-- DYNAMIC:LAST-VERIFIED -->\n      <small>Last Reviewed: <strong><time datetime="${isoDate}">${dateStr}</time></strong> • Last Updated: <strong><time datetime="${isoDate}">${dateStr}</time></strong></small>\n<!-- /DYNAMIC:LAST-VERIFIED -->`
  );

  // Rotate lead image
  content = content.replace(
    /<!-- DYNAMIC:LEAD-IMAGE -->[

\S]*?<!-- \/DYNAMIC:LEAD-IMAGE -->/,
    `<!-- DYNAMIC:LEAD-IMAGE -->\n      <img src="${newImage}" alt="Progressive Insurance Bill Pay Guide" loading="lazy" width="1080" height="720" style="width:100%;height:auto;border-radius:12px;margin:2em 0;" />\n<!-- /DYNAMIC:LEAD-IMAGE -->`
  );

  // Rotate CTA button
  content = content.replace(
    /<!-- DYNAMIC:CTA -->[

\S]*?<!-- \/DYNAMIC:CTA -->/,
    `<!-- DYNAMIC:CTA -->\n      <a href="tel:+18886200950" class="cta-btn" style="background:#FFD700;color:#003366;padding:10px 22px;border-radius:24px;font-weight:700;text-decoration:none;font-size:1em;display:inline-block;margin:1.5em 0;">${newCTA}</a>\n<!-- /DYNAMIC:CTA -->`
  );

  // Rotate engagement counter
  content = content.replace(
    /<!-- DYNAMIC:ENGAGEMENT -->[

\S]*?<!-- \/DYNAMIC:ENGAGEMENT -->/,
    `<!-- DYNAMIC:ENGAGEMENT -->\n      <span class="engagement-counter" aria-label="Page statistics">${engagement}</span>\n<!-- /DYNAMIC:ENGAGEMENT -->`
  );

  fs.writeFileSync(filePath, content);
  console.log(`✅ Rotated content in: ${filename}`);
});

console.log(`\n📊 Engagement Update:`);
console.log(`   Views: ${state.viewCount} (+${viewIncrement})`);
console.log(`   Reviews: ${state.reviewCount} (+${reviewIncrement})`);
console.log(`   Rating: ${config.engagement.baseRating}⭐`);
