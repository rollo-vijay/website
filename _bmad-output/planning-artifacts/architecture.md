# Architecture: iShoweLectro Website

**Version:** 2.0 | **Date:** 2026-11-10 | **Input:** prd.md v2.0

## 1. Overview
Static site: hand-written HTML/CSS/vanilla JS plus JSON data. A dependency-free Node script generates one HTML page per project and the sitemap. GitHub Actions runs the build and publishes `dist/` to GitHub Pages.

```
site/ (source) + site/data/*.json
        │  node scripts/build.mjs   (GitHub Actions)
        ▼
dist/  ── copy of site/ + projects/<slug>/index.html + sitemap.xml
        │  actions/deploy-pages
        ▼
https://rollo-vijay.github.io/website/
        │ enquiry / order
        ▼
WhatsApp (+91 78455 76330)      Razorpay Payment Links (hosted by Razorpay)
```

## 2. Tech Stack
| Concern | Choice |
|---|---|
| Markup / style | Semantic HTML5, one CSS file with design tokens |
| Scripts | Vanilla ES modules, no framework |
| 3D | three.js r128 (UMD from cdnjs), loaded only on the home page |
| Data | `site/data/projects.json`, `site/data/products.json` |
| Build | `scripts/build.mjs` (Node 20+, no npm dependencies) |
| Hosting / CI | GitHub Pages via GitHub Actions |
| Orders | WhatsApp click-to-chat (`wa.me`), Razorpay Payment Links |

## 3. Repository Layout
```
site/
  index.html              home (3D hero, domains, services, featured, FAQ, contact)
  projects/index.html     catalogue (search + filter, client-side from JSON)
  shop/index.html         parts shop + cart
  404.html
  data/projects.json      project records (source of truth)
  data/products.json      product records
  assets/css/styles.css
  assets/js/{main,hero3d,catalogue,shop,config}.js
  assets/img/             logo, icons, og image
  assets/projects/<slug>/ optional block-diagram / schematic images
scripts/build.mjs         copies site → dist, generates project pages + sitemap
.github/workflows/pages.yml
```

## 4. Data Model
**Project**
```json
{
  "slug": "smart-helmet-accident-detection",
  "code": "ISE-IOT-001",
  "title": "...",
  "domain": "Wireless & IoT",
  "featured": true,
  "abstract": "...",
  "ieee": { "title": "", "ref": "" },
  "features": ["..."],
  "components": ["..."],
  "diagram": { "columns": [["Sensor A","Sensor B"],["MCU"],["Output"]], "edges": ["Sensor A>MCU", "MCU>Output"] },
  "blockDiagramImage": "",
  "schematicImage": ""
}
```
**Product**: `{ "id", "name", "category", "price", "unit", "razorpayLink", "note" }`

## 5. Key Decisions
- **ADR-1 Static + JSON:** 500+ projects managed by editing JSON; no CMS or server.
- **ADR-2 Generated per-project pages:** real URLs (`/projects/<slug>/`) for SEO and sharing, so a build step replaces "no build" from v1.
- **ADR-3 SVG block diagrams from data:** every project gets a diagram even before artwork exists; an uploaded image overrides it.
- **ADR-4 WhatsApp as the order channel:** zero cost and familiar to customers; Razorpay Payment Links are optional per product, and no payment data touches the site.
- **ADR-5 Progressive 3D:** three.js loads only on the home page, pauses off-screen, and falls back to CSS.
- **ADR-6 Relative URLs everywhere** so the site works under `/website/` and on a future custom domain.

## 6. Deployment
Workflow: checkout → `node scripts/build.mjs` → `upload-pages-artifact` (path `dist`) → `deploy-pages`. Source setting: GitHub Actions.
Local preview: `node scripts/build.mjs && npx serve dist`.
