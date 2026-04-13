// ─────────────────────────────────────────────
//  SCOUTi Analyst — Pitch Canvas
// ─────────────────────────────────────────────

const canvas = document.getElementById('pitch-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Winger ideal zones — wide channels + half-spaces, both sides
const ZONES_WINGER = [
  { x: 0.02, y: 0.08, w: 0.22, h: 0.55 },  // Left wide channel
  { x: 0.76, y: 0.08, w: 0.22, h: 0.55 },  // Right wide channel
  { x: 0.18, y: 0.08, w: 0.22, h: 0.40 },  // Left half-space
  { x: 0.60, y: 0.08, w: 0.22, h: 0.40 },  // Right half-space
];

// Central mid ideal zones — central corridor, half-spaces centrally, press zones
const ZONES_CM = [
  { x: 0.30, y: 0.08, w: 0.40, h: 0.30 },  // Central attacking third — between lines
  { x: 0.22, y: 0.22, w: 0.20, h: 0.30 },  // Left central half-space
  { x: 0.58, y: 0.22, w: 0.20, h: 0.30 },  // Right central half-space
  { x: 0.28, y: 0.38, w: 0.44, h: 0.22 },  // Central midfield press zone
];

function getZones() {
  const pos = document.getElementById('position-select')
    ? document.getElementById('position-select').value
    : 'winger';
  return pos === 'cm' ? ZONES_CM : ZONES_WINGER;
}

function classifyZone(nx, ny) {
  for (const z of getZones()) {
    if (nx >= z.x && nx <= z.x + z.w && ny >= z.y && ny <= z.y + z.h) {
      return 'ideal';
    }
  }
  if (ny < 0.6) return 'partial';
  return 'poor';
}

function drawPitch(points) {
  const zones = getZones();
  const pos = document.getElementById('position-select')
    ? document.getElementById('position-select').value
    : 'winger';
  const zoneLabel = pos === 'cm' ? 'CM ideal' : 'Winger ideal';

  // Update legend label dynamically
  const legendZoneEl = document.getElementById('legend-zone-label');
  if (legendZoneEl) legendZoneEl.textContent = zoneLabel;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#0d1a12';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 4);
  ctx.fill();

  // Alternating stripe
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'rgba(255,255,255,0.024)';
    ctx.fillRect(i * (W / 8), 0, W / 8, H);
  }

  // Ideal zone overlays
  ctx.fillStyle = 'rgba(59,130,246,0.07)';
  ctx.strokeStyle = 'rgba(59,130,246,0.2)';
  ctx.lineWidth = 0.5;
  for (const z of zones) {
    ctx.beginPath();
    ctx.roundRect(z.x * W, z.y * H, z.w * W, z.h * H, 2);
    ctx.fill();
    ctx.stroke();
  }

  // Pitch lines
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(4, H / 2);
  ctx.lineTo(W - 4, H / 2);
  ctx.stroke();

  // Centre circle
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();

  // Penalty areas
  const paW = W * 0.45, paH = H * 0.22;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeRect((W - paW) / 2, 4, paW, paH);
  ctx.strokeRect((W - paW) / 2, H - 4 - paH, paW, paH);

  // Goal areas
  const gaW = W * 0.22, gaH = H * 0.09;
  ctx.strokeRect((W - gaW) / 2, 4, gaW, gaH);
  ctx.strokeRect((W - gaW) / 2, H - 4 - gaH, gaW, gaH);

  // Heatmap blobs
  for (const pt of points) {
    const grad = ctx.createRadialGradient(pt.px, pt.py, 0, pt.px, pt.py, 22);
    const col = pt.zone === 'ideal' ? '16,185,129' : pt.zone === 'partial' ? '245,158,11' : '239,68,68';
    grad.addColorStop(0, `rgba(${col},0.35)`);
    grad.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pt.px, pt.py, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dots
  for (const pt of points) {
    const col = pt.zone === 'ideal' ? '#10b981' : pt.zone === 'partial' ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.arc(pt.px, pt.py, 4, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
