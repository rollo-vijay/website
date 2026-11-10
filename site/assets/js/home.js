import { waLink } from './config.js';
import { projectRowHTML, adHTML, loadProjects } from './cards.js';
import { observeReveal } from './main.js';

// Featured projects
const grid = document.getElementById('featured-grid');
if (grid) {
  loadProjects('./')
    .then((projects) => {
      const featured = projects.filter((p) => p.featured).slice(0, 6);
      grid.innerHTML = featured.map((p) => projectRowHTML(p, './')).join('') + adHTML(0);
      const n = document.getElementById('project-total');
      if (n) n.textContent = `${projects.length}+`;
      observeReveal(grid);
    })
    .catch(() => {
      grid.innerHTML = '<p class="empty">Projects could not be loaded. <a href="projects/">Open the catalogue</a>.</p>';
    });
}

// Enquiry form → WhatsApp
const form = document.getElementById('enquiry-form');
const error = document.getElementById('form-error');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const missing = [];
  if (!data.name.trim()) missing.push('name');
  if (!/^[+\d][\d\s-]{7,}$/.test(data.phone.trim())) missing.push('a valid phone number');
  if (!data.message.trim()) missing.push('your requirement');
  if (missing.length) {
    error.textContent = `Please add ${missing.join(', ')}.`;
    error.hidden = false;
    form.querySelector(':invalid, [required]:placeholder-shown')?.focus();
    return;
  }
  error.hidden = true;
  const lines = [
    'Hi iShoweLectro, I have a project enquiry.',
    `Name: ${data.name.trim()}`,
    `Phone: ${data.phone.trim()}`,
    data.college.trim() && `College: ${data.college.trim()}`,
    data.domain && `Domain: ${data.domain}`,
    `Requirement: ${data.message.trim()}`,
  ].filter(Boolean);
  window.open(waLink(lines.join('\n')), '_blank', 'noopener');
});
