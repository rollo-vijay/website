# Product Requirements Document: Business Landing Page

**Version:** 1.0 | **Author:** Thala | **Date:** 2026-11-10 | **Input:** product-brief.md

## 1. Goals
1. Communicate the business value proposition immediately.
2. Generate qualified leads through a contact form and CTA.
3. Deliver an accessible, fast, mobile-first experience.
4. Zero-cost, low-maintenance hosting on GitHub Pages.

## 2. Functional Requirements
| ID | Requirement |
|---|---|
| FR1 | Sticky header with logo and anchor navigation to all sections |
| FR2 | Mobile hamburger menu below 768px |
| FR3 | Hero: headline, subheadline, primary CTA button scrolling to Contact |
| FR4 | Services section: 3-6 cards (icon, title, description) |
| FR5 | About section: story, mission, optional team photos |
| FR6 | Testimonials section: 3+ quotes with name/company |
| FR7 | FAQ section with accessible expand/collapse (`<details>`) |
| FR8 | Contact form (name, email, message) posting to Formspree; client-side validation; success/error messages |
| FR9 | Footer: address, phone, email, social links, copyright year |
| FR10 | Custom 404 page |
| FR11 | SEO: title, meta description, Open Graph/Twitter tags, `sitemap.xml`, `robots.txt`, JSON-LD LocalBusiness |
| FR12 | Automatic deploy to GitHub Pages on push to `main` |
| FR13 | Optional custom domain via `CNAME` with enforced HTTPS |

## 3. Non-Functional Requirements
| ID | Requirement |
|---|---|
| NFR1 | Lighthouse scores >= 90 in all categories |
| NFR2 | WCAG 2.1 AA: contrast, keyboard navigation, alt text, focus states |
| NFR3 | Total page weight < 500 KB; images WebP/AVIF with `loading="lazy"` |
| NFR4 | Latest 2 versions of Chrome, Firefox, Safari, Edge; iOS/Android |
| NFR5 | No build step required; editable by hand |
| NFR6 | Respects `prefers-reduced-motion` and `prefers-color-scheme` |

## 4. User Journeys
1. **Visitor to Lead:** lands on hero -> scans services -> reads testimonials -> clicks CTA -> submits form -> sees confirmation.
2. **Mobile visitor:** opens menu -> taps Contact -> taps phone number to call.

## 5. Out of Scope
CMS, payments, authentication, analytics dashboards (privacy-friendly analytics may be added later).

## 6. Release Criteria
All FRs implemented, NFR1-NFR3 verified, site live at `https://<user>.github.io/<repo>/` or custom domain.
