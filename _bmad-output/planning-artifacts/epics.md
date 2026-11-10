# Epics & Stories: Business Landing Page

**Date:** 2026-11-10 | **Inputs:** prd.md, architecture.md

## Epic 1: Foundation & Deployment
- **1.1 Repository setup** - git init, folder structure, README, `.nojekyll`, `.gitignore`.
  *AC:* structure matches architecture section 3; pushed to GitHub.
- **1.2 GitHub Pages pipeline** (FR12) - add `pages.yml`; set Pages source to "GitHub Actions".
  *AC:* push to `main` deploys `site/`; site reachable over HTTPS.
- **1.3 Design tokens & base styles** (NFR2, NFR6) - reset, tokens, typography, dark mode.
  *AC:* AA contrast in both themes.

## Epic 2: Page Sections
- **2.1 Header & navigation** (FR1, FR2) - *AC:* sticky; keyboard accessible; hamburger below 768px.
- **2.2 Hero** (FR3) - *AC:* CTA scrolls to `#contact`; hero image optimized.
- **2.3 Services** (FR4) - *AC:* responsive grid 1/2/3 columns.
- **2.4 About** (FR5)
- **2.5 Testimonials** (FR6)
- **2.6 FAQ** (FR7) - *AC:* `<details>/<summary>`; works without JS.
- **2.7 Footer** (FR9) - *AC:* `tel:`/`mailto:` links; auto year.

## Epic 3: Lead Capture
- **3.1 Contact form** (FR8) - *AC:* required-field validation; Formspree submit; honeypot; inline success/error states.

## Epic 4: SEO, Quality & Launch
- **4.1 SEO metadata** (FR11) - meta, OG, JSON-LD, sitemap, robots.
- **4.2 404 page** (FR10)
- **4.3 Performance & accessibility pass** (NFR1-NFR4) - *AC:* Lighthouse >= 90 in all categories.
- **4.4 Custom domain** (FR13, optional) - *AC:* domain resolves; HTTPS enforced.
