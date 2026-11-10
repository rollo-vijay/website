// Block diagrams in the standard project-report style, as an SVG string.
//
// Hardware ("hub") layout: controller in the centre, power supply above,
// inputs on the left with arrows in, outputs on the right with arrows out,
// optional communication/cloud blocks below with two-way arrows.
//   { "power": "Power Supply 5V", "controller": "ESP32",
//     "inputs": ["MPU6050", "GPS"], "outputs": ["GSM", "Buzzer"], "comms": ["Mobile App"] }
//
// Software / signal-chain ("flow") layout: blocks in sequence, wrapping onto new rows.
//   { "flow": ["Dataset", "Preprocessing", "Model", "Result"] }
//
// Pure function with no DOM access: the browser and the Node build script both use it.

const W = 190;           // side block width
const H = 54;            // block height
const GAP_Y = 18;        // vertical gap between side blocks
const ARROW = 80;        // horizontal arrow length between side blocks and controller
const CTRL_W = 200;
const PAD = 28;
const LABEL = 22;        // space for column captions

const COLORS = {
  input:      { fill: '#eef5ff', stroke: '#2f6fd6', text: '#0f2f66' },
  output:     { fill: '#effaf1', stroke: '#2e9a4b', text: '#0f4a20' },
  controller: { fill: '#7a1418', stroke: '#4a0b0e', text: '#ffffff' },
  power:      { fill: '#fff6e0', stroke: '#d08a00', text: '#5a3b00' },
  comms:      { fill: '#f4efff', stroke: '#7a4fd6', text: '#33196b' },
  flow:       { fill: '#fff3ec', stroke: '#c2410c', text: '#4a1606' },
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(label, max) {
  const words = String(label).split(/\s+/);
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + w).length > max && lines.length < 3) lines.push(w);
    else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
  }
  return lines;
}

function block(x, y, w, h, label, role, { bold = false, size = 14 } = {}) {
  const c = COLORS[role];
  const lines = wrap(label, Math.floor(w / (size * 0.56)));
  const lh = size + 3;
  const y0 = y + h / 2 - ((lines.length - 1) * lh) / 2;
  const text = lines
    .map((l, i) => `<text x="${x + w / 2}" y="${y0 + i * lh}" fill="${c.text}" font-size="${size}" font-weight="${bold ? 700 : 600}">${esc(l)}</text>`)
    .join('');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>${text}`;
}

const arrow = (x1, y1, x2, y2, id, both = false) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="2" marker-end="url(#${id})"${both ? ` marker-start="url(#${id})"` : ''}/>`;

const caption = (x, y, text) =>
  `<text x="${x}" y="${y}" fill="#666" font-size="12" font-weight="700" letter-spacing="1.5">${esc(text)}</text>`;

function wrapSvg(width, height, body, id, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}" font-family="system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif" text-anchor="middle" dominant-baseline="middle">
<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#333"/></marker></defs>
<rect width="${width}" height="${height}" fill="#ffffff"/>
${body}
</svg>`;
}

function hub(d, id, title) {
  const inputs = d.inputs ?? [];
  const outputs = d.outputs ?? [];
  const comms = d.comms ?? [];
  const rows = Math.max(inputs.length, outputs.length, 1);
  const sideH = rows * H + (rows - 1) * GAP_Y;
  const ctrlH = Math.max(sideH, 120);

  const hasLeft = inputs.length > 0;
  const hasRight = outputs.length > 0;
  const leftX = PAD;
  const ctrlX = PAD + (hasLeft ? W + ARROW : 0);
  const rightX = ctrlX + CTRL_W + ARROW;
  const width = (hasRight ? rightX + W : ctrlX + CTRL_W) + PAD;

  let y = PAD;
  let body = '';
  const ctrlCx = ctrlX + CTRL_W / 2;

  // Power supply on top
  if (d.power) {
    const pw = 220;
    body += block(ctrlCx - pw / 2, y, pw, H, d.power, 'power');
    y += H;
    body += arrow(ctrlCx, y, ctrlCx, y + 46, id);
    y += 46;
  }

  const ctrlY = y + LABEL;
  const sideTop = ctrlY + (ctrlH - sideH) / 2;
  if (hasLeft) body += caption(leftX + W / 2, ctrlY - 10, 'INPUTS');
  if (hasRight) body += caption(rightX + W / 2, ctrlY - 10, 'OUTPUTS');

  inputs.forEach((name, i) => {
    const by = sideTop + i * (H + GAP_Y);
    body += block(leftX, by, W, H, name, 'input');
    body += arrow(leftX + W, by + H / 2, ctrlX - 2, by + H / 2, id);
  });
  outputs.forEach((name, i) => {
    const by = sideTop + i * (H + GAP_Y);
    body += arrow(ctrlX + CTRL_W, by + H / 2, rightX - 2, by + H / 2, id);
    body += block(rightX, by, W, H, name, 'output');
  });
  body += block(ctrlX, ctrlY, CTRL_W, ctrlH, d.controller ?? 'Controller', 'controller', { bold: true, size: 16 });

  let bottom = ctrlY + ctrlH;

  // Communication / cloud blocks below, two-way arrows
  if (comms.length) {
    const cw = 170;
    const gap = 24;
    const total = comms.length * cw + (comms.length - 1) * gap;
    const startX = ctrlCx - total / 2;
    const cy = bottom + 56;
    comms.forEach((name, i) => {
      const bx = startX + i * (cw + gap);
      const ax = bx + cw / 2;
      body += arrow(comms.length === 1 ? ctrlCx : ax, bottom + 2, ax, cy - 2, id, true);
      body += block(bx, cy, cw, H, name, 'comms');
    });
    bottom = cy + H;
    // keep the canvas wide enough for the comms row
    const minW = total + PAD * 2;
    if (minW > width) return wrapSvg(minW, bottom + PAD, body, id, title);
  }

  return wrapSvg(Math.max(width, ctrlX + CTRL_W + PAD), bottom + PAD, body, id, title);
}

function flow(d, id, title) {
  const steps = d.flow ?? [];
  const perRow = 4;
  const fw = 170;
  const gapX = 60;
  const gapY = 56;
  const rows = Math.ceil(steps.length / perRow);
  const cols = Math.min(steps.length, perRow);
  const width = PAD * 2 + cols * fw + (cols - 1) * gapX;
  const height = PAD * 2 + rows * H + (rows - 1) * gapY;
  let body = '';
  const pos = steps.map((_, i) => {
    const r = Math.floor(i / perRow);
    let c = i % perRow;
    if (r % 2 === 1) c = perRow - 1 - c; // snake so arrows stay short
    return { x: PAD + c * (fw + gapX), y: PAD + r * (H + gapY) };
  });
  steps.forEach((_, i) => {
    if (i === 0) return;
    const a = pos[i - 1];
    const b = pos[i];
    if (a.y === b.y) {
      const ltr = b.x > a.x;
      body += arrow(ltr ? a.x + fw : a.x, a.y + H / 2, ltr ? b.x - 2 : b.x + fw + 2, b.y + H / 2, id);
    } else {
      body += arrow(a.x + fw / 2, a.y + H, b.x + fw / 2, b.y - 2, id);
    }
  });
  steps.forEach((s, i) => { body += block(pos[i].x, pos[i].y, fw, H, s, 'flow'); });
  return wrapSvg(width, height, body, id, title);
}

let uid = 0;
export function diagramSVG(d, { title = 'Block diagram' } = {}) {
  if (!d) return '';
  const id = `ah${++uid}`;
  if (Array.isArray(d.flow) && d.flow.length) return flow(d, id, title);
  if (d.controller) return hub(d, id, title);
  return '';
}
