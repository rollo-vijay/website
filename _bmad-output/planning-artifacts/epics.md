# Epics & Stories: iShoweLectro Website

**Version:** 2.0 | **Date:** 2026-11-10 | **Inputs:** prd.md v2.0, architecture.md v2.0

## Epic 1: Foundation & Deployment (done)
- 1.1 Repository setup
- 1.2 GitHub Pages pipeline
- 1.3 Design tokens & base styles

## Epic 2: Brand & Home Page
- **2.1 Brand system** - logo assets, maroon/orange tokens, shared header/footer, mobile menu (FR1).
- **2.2 3D hero** (FR2, NFR3) - *AC:* interactive circuit-board scene; pauses off-screen; static fallback.
- **2.3 Domains grid** (FR3) - *AC:* 9 domains link to `projects/?domain=...`.
- **2.4 Services & process** (FR4)
- **2.5 Featured projects** (FR5)
- **2.6 FAQ + contact/enquiry form** (FR12, FR13) - *AC:* form opens WhatsApp with a pre-filled message.

## Epic 3: Project Catalogue
- **3.1 Project data model + sample data** (FR17)
- **3.2 Catalogue page** (FR6) - *AC:* search + domain filter + "load more"; URL keeps the filter.
- **3.3 Build script: per-project pages** (FR7) - *AC:* one page per JSON record at `projects/<slug>/`.
- **3.4 Block-diagram SVG renderer + schematic slot** (FR8)

## Epic 4: Parts Shop
- **4.1 Product data + shop page** (FR9)
- **4.2 Cart + WhatsApp order** (FR10)
- **4.3 Razorpay Payment Link buttons** (FR11)

## Epic 5: SEO, Quality & Launch
- **5.1 SEO metadata, sitemap, robots, JSON-LD** (FR14)
- **5.2 404 page** (FR15)
- **5.3 Accessibility & performance pass** (NFR1-NFR4)
- **5.4 Real content load** - replace sample projects/products with the full 500+ list, real IEEE references, schematics, real prices and Razorpay links.
- **5.5 Custom domain** (optional)
