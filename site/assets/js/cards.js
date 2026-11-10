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
        ${p.highValue ? '<span class="tag tag--gold">High value</span>' : ''}
        ${p.year ? `<span class="tag">IEEE-based ${escapeHtml(p.year)}</span>` : ''}
        ${p.ieee?.title ? '<span class="tag tag--ok">Base paper listed</span>' : ''}
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

const ADS = [
  ['Struggling with your final-year project?', 'Stuck on hardware, code or the report? Our engineers guide you step by step, from block diagram to viva.', 'Hi iShoweLectro, I am struggling with my project and need help.'],
  ['Deadline close and circuit not working?', 'We debug circuits, fix firmware and get your demo running. Send us a photo of your setup.', 'Hi iShoweLectro, my project is not working and my deadline is close. Please help.'],
  ['No idea which project to choose?', 'Tell us your branch and budget. We shortlist 3 projects you can finish and explain confidently.', 'Hi iShoweLectro, please help me choose a final-year project for my branch.'],
  ['Need documentation, PPT and viva prep?', 'Report, PPT, block diagram, schematic and mock viva so you can present with confidence.', 'Hi iShoweLectro, I need help with project report, PPT and viva preparation.'],
];
export function adHTML(i = 0) {
  const [h, t, m] = ADS[i % ADS.length];
  return `<aside class="ad reveal" aria-label="Student help offer">
    <span class="ad__tag">Student help</span>
    <div><h3>${escapeHtml(h)}</h3><p>${escapeHtml(t)}</p></div>
    <div class="prow__actions"><a class="btn btn--whatsapp btn--sm" href="${waLink(m)}" target="_blank" rel="noopener">Get help on WhatsApp</a><a class="btn btn--ghost btn--sm" href="tel:+917845576330">Call now</a></div>
  </aside>`;
}
