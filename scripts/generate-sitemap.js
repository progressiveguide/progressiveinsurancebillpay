'use strict';
/**
 * scripts/generate-sitemap.js
 *
 * Builds sitemap.xml in the repository root with hourly <lastmod> timestamps.
 */

const fs = require('fs');
const path = require('path');
const { loadJSON, nowISO } = require('./utils/helpers');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-config.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

function buildSitemap(pages, lastmod, baseUrl) {
  const urlEntries = pages
    .map((p) => {
      const loc = p === '/' ? `${baseUrl}/` : `${baseUrl}${p}`;
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '    <changefreq>hourly</changefreq>',
        '    <priority>' + (p === '/' ? '1.0' : '0.8') + '</priority>',
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
    '',
  ].join('\n');
}

function main() {
  console.log('[generate-sitemap] Building sitemap.xml…');

  const config = loadJSON(CONFIG_PATH);
  if (!config) {
    console.error('[generate-sitemap] Cannot load config — aborting.');
    process.exit(1);
  }

  const pages = config.paths || ['/'];
  const lastmod = nowISO();
  // Derive base URL from configured sitemap URL (strip trailing /sitemap.xml)
  const baseUrl = (config.indexing.sitemapUrl || '').replace(/\/sitemap\.xml$/i, '') ||
    'https://progressiveguide.github.io/progressiveinsurancebillpay';

  const xml = buildSitemap(pages, lastmod, baseUrl);
  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');

  console.log(`[generate-sitemap] Wrote sitemap.xml with ${pages.length} URL(s), lastmod=${lastmod}`);
  console.log('[generate-sitemap] Done.');
}

main();
