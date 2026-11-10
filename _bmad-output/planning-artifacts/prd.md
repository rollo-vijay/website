# Product Requirements Document: iShoweLectro Website

**Version:** 2.0 | **Author:** Thala | **Date:** 2026-11-10 | **Input:** product-brief.md, change request 2026-11-10

> v2.0 change: scope grew from a single landing page to a 3D project-centre site with a 500+ project catalogue and an electronics parts shop. See sprint-change note at the end.

## 1. Business
**iShoweLectro** is a project centre in Chromepet, Chennai. It builds projects to students' requirements, offers its own ready-made projects (IEEE-paper based, with block diagrams and schematics), and sells electronics parts.

**Domains:** ECE, Robotics, PCB Design, Edge AI, Wireless & IoT, Vision, Real-time Hardware, Hardware ML, Software.
**Contact:** +91 78455 76330 (phone & WhatsApp), Chromepet, Chennai.

## 2. Goals
1. Showcase 500+ projects so students can find one in their domain quickly.
2. Convert visitors into WhatsApp enquiries (custom project, ready project, or parts order).
3. Sell parts via WhatsApp order or Razorpay Payment Links.
4. Memorable 3D-flavoured brand experience that still loads fast on mobile.
5. $0 hosting on GitHub Pages.

## 3. Functional Requirements
| ID | Requirement |
|---|---|
| FR1 | Shared header (logo, nav: Home, Projects, Shop, Services, Contact; WhatsApp button) and footer on every page; mobile menu < 860px |
| FR2 | Home hero with an interactive 3D scene (three.js), headline, CTAs, key stats |
| FR3 | Domains grid (9 domains), each linking to the catalogue pre-filtered |
| FR4 | Services: "Your requirement" (custom builds) and "Our projects" (ready-made), with a 4-step process |
| FR5 | Featured projects on home, loaded from project data |
| FR6 | Project catalogue page: search, domain filter, result count, paginated/"load more" grid |
| FR7 | **One static page per project**: title, code, domain, abstract, IEEE base-paper reference, features, components, **block diagram**, **schematic**, WhatsApp enquiry button |
| FR8 | Block diagrams rendered as SVG from project data when no image is supplied; schematic shown from an image file, placeholder otherwise |
| FR9 | Parts shop: search, category filter, product cards with price and stock note |
| FR10 | Cart (saved in browser) → "Order on WhatsApp" sends itemised order and total to +91 78455 76330 |
| FR11 | Per-product "Pay online" button when a Razorpay Payment Link is set for that product |
| FR12 | Enquiry form (name, phone, college, domain, requirement) → opens WhatsApp with a pre-filled message |
| FR13 | FAQ (accessible `<details>`) |
| FR14 | SEO: titles, descriptions, Open Graph, JSON-LD (LocalBusiness), generated sitemap.xml, robots.txt |
| FR15 | Custom 404 page |
| FR16 | Auto-deploy to GitHub Pages on push to `main` |
| FR17 | Adding a project or product = editing one JSON file (no HTML editing) |

## 4. Non-Functional Requirements
| ID | Requirement |
|---|---|
| NFR1 | Lighthouse ≥ 90 Performance/Accessibility/SEO on project and shop pages; ≥ 80 Performance on home (3D) |
| NFR2 | WCAG 2.1 AA contrast, keyboard navigation, alt text, focus states |
| NFR3 | 3D scene: pauses when off-screen, caps pixel ratio, falls back to a static background without WebGL or with `prefers-reduced-motion` |
| NFR4 | Works on the latest 2 versions of major browsers, Android and iOS |
| NFR5 | No server; no payment data handled by the site (Razorpay hosts payment) |

## 5. Out of Scope
User accounts, on-site checkout/payment processing, stock management, CMS, testimonials (until real ones are supplied).

## 6. Sprint Change Note (v1 → v2)
- Added: 3D hero, project catalogue + per-project pages, parts shop, WhatsApp ordering, Razorpay links.
- Removed: Formspree contact form (replaced by WhatsApp), testimonials (no real content yet).
- Architecture now needs a small Node build step to generate per-project pages and the sitemap.
