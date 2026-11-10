# iShoweLectro website

Engineering project centre website: 3D home page, project library with one page per project (block diagram and schematic), and an electronics parts shop with WhatsApp ordering and Razorpay payment links.

Live: https://rollo-vijay.github.io/website/

## Preview locally
```
npm run preview
```
This builds into `dist/` and serves it (needs Node 20+).

## Add or edit a project
Edit [`site/data/projects.json`](site/data/projects.json). Each project gets its own page at `projects/<slug>/` automatically.

```json
{
  "slug": "smart-helmet-accident-detection",
  "code": "ISE-IOT-001",
  "title": "Smart Helmet with Accident Detection and Alert",
  "domain": "Wireless & IoT",
  "featured": false,
  "abstract": "One or two sentences.",
  "ieee": { "title": "IEEE base paper title", "ref": "Conference/journal, year, DOI" },
  "features": ["..."],
  "components": ["..."],
  "diagram": {
    "columns": [["Sensor A", "Sensor B"], ["ESP32"], ["GSM"]],
    "edges": ["Sensor A>ESP32", "Sensor B>ESP32", "ESP32>GSM"]
  },
  "blockDiagramImage": "",
  "schematicImage": "assets/projects/smart-helmet-accident-detection/schematic.png"
}
```

- `domain` must be one of: ECE, Robotics, PCB Design, Edge AI, Wireless & IoT, Vision, Real-time Hardware, Hardware ML, Software.
- `diagram` draws the block diagram automatically. Blocks are listed left-to-right in `columns`; `edges` are `"From>To"`.
- To use your own drawings instead, put image files in `site/assets/projects/<slug>/` and set `blockDiagramImage` / `schematicImage`.
- The build stops with a clear message if a slug is duplicated, a field is missing, or an image path is wrong.

## Add or edit a shop product
Edit [`site/data/products.json`](site/data/products.json):

```json
{ "id": "esp32-devkit", "name": "ESP32 DevKit V1", "category": "Boards", "price": 420, "unit": "piece", "razorpayLink": "https://rzp.io/l/xxxx", "note": "" }
```
Leave `razorpayLink` empty to show only "Add to cart" (WhatsApp order). Create links in the Razorpay Dashboard → Payment Links / Payment Pages.

## Change the WhatsApp number
Search the repo for `917845576330` and replace it (header, footer, home page, shop, build script, `site/assets/js/config.js`).

## Deploy
Every push to `main` builds and deploys via `.github/workflows/pages.yml`.

## Structure
- `site/` — source pages, styles, scripts and data
- `scripts/build.mjs` — generates project pages, sitemap and robots into `dist/`
- `_bmad/`, `_bmad-output/`, `.claude/` — BMAD planning tools and documents (not published)
