import { escapeHtml, waLink } from './config.js';

// `root` is the relative path back to the site root from the current page.
export function projectRowHTML(p, root) {
  const url = `${root}projects/${encodeURIComponent(p.slug)}/`;
  const enquiry = waLink(`Hi iShoweLectro, I'm interested in project ${p.code}: ${p.title}. Please share the abstract and details.`);
  return `<article class="prow reveal">
    <span class="prow__code">${escapeHtml(p.code)}</span>
    <div>
      <h3><a href="${url}">${escapeHtml(p.title)}</a></h3>
      <p>${escapeHtml(p.abstract)}</p>
      <div class="prow__tags">
        <span class="tag tag--brand">${escapeHtml(p.domain)}</span>
        ${p.year ? `<span class="tag">IEEE ${escapeHtml(p.year)}</span>` : ''}
        <span class="tag">Block diagram</span>
      </div>
    </div>
    <div class="prow__actions">
      <a class="btn btn--primary btn--sm" href="${url}">View details</a>
      <a class="btn btn--ghost btn--sm" href="${enquiry}" target="_blank" rel="noopener" aria-label="Enquire about ${escapeHtml(p.code)} on WhatsApp">Enquire</a>
    </div>
  </article>`;
}

export async function loadProjects(root) {
  const res = await fetch(`${root}data/projects.json`);
  if (!res.ok) throw new Error(`Could not load projects (${res.status})`);
  return res.json();
}
