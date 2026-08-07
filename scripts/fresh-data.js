#!/usr/bin/env node

/**
 * fresh-data.js
 * Generates mock trending searches and news headlines
 * Writes to data/fresh-data.json and injects into dynamic marker sections
 */

const fs = require('fs');
const path = require('path');

// Mock data sources
const trendingSearches = [
  'How to pay Progressive insurance online',
  'Progressive bill payment without login',
  'Pay Progressive bill by phone',
  'Progressive AutoPay setup guide',
  'Progressive guest payment options',
  'Progressive one-time payment',
  'Progressive mobile app payment',
  'Pay Progressive insurance quickly',
  'Progressive billing assistance',
  'Does Progressive accept eCheck payments'
];

const newsHeadlines = [
  'Progressive updates payment processing times in 2026',
  'New guest payment option now available 24/7',
  'AutoPay enrollment increases for Progressive policyholders',
  'Mobile app payment method gains popularity',
  'Payment security enhancements announced',
  'Customer satisfaction rates improve with new features',
  'Digital payment methods streamlined',
  'Billing support expanded nationwide'
];

const freshData = {
  timestamp: new Date().toISOString(),
  trendingSearches: trendingSearches.slice(0, 5).map(term => ({
    term,
    volume: Math.floor(Math.random() * 5000) + 1000
  })),
  newsHeadlines: newsHeadlines.slice(0, 4).map((headline, idx) => ({
    id: idx + 1,
    headline,
    date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }))
};

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write fresh data to file
const dataFile = path.join(dataDir, 'fresh-data.json');
fs.writeFileSync(dataFile, JSON.stringify(freshData, null, 2));

console.log('✅ Fresh data generated:', dataFile);
console.log(`   - ${freshData.trendingSearches.length} trending searches`);
console.log(`   - ${freshData.newsHeadlines.length} news headlines`);

// Inject into dynamic markers
const pagesDir = path.join(__dirname, '..');
const htmlFiles = ['index.html', 'pay-without-login.html', 'updates.html'];

htmlFiles.forEach(filename => {
  const filePath = path.join(pagesDir, filename);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Inject related searches
  const relatedSearchesHtml = `<ul class="related-searches-list">${freshData.trendingSearches.map(s => `<li>${s.term} (${s.volume} searches)</li>`).join('')}</ul>`;
  content = content.replace(
    /<!-- DYNAMIC:RELATED-SEARCHES -->[

\S]*?<!-- \/DYNAMIC:RELATED-SEARCHES -->/,
    `<!-- DYNAMIC:RELATED-SEARCHES -->\n    ${relatedSearchesHtml}\n    <!-- /DYNAMIC:RELATED-SEARCHES -->`
  );

  // Inject news ticker
  const newsHtml = `<ul class="news-ticker-list">${freshData.newsHeadlines.map(n => `<li><strong>${n.date}:</strong> ${n.headline}</li>`).join('')}</ul>`;
  content = content.replace(
    /<!-- DYNAMIC:NEWS-TICKER -->[

\S]*?<!-- \/DYNAMIC:NEWS-TICKER -->/,
    `<!-- DYNAMIC:NEWS-TICKER -->\n    ${newsHtml}\n    <!-- /DYNAMIC:NEWS-TICKER -->`
  );

  fs.writeFileSync(filePath, content);
  console.log(`✅ Injected into: ${filename}`);
});
