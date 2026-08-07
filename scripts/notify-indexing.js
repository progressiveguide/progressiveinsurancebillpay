#!/usr/bin/env node

/**
 * notify-indexing.js
 * Pings Google/Bing sitemap endpoints and sends webhooks to configured indexing services
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, '..', 'config', 'seo-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const sitemapUrl = config.indexing.sitemapUrl;
const pingUrls = config.indexing.pingUrls;
const webhookEndpoints = config.indexing.webhookEndpoints || [];

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'GET',
      timeout: 5000
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          url: url,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        url: url,
        error: err.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        url: url,
        error: 'Timeout',
        success: false
      });
    });

    req.end();
  });
}

/**
 * Notify search engines
 */
async function notifySearchEngines() {
  console.log('🔔 Notifying search engines...\n');

  const requests = pingUrls.map(baseUrl => {
    const fullUrl = baseUrl + sitemapUrl;
    return makeRequest(fullUrl);
  });

  const results = await Promise.all(requests);

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.url}`);
      console.log(`   Status: ${result.status}\n`);
    } else {
      console.log(`⚠️  ${result.url}`);
      console.log(`   Error: ${result.error || 'Status ' + result.status}\n`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`📊 Results: ${successCount}/${results.length} successful`);
}

/**
 * Send webhooks
 */
async function sendWebhooks() {
  if (webhookEndpoints.length === 0) {
    console.log('\n✅ No webhooks configured (skipped)');
    return;
  }

  console.log('\n🌐 Sending webhook notifications...\n');

  const payload = JSON.stringify({
    event: 'sitemap_updated',
    sitemap: sitemapUrl,
    timestamp: new Date().toISOString()
  });

  const requests = webhookEndpoints.map(endpoint => {
    return new Promise((resolve) => {
      const urlObj = new URL(endpoint);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        },
        timeout: 5000
      };

      const req = client.request(endpoint, options, (res) => {
        resolve({
          endpoint,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });

      req.on('error', (err) => {
        resolve({
          endpoint,
          error: err.message,
          success: false
        });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          endpoint,
          error: 'Timeout',
          success: false
        });
      });

      req.write(payload);
      req.end();
    });
  });

  const results = await Promise.all(requests);

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ Webhook: ${result.endpoint}`);
      console.log(`   Status: ${result.status}\n`);
    } else {
      console.log(`⚠️  Webhook: ${result.endpoint}`);
      console.log(`   Error: ${result.error}\n`);
    }
  });
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Starting indexing notifications...\n');
  await notifySearchEngines();
  await sendWebhooks();
  console.log('\n✨ Indexing notifications complete!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
