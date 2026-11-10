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
const DOMAINS = ['ECE', 'Power Electronics', 'Robotics', 'PCB Design', 'Edge AI', 'Wireless & IoT', 'Vision', 'Real-time Hardware', 'Hardware ML', 'Software'];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const wa = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

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

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// ---------- 2. existing pages ----------
const pages = walk(OUT).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  const depth = relative(OUT, dirname(file)).split(sep).filter(Boolean).length;
  const root = file === join(OUT, '404.html') ? '' : depth ? '../'.repeat(depth) : './'; // 404 uses <base href>
  writeFileSync(file, finalize(readFileSync(file, 'utf8'), root));
}

// ---------- 3. validate project data ----------
const projects = JSON.parse(readFileSync(join(SRC, 'data', 'projects.json'), 'utf8'));
const problems = [];
const seen = new Set();
for (const p of projects) {
  const id = p.slug || p.title || '?';
  for (const k of ['slug', 'code', 'title', 'domain', 'abstract']) if (!p[k]) problems.push(`${id}: missing "${k}"`);
  if (p.slug && !/^[a-z0-9-]+$/.test(p.slug)) problems.push(`${id}: slug must be lowercase letters, numbers and dashes`);
  if (seen.has(p.slug)) problems.push(`${id}: duplicate slug`);
  seen.add(p.slug);
  if (p.domain && !DOMAINS.includes(p.domain)) problems.push(`${id}: domain "${p.domain}" must be one of: ${DOMAINS.join(', ')}`);
  const d = p.diagram;
  if (!p.blockDiagramImage && !(d && (d.controller || d.flow?.length))) problems.push(`${id}: needs "diagram" (controller/inputs/outputs or flow) or "blockDiagramImage"`);
  for (const k of ['blockDiagramImage', 'schematicImage']) {
    if (p[k] && !existsSync(join(SRC, p[k]))) problems.push(`${id}: ${k} file not found: site/${p[k]}`);
  }
}
if (problems.length) {
  console.error('Project data problems:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// ---------- 4. project pages ----------
const list = (items) => `<ul class="checklist">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
const table = (caption, items) => `<table class="req-table"><caption>${caption}</caption><thead><tr><th scope="col">S.No</th><th scope="col">Item</th></tr></thead><tbody>${items.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x)}</td></tr>`).join('')}</tbody></table>`;

function template(p, root) {
  const url = `${SITE_URL}projects/${p.slug}/`;
  const enquire = wa(`Hi iShoweLectro, I'm interested in project ${p.code}: ${p.title}. Please share the details.`);
  const getDocs = wa(`Hi iShoweLectro, please send the abstract and IEEE base paper for project ${p.code}: ${p.title}.`);
  const isFlow = !p.blockDiagramImage && Array.isArray(p.diagram?.flow);

  const sections = [];
  const add = (id, title, html) => html && sections.push({ id, title, html });

  add('abstract', 'Abstract', `<p>${esc(p.abstract)}</p>`);
  add('existing', 'Existing System', p.existing && `<p>${esc(p.existing)}</p>`);
  add('proposed', 'Proposed System', p.proposed && `<p>${esc(p.proposed)}</p>`);
  add('block-diagram', 'Block Diagram', `<figure class="diagram">${
    p.blockDiagramImage
      ? `<img src="${root}${esc(p.blockDiagramImage)}" alt="Block diagram of ${esc(p.title)}" loading="lazy">`
      : diagramSVG(p.diagram, { title: `Block diagram of ${p.title}` })
  }</figure>${
    p.blockDiagramImage || isFlow ? '' : `<div class="diagram-legend" aria-hidden="true">
      <span style="--c:#d08a00;--f:#fff6e0">Power supply</span><span style="--c:#2f6fd6;--f:#eef5ff">Input</span>
      <span style="--c:#4a0b0e;--f:#7a1418">Controller</span><span style="--c:#2e9a4b;--f:#effaf1">Output</span><span style="--c:#7a4fd6;--f:#f4efff">Communication</span></div>`
  }`);
  const isSoftware = p.domain === 'Software';
  if (!isSoftware || p.schematicImage) add('schematic', 'Circuit Schematic', p.schematicImage
    ? `<figure class="diagram"><img src="${root}${esc(p.schematicImage)}" alt="Circuit schematic of ${esc(p.title)}" loading="lazy"></figure>`
    : `<div class="placeholder-box"><p><strong>Full circuit schematic is shared on enquiry.</strong></p><p>Message us with code <strong>${esc(p.code)}</strong>.</p><p style="margin-top:.8rem"><a class="btn btn--whatsapp btn--sm" href="${getDocs}" target="_blank" rel="noopener">Request schematic</a></p></div>`);
  if (p.hardware?.length || p.software?.length) {
    add('requirements', 'Hardware &amp; Software Requirements', `<div class="two-col">${p.hardware?.length ? table('Hardware requirements', p.hardware) : ''}${p.software?.length ? table('Software requirements', p.software) : ''}</div>`);
  }
  add('advantages', 'Advantages', p.advantages?.length && list(p.advantages));
  add('applications', 'Applications', p.applications?.length && list(p.applications));
  add('base-paper', 'IEEE Base Paper', p.ieee?.title
    ? `<p><strong>${esc(p.ieee.title)}</strong>${p.ieee.ref ? `<br><span style="color:var(--muted)">${esc(p.ieee.ref)}</span>` : ''}</p>`
    : `<p>The IEEE base paper for this project is shared on enquiry. <a href="${getDocs}" target="_blank" rel="noopener">Request it on WhatsApp</a>.</p>`);

  const related = projects.filter((x) => x.domain === p.domain && x.slug !== p.slug).slice(0, 4);
  const jsonld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description: p.abstract, identifier: p.code, about: p.domain, url, publisher: { '@type': 'Organization', name: 'iShoweLectro' } };

  return `<!doctype html>
<html lang="en-IN" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(p.title)} | ${esc(p.code)} | iShoweLectro</title>
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
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${root}">Home</a> / <a href="${root}projects/">Projects</a> / <a href="${root}projects/?domain=${encodeURIComponent(p.domain)}">${esc(p.domain)}</a> / ${esc(p.code)}</nav>
        <h1>${esc(p.title)}</h1>
        <div class="meta"><span>${esc(p.code)}</span><span>${esc(p.domain)}</span>${p.year ? `<span>IEEE-based ${esc(p.year)}</span>` : ''}${p.highValue ? '<span>★ High value</span>' : ''}</div>
      </div>
    </section>
    <section class="section" style="padding-top:1.5rem">
      <div class="container detail">
        <article>
          <nav class="toc" aria-label="On this page">${sections.map((s) => `<a href="#${s.id}">${s.title.replace('Hardware &amp; Software Requirements', 'Requirements').replace('Circuit Schematic', 'Schematic')}</a>`).join('')}</nav>
          ${sections.map((s) => `<section class="report-section" id="${s.id}"><h2>${s.title}</h2>${s.html}</section>`).join('\n          ')}
        </article>
        <aside class="card side-card">
          <h2>Project details</h2>
          <dl>
            <dt>Code</dt><dd>${esc(p.code)}</dd>
            <dt>Domain</dt><dd>${esc(p.domain)}</dd>
            ${p.year ? `<dt>IEEE year</dt><dd>${esc(p.year)}</dd>` : ''}
            ${p.highValue ? '<dt>Tier</dt><dd>High value</dd>' : ''}
          </dl>
          <a class="btn btn--whatsapp btn--block" href="${enquire}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
          <a class="btn btn--ghost btn--block" href="${getDocs}" target="_blank" rel="noopener">Get abstract &amp; base paper</a>
          <a class="btn btn--ghost btn--block" href="tel:+917845576330">Call +91 78455 76330</a>
          <hr>
          <div class="ad ad--side"><span class="ad__tag">Student help</span><h3>Stuck on this project?</h3><p>We help with circuit, code, report and viva.</p><a class="btn btn--whatsapp btn--sm" href="${enquire}" target="_blank" rel="noopener">Ask an engineer</a></div>
          <hr>
          <p class="form-note">Need changes? Tell us your requirement and we'll adapt this project for you.</p>
          ${p.hardware?.length && !isSoftware ? `<a class="btn btn--primary btn--sm" href="${root}shop/">Buy components</a>` : ''}
        </aside>
      </div>
    </section>
    ${related.length ? `<section class="section section--alt">
      <div class="container">
        <div class="section-head"><div><h2>Related ${esc(p.domain)} projects</h2></div><a class="btn btn--ghost" href="${root}projects/?domain=${encodeURIComponent(p.domain)}">View all</a></div>
        <div class="plist">${related.map((r) => `<article class="prow"><span class="prow__code">${esc(r.code)}</span><div><h3><a href="${root}projects/${r.slug}/">${esc(r.title)}</a></h3><p>${esc(r.abstract)}</p></div><div class="prow__actions"><a class="btn btn--primary btn--sm" href="${root}projects/${r.slug}/">View details</a></div></article>`).join('')}</div>
      </div>
    </section>` : ''}
  </main>
  <!-- @footer -->
</body>
</html>
`;
}

for (const p of projects) {
  const dir = join(OUT, 'projects', p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), finalize(template(p, '../../'), '../../'));
}

// ---------- 5. sitemap + robots ----------
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
