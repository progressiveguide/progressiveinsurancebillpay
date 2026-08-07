#!/usr/bin/env node

/**
 * generate-sitemap.js
 * Rebuilds sitemap.xml with current hourly lastmod timestamps
 */

const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, '..', 'config', 'seo-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

// Build sitemap XML
const sitemapUrl = config.indexing.sitemapUrl.replace('/sitemap.xml', '');
const pages = config.paths.map(pagePath => {
  const path_clean = pagePath === '/' ? '' : pagePath;
  return `  <url>\n    <loc>${sitemapUrl}${path_clean}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>${pagePath === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
}).join('\n');

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages}\n</urlset>\n`;

// Write sitemap
const pagesDir = path.join(__dirname, '..');
const sitemapPath = path.join(pagesDir, 'sitemap.xml');
fs.writeFileSync(sitemapPath, sitemapContent);

console.log('✅ Sitemap generated:', sitemapPath);
console.log(`   - Base URL: ${sitemapUrl}`);
console.log(`   - Pages included: ${config.paths.length}`);
console.log(`   - Last modified: ${now}`);
console.log(`\n📍 Sitemap entries:`);
config.paths.forEach(p => {
  const fullUrl = sitemapUrl + (p === '/' ? '' : p);
  console.log(`   ${fullUrl}`);
});
