#!/usr/bin/env node

/**
 * update-schema.js
 * Updates dateModified / lastReviewed fields in all JSON-LD structured data blocks
 */

const fs = require('fs');
const path = require('path');

const now = new Date().toISOString();

// Helper: Update JSON-LD timestamps
function updateJsonLdTimestamps(content) {
  // Update dateModified in JSON-LD blocks
  content = content.replace(
    /"dateModified":\s*"[^"]*"/g,
    `"dateModified": "${now}"`
  );

  // Update lastReviewed in JSON-LD blocks
  content = content.replace(
    /"lastReviewed":\s*"[^"]*"/g,
    `"lastReviewed": "${now}"`
  );

  return content;
}

// Apply to HTML files
const pagesDir = path.join(__dirname, '..');
const htmlFiles = ['index.html', 'pay-without-login.html', 'updates.html'];

htmlFiles.forEach(filename => {
  const filePath = path.join(pagesDir, filename);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count JSON-LD blocks before update
  const jsonLdCount = (content.match(/"dateModified"/g) || []).length;
  
  content = updateJsonLdTimestamps(content);
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filename}`);
  console.log(`   - Updated ${jsonLdCount} JSON-LD timestamp(s)`);
  console.log(`   - Timestamp: ${now}`);
});

console.log(`\n📅 All schema timestamps updated to: ${now}`);
