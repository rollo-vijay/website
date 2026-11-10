# Architecture: Business Landing Page

**Version:** 1.0 | **Date:** 2026-11-10 | **Input:** prd.md

## 1. Overview
Static site of hand-written HTML, CSS, and vanilla JavaScript. No framework, no bundler. GitHub Actions publishes the `site/` folder to GitHub Pages.

```
Developer --git push--> GitHub repo (main)
                           |
                           v
                GitHub Actions (pages.yml)
                           | upload-pages-artifact (site/)
                           v
                    GitHub Pages CDN --HTTPS--> Visitor browser
                                                     | form POST
                                                     v
                                               Formspree --> Business email
```

## 2. Tech Stack
| Layer | Choice | Rationale |
|---|---|---|
| Markup | Semantic HTML5 | Accessibility, SEO |
| Styles | CSS3 (custom properties, Grid, Flexbox) | No build step |
| Scripts | Vanilla ES2020 | Tiny payload |
| Forms | Formspree (free tier) | Works with static hosting |
| Hosting | GitHub Pages | Free, HTTPS, CDN |
| CI/CD | GitHub Actions (`actions/deploy-pages`) | Auto deploy |
| QA | Lighthouse, html-validate | Quality gates |

## 3. Repository Structure
```
/
├── site/                  <- the only folder published
│   ├── index.html
│   ├── 404.html
│   ├── assets/
│   │   ├── css/styles.css
│   │   ├── js/main.js
│   │   └── img/           (logo.svg, hero.webp, og-image.png, favicon.svg)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── CNAME              (optional, custom domain)
│   └── .nojekyll
├── .github/workflows/pages.yml
├── _bmad/ , _bmad-output/ , .claude/   (planning/tooling - not published)
└── README.md
```

## 4. Key Design Decisions
- **ADR-1 No framework:** content is static; frameworks add weight with no benefit.
- **ADR-2 Single CSS file with design tokens:** `:root` custom properties for color, spacing, type; dark mode via `prefers-color-scheme`.
- **ADR-3 Progressive enhancement:** nav, FAQ, and form work without JS; JS adds mobile menu toggle and AJAX form submit.
- **ADR-4 Actions-based Pages deploy** of `site/` only, so BMAD planning files stay unpublished.
- **ADR-5 `.nojekyll`** to skip Jekyll processing.

## 5. Deployment
`.github/workflows/pages.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
      - id: deployment
        uses: actions/deploy-pages@v4
```
**Setup:** Repo -> Settings -> Pages -> Source: **GitHub Actions**.
**Custom domain:** add `site/CNAME` + DNS (`A` records to GitHub Pages IPs, or `CNAME` to `<user>.github.io`), then enable **Enforce HTTPS**.

## 6. Security
- HTTPS enforced; no secrets in repo; Formspree honeypot field against spam.
- Content-Security-Policy `<meta>` limiting scripts to `'self'` and `form-action` to Formspree.
