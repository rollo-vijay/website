# iShoweLectro website

Engineering project centre website: 3D home page, project library with one page per project (block diagram and schematic), and an electronics parts shop with WhatsApp ordering and Razorpay payment links.

Live: https://rollo-vijay.github.io/website/

## 3D look
Every page has a photorealistic 3D circuit board behind it (PBR materials, image-based lighting, soft shadows, bloom). The camera flies over the board as you scroll; on the home page the `.scene-gap[data-station="n"]` strips are the "windows" where each close-up lands. It loads after the page, needs WebGL 2, and is skipped on save-data connections, without WebGL, or with `?no3d` in the URL; the normal opaque layout is the fallback. Quality steps down automatically on slow devices.

Source is in `src/scene/` (layout, procedural PCB texture, parts, renderer + camera). After editing it run:
```
npm install
npm run build:scene
```
This bundles three.js and the scene into `site/assets/js/scene3d.js` (commit that file; the deploy does not run npm).

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
  "year": "2025-26",
  "featured": false,
  "abstract": "One or two sentences.",
  "existing": "Problem with the current approach.",
  "proposed": "How this project solves it.",
  "advantages": ["..."],
  "applications": ["..."],
  "hardware": ["ESP32", "MPU6050", "..."],
  "software": ["Arduino IDE"],
  "diagram": {
    "power": "Power Supply (5V)",
    "controller": "ESP32",
    "inputs": ["MPU6050 Accelerometer", "GPS Module"],
    "outputs": ["GSM Module", "Buzzer"],
    "comms": ["Mobile App"]
  },
  "ieee": { "title": "IEEE base paper title", "ref": "Conference/journal, year, DOI" },
  "blockDiagramImage": "",
  "schematicImage": "assets/projects/smart-helmet-accident-detection/schematic.png"
}
```

- `domain` must be one of: ECE, Robotics, PCB Design, Edge AI, Wireless & IoT, Vision, Real-time Hardware, Hardware ML, Software.
- `diagram` draws the block diagram in standard report style: controller in the centre, power supply on top, inputs on the left, outputs on the right, optional `comms` (cloud/app/database) below. All keys except `controller` are optional.
- For software or signal-chain projects use `"diagram": { "flow": ["Dataset", "Preprocessing", "Model", "Result"] }` instead.
- Empty sections (`existing`, `proposed`, `advantages`, …) are simply left out of the page.
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
- `src/scene/` — 3D scene source, bundled by `npm run build:scene`
- `scripts/build.mjs` — generates project pages, sitemap and robots into `dist/`
- `_bmad/`, `_bmad-output/`, `.claude/` — BMAD planning tools and documents (not published)
