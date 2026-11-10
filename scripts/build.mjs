// Builds the deployable site into dist/:
//   1. copies site/ (except _partials) to dist/
//   2. inserts the shared header/footer and fills {{root}} / {{siteUrl}} in every page
//   3. generates one page per project at dist/projects/<slug>/index.html
//   4. writes sitemap.xml and robots.txt
// No npm dependencies. Run: node scripts/build.mjs
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diagramSVG } from '../site/assets/js/diagram.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'site');
const OUT = join(ROOT, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://rollo-vijay.github.io/website/').replace(/\/?$/, '/');
const WA = '917845576330';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- 1. copy ----------
rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true, filter: (p) => !p.includes(`${sep}_partials`) });

const header = readFileSync(join(SRC, '_partials', 'header.html'), 'utf8');
const footer = readFileSync(join(SRC, '_partials', 'footer.html'), 'utf8');

function finalize(html, root) {
  return html
    .replace('<!-- @header -->', header)
    .replace('<!-- @footer -->', footer)
    .replaceAll('{{root}}', root)
    .replaceAll('{{siteUrl}}', SITE_URL);
}

function rootFor(file) {
  const depth = relative(OUT, dirname(file)).split(sep).filter(Boolean).length;
  return depth ? '../'.repeat(depth) : './';
}

// ---------- 2. existing pages ----------
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const pages = walk(OUT).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  const root = file === join(OUT, '404.html') ? '' : rootFor(file); // 404 uses <base href>
  writeFileSync(file, finalize(readFileSync(file, 'utf8'), root));
}

// ---------- 3. project pages ----------
const projects = JSON.parse(readFileSync(join(SRC, 'data', 'projects.json'), 'utf8'));
const problems = [];
const seen = new Set();
for (const p of projects) {
  for (const k of ['slug', 'code', 'title', 'domain', 'abstract']) if (!p[k]) problems.push(`${p.slug || p.title || '?'}: missing "${k}"`);
  if (!/^[a-z0-9-]+$/.test(p.slug ?? '')) problems.push(`${p.slug}: slug must be lowercase letters, numbers and dashes`);
  if (seen.has(p.slug)) problems.push(`${p.slug}: duplicate slug`);
  seen.add(p.slug);
  const colOf = new Map();
  (p.diagram?.columns ?? []).forEach((col, i) => col.forEach((n) => colOf.set(n, i)));
  for (const e of p.diagram?.edges ?? []) {
    const [a, b] = e.split('>').map((s) => s.trim());
    if (!colOf.has(a) || !colOf.has(b)) problems.push(`${p.slug}: diagram edge "${e}" refers to a block that is not in columns`);
    else if (colOf.get(b) - colOf.get(a) !== 1) console.warn(`Warning: ${p.slug}: edge "${e}" does not go to the next column, so its line may cross other blocks`);
  }
  for (const k of ['blockDiagramImage', 'schematicImage']) {
    if (p[k] && !existsSync(join(SRC, p[k]))) problems.push(`${p.slug}: ${k} file not found: site/${p[k]}`);
  }
}
if (problems.length) {
  console.error('Project data problems:\n  ' + problems.join('\n  '));
  process.exit(1);
}

const template = (p, root) => {
  const url = `${SITE_URL}projects/${p.slug}/`;
  const enquiry = `https://wa.me/${WA}?text=${encodeURIComponent(`Hi iShoweLectro, I'm interested in project ${p.code}: ${p.title}. Please share the details.`)}`;
  const ieee = p.ieee?.title
    ? `<p>${esc(p.ieee.title)}${p.ieee.ref ? `<br><small>${esc(p.ieee.ref)}</small>` : ''}</p>`
    : '<p>The IEEE base paper for this project is shared on enquiry.</p>';
  const block = p.blockDiagramImage
    ? `<img src="${root}${esc(p.blockDiagramImage)}" alt="Block diagram of ${esc(p.title)}" loading="lazy">`
    : diagramSVG(p.diagram, { title: `Block diagram of ${p.title}` });
  const schematic = p.schematicImage
    ? `<figure class="figure"><img src="${root}${esc(p.schematicImage)}" alt="Schematic of ${esc(p.title)}" loading="lazy"><figcaption>Circuit schematic</figcaption></figure>`
    : `<div class="placeholder-box"><p><strong>Schematic shared on enquiry.</strong></p><p>Message us on WhatsApp with code <strong>${esc(p.code)}</strong> to get the full schematic.</p></div>`;
  const related = projects.filter((x) => x.domain === p.domain && x.slug !== p.slug).slice(0, 3);
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description: p.abstract,
    identifier: p.code, about: p.domain, url, publisher: { '@type': 'Organization', name: 'iShoweLectro' },
  };

  return `<!doctype html>
<html lang="en-IN" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(p.title)} (${esc(p.code)}) | iShoweLectro</title>
  <meta name="description" content="${esc(p.abstract)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(p.title)}">
  <meta property="og:description" content="${esc(p.abstract)}">
  <meta property="og:image" content="${SITE_URL}assets/img/og-image.jpg">
  <meta property="og:url" content="${url}">
  <meta name="theme-color" content="#4a0b0e">
  <link rel="icon" href="${root}assets/img/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="${root}assets/img/apple-touch-icon.png">
  <link rel="stylesheet" href="${root}assets/css/styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
  <script type="module" src="${root}assets/js/main.js"></script>
</head>
<body data-page="projects">
  <!-- @header -->
  <main id="main">
    <section class="page-hero">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${root}">Home</a> / <a href="${root}projects/">Projects</a> / <a href="${root}projects/?domain=${encodeURIComponent(p.domain)}">${esc(p.domain)}</a></nav>
        <h1>${esc(p.title)}</h1>
        <p>${esc(p.abstract)}</p>
      </div>
    </section>
    <section class="section" style="padding-top:2.5rem">
      <div class="container detail">
        <article>
          <h2>Block diagram</h2>
          <figure class="figure">${block}<figcaption>How the main parts connect. Scroll sideways on small screens.</figcaption></figure>

          <h2>Schematic</h2>
          ${schematic}

          ${p.features?.length ? `<h2>Key features</h2><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
          ${p.components?.length ? `<h2>Main components</h2><ul>${p.components.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><p style="margin-top:.8rem"><a href="${root}shop/">Buy components in our shop →</a></p>` : ''}

          <h2>IEEE base paper</h2>
          ${ieee}
        </article>
        <aside class="card side-card">
          <dl>
            <dt>Code</dt><dd>${esc(p.code)}</dd>
            <dt>Domain</dt><dd>${esc(p.domain)}</dd>
          </dl>
          <a class="btn btn--whatsapp btn--block" href="${enquiry}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
          <a class="btn btn--ghost btn--block" href="tel:+917845576330">Call +91 78455 76330</a>
          <p class="form-note">Want changes to this project? Tell us your requirement and we'll adapt it.</p>
        </aside>
      </div>
    </section>
    ${related.length ? `<section class="section section--tint">
      <div class="container">
        <h2 style="margin-bottom:1.5rem">More ${esc(p.domain)} projects</h2>
        <div class="grid grid--3">${related.map((r) => `<a class="card tilt project-card" href="${root}projects/${r.slug}/"><div class="project-card__meta"><span class="tag">${esc(r.domain)}</span><span>${esc(r.code)}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.abstract)}</p></a>`).join('')}</div>
      </div>
    </section>` : ''}
  </main>
  <!-- @footer -->
</body>
</html>
`;
};

for (const p of projects) {
  const dir = join(OUT, 'projects', p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), finalize(template(p, '../../'), '../../'));
}

// ---------- 4. sitemap + robots ----------
const urls = ['', 'projects/', 'shop/', ...projects.map((p) => `projects/${p.slug}/`)];
writeFileSync(join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);

const leftovers = walk(OUT).filter((f) => f.endsWith('.html') && /\{\{(root|siteUrl)\}\}|<!-- @(header|footer) -->/.test(readFileSync(f, 'utf8')));
if (leftovers.length) {
  console.error('Unreplaced placeholders in:\n  ' + leftovers.map((f) => relative(OUT, f)).join('\n  '));
  process.exit(1);
}

console.log(`Built ${pages.length} pages + ${projects.length} project pages into dist/ for ${SITE_URL}`);
