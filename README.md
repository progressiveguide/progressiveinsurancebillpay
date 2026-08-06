# Progressive Insurance Bill Pay

Welcome to **Progressive Insurance Bill Pay** – your user-focused, up-to-date web guide for everything related to managing and paying Progressive Insurance bills.

## What’s Inside

- **index.html**: Modern, SEO-optimized, human-style, long-form help page (all payment methods, detailed FAQ, how-to, blog, and more).
- **robots.txt**: Ensures friendly search engine indexing for your published GitHub Pages site.
- **.gitignore**: Keeps your repo clean and free from unnecessary files.

## How to Use

1. **Deploy for Free on GitHub Pages:**
   - Push all files to your repo (`main` or `gh-pages` branch).
   - In repository Settings > Pages, select your branch and `/` root to publish.
   - Your help site will be live at:  
     `https://progressiveguide.github.io/progressiveinsurancebillpay/`

2. **Custom Domain?**  
   Add a `CNAME` file with your domain name.

3. **Edit or Expand:**  
   The HTML is designed for easy manual expansion – extend blogs, FAQs, or payment help to reach high word-count and SEO authority.

## For Questions
# Progressive Insurance Bill Pay

Publisher: Insurance Bill Help

This repository contains an informational insurance billing and payment guide.

The content is independently published for informational and educational purposes.

Last Updated: May 25, 2026
## Disclaimer

This project is not affiliated with, endorsed, or authorized by Progressive Insurance. All names and company references are for guidance only. Please see the disclaimer at the bottom of the included HTML page.

---

## Automated SEO Freshness System

This repository includes an automated hourly SEO freshness system that keeps page content, timestamps, and sitemaps up to date for improved search engine indexing.

### How It Works

A GitHub Actions workflow (`.github/workflows/seo-battle.yml`) runs every hour and executes the following scripts in order:

| Script | Purpose |
|--------|---------|
| `scripts/fresh-data.js` | Generates mock trending searches and news headlines, writes to `data/fresh-data.json`, injects into dynamic marker sections |
| `scripts/rotate-content.js` | Rotates intro text, lead image, CTA variant, last-verified timestamps, and engagement counters |
| `scripts/update-schema.js` | Updates `dateModified` / `lastReviewed` fields in all JSON-LD structured data blocks |
| `scripts/generate-sitemap.js` | Rebuilds `sitemap.xml` with current hourly `<lastmod>` timestamps |
| `scripts/notify-indexing.js` | Pings Google/Bing sitemap endpoints and sends webhooks to configured indexing services |

### Dynamic Content Markers

Pages use HTML comment markers to define sections that the scripts update. Only content **between** these markers is ever modified — all surrounding page content is left untouched.

```html
<!-- DYNAMIC:INTRO -->
<p>Your rotating intro text here</p>
<!-- /DYNAMIC:INTRO -->

<!-- DYNAMIC:LAST-VERIFIED -->
<small>Last Reviewed: <strong>August 6, 2026</strong> • Last Updated: <strong>August 6, 2026</strong></small>
<!-- /DYNAMIC:LAST-VERIFIED -->

<!-- DYNAMIC:LEAD-IMAGE -->
<img src="..." alt="..." />
<!-- /DYNAMIC:LEAD-IMAGE -->

<!-- DYNAMIC:CTA -->
<a href="tel:+18886200950" class="cta-btn">Pay Your Bill Now →</a>
<!-- /DYNAMIC:CTA -->

<!-- DYNAMIC:ENGAGEMENT -->
<span>4,812 helpful views | ⭐ 4.7 (313 reviews)</span>
<!-- /DYNAMIC:ENGAGEMENT -->

<!-- DYNAMIC:RELATED-SEARCHES -->
<ul class="related-searches-list">...</ul>
<!-- /DYNAMIC:RELATED-SEARCHES -->

<!-- DYNAMIC:NEWS-TICKER -->
<ul class="news-ticker-list">...</ul>
<!-- /DYNAMIC:NEWS-TICKER -->
```

### Configuration

All configurable options live in `config/seo-config.json`:

- **`contentOptions.introVariants`** — 3–5 intro text variants rotated hourly
- **`contentOptions.ctaVariants`** — CTA button text variants
- **`imagePool`** — Lead image URLs rotated hourly
- **`indexing.sitemapUrl`** — Full URL to `sitemap.xml`
- **`indexing.pingUrls`** — Google/Bing ping URL prefixes
- **`indexing.webhookEndpoints`** — Additional webhook endpoints (array, may be empty)
- **`paths`** — Page paths included in the sitemap
- **`engagement`** — Base values and increment bounds for engagement counters

### Running Scripts Locally

```bash
npm run fresh-data        # Generate fresh data and inject into pages
npm run rotate-content    # Rotate intro/image/CTA/timestamps
npm run update-schema     # Update JSON-LD freshness fields
npm run generate-sitemap  # Rebuild sitemap.xml
npm run notify-indexing   # Ping search engines (requires network)
npm run seo-update        # Run all scripts in sequence
```

State is persisted in `.seo-state.json` (committed to repo) to track engagement counter values across runs.
