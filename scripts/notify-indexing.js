'use strict';
/**
 * scripts/notify-indexing.js
 *
 * Sends sitemap ping requests to Google/Bing and POST webhooks to configured
 * endpoints. Logs all results. Exits non-zero only if every notification fails.
 *
 * Uses only Node.js built-in https/http modules — no external dependencies.
 */

const https = require('https');
const http = require('http');
const path = require('path');
const { loadJSON, nowISO } = require('./utils/helpers');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'seo-config.json');

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 10000 }, (res) => {
      res.resume(); // drain the response
      resolve({ status: res.statusCode, url });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

function httpPost(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    };
    const req = mod.request(opts, (res) => {
      res.resume();
      resolve({ status: res.statusCode, url });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

async function pingSearchEngines(pingUrls, sitemapUrl) {
  const results = [];
  for (const base of pingUrls) {
    const fullUrl = base + encodeURIComponent(sitemapUrl);
    try {
      const res = await httpGet(fullUrl);
      if (res.status >= 200 && res.status < 300) {
        console.log(`[notify-indexing] ✓ Ping OK (${res.status}): ${fullUrl}`);
        results.push({ ok: true });
      } else {
        console.warn(`[notify-indexing] ✗ Ping non-2xx (${res.status}): ${fullUrl}`);
        results.push({ ok: false });
      }
    } catch (err) {
      console.warn(`[notify-indexing] ✗ Ping failed: ${fullUrl} — ${err.message}`);
      results.push({ ok: false });
    }
  }
  return results;
}

async function sendWebhooks(webhookEndpoints, sitemapUrl, changedPaths) {
  const results = [];
  if (!webhookEndpoints || webhookEndpoints.length === 0) {
    console.log('[notify-indexing] No webhook endpoints configured — skipping.');
    return results;
  }
  const payload = {
    event: 'sitemap_updated',
    timestamp: nowISO(),
    sitemapUrl,
    changedPaths,
  };
  for (const endpoint of webhookEndpoints) {
    try {
      const res = await httpPost(endpoint, payload);
      if (res.status >= 200 && res.status < 300) {
        console.log(`[notify-indexing] ✓ Webhook OK (${res.status}): ${endpoint}`);
        results.push({ ok: true });
      } else {
        console.warn(`[notify-indexing] ✗ Webhook non-2xx (${res.status}): ${endpoint}`);
        results.push({ ok: false });
      }
    } catch (err) {
      console.warn(`[notify-indexing] ✗ Webhook failed: ${endpoint} — ${err.message}`);
      results.push({ ok: false });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('[notify-indexing] Sending indexing notifications…');

  const config = loadJSON(CONFIG_PATH);
  if (!config) {
    console.error('[notify-indexing] Cannot load config — aborting.');
    process.exit(1);
  }

  const { sitemapUrl, pingUrls, webhookEndpoints } = config.indexing;
  const changedPaths = config.paths || ['/'];

  const pingResults = await pingSearchEngines(pingUrls, sitemapUrl);
  const webhookResults = await sendWebhooks(webhookEndpoints, sitemapUrl, changedPaths);

  const allResults = [...pingResults, ...webhookResults];
  const anySuccess = allResults.some((r) => r.ok);

  if (allResults.length > 0 && !anySuccess) {
    console.error('[notify-indexing] All notifications failed.');
    process.exit(1);
  }

  console.log('[notify-indexing] Done.');
}

main().catch((err) => {
  console.error('[notify-indexing] Unexpected error:', err);
  process.exit(1);
});
