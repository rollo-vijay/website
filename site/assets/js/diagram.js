// Renders a block diagram as an SVG string from project data:
//   { columns: [["A","B"],["C"],["D"]], edges: ["A>C","B>C","C>D"] }
// Pure function with no DOM access, so both the browser and the Node build script use it.

const NODE_W = 150;
const NODE_H = 50;
const COL_GAP = 56;
const ROW_GAP = 22;
const PAD = 24;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(label, max = 17) {
  const words = String(label).split(/\s+/);
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + w).length > max && lines.length < 2) lines.push(w);
    else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
  }
  return lines;
}

let uid = 0;

export function diagramSVG(diagram, { title = 'Block diagram' } = {}) {
  const columns = diagram?.columns ?? [];
  if (!columns.length) return '';
  const id = 'd' + (++uid) + Math.random().toString(36).slice(2, 6);

  const maxRows = Math.max(...columns.map((c) => c.length));
  const innerH = maxRows * NODE_H + (maxRows - 1) * ROW_GAP;
  const width = PAD * 2 + columns.length * NODE_W + (columns.length - 1) * COL_GAP;
  const height = PAD * 2 + innerH;

  const pos = new Map();
  columns.forEach((col, ci) => {
    const colH = col.length * NODE_H + (col.length - 1) * ROW_GAP;
    const top = PAD + (innerH - colH) / 2;
    col.forEach((name, ri) => {
      pos.set(name, { x: PAD + ci * (NODE_W + COL_GAP), y: top + ri * (NODE_H + ROW_GAP) });
    });
  });

  const edges = (diagram.edges ?? [])
    .map((e) => e.split('>').map((s) => s.trim()))
    .filter(([a, b]) => pos.has(a) && pos.has(b))
    .map(([a, b]) => {
      const p = pos.get(a);
      const q = pos.get(b);
      const x1 = p.x + NODE_W;
      const y1 = p.y + NODE_H / 2;
      const x2 = q.x - 4;
      const y2 = q.y + NODE_H / 2;
      const mx = (x1 + x2) / 2;
      return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" class="e" marker-end="url(#${id}a)"/>`;
    })
    .join('');

  const nodes = [...pos.entries()]
    .map(([name, { x, y }]) => {
      const lines = wrap(name);
      const startY = y + NODE_H / 2 - ((lines.length - 1) * 15) / 2;
      const text = lines
        .map((l, i) => `<text x="${x + NODE_W / 2}" y="${startY + i * 15}" dominant-baseline="middle">${esc(l)}</text>`)
        .join('');
      return `<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="10"/>${text}`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<defs>
<marker id="${id}a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffa24a"/></marker>
<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1318"/><stop offset="1" stop-color="#24090d"/></linearGradient>
<style>
#${id}w rect{fill:url(#${id}g);stroke:#ff7a2a;stroke-width:1.6}
#${id}w text{fill:#fbeee8;font:600 13px system-ui,-apple-system,"Segoe UI",sans-serif;text-anchor:middle}
#${id}w .e{fill:none;stroke:#ffa24a;stroke-width:1.8;opacity:.9}
</style>
</defs>
<g id="${id}w">${edges}${nodes}</g>
</svg>`;
}
