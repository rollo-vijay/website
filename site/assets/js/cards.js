import { escapeHtml } from './config.js';
import { diagramSVG } from './diagram.js';

// `root` is the relative path back to the site root from the current page.
export function projectCardHTML(p, root) {
  const thumb = p.blockDiagramImage
    ? `<img src="${root}${escapeHtml(p.blockDiagramImage)}" alt="" loading="lazy">`
    : diagramSVG(p.diagram, { title: `Block diagram: ${p.title}` });
  return `<a class="card tilt project-card reveal" href="${root}projects/${encodeURIComponent(p.slug)}/">
    <div class="project-card__thumb">${thumb}</div>
    <div class="project-card__meta"><span class="tag">${escapeHtml(p.domain)}</span><span>${escapeHtml(p.code)}</span></div>
    <h3>${escapeHtml(p.title)}</h3>
    <p>${escapeHtml(p.abstract)}</p>
  </a>`;
}

export async function loadProjects(root) {
  const res = await fetch(`${root}data/projects.json`);
  if (!res.ok) throw new Error(`Could not load projects (${res.status})`);
  return res.json();
}
