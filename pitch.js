// ─────────────────────────────────────────────
//  SCOUTi Analyst — Pitch Canvas
// ─────────────────────────────────────────────

const canvas = document.getElementById('pitch-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Winger ideal zones — wide channels and half-spaces (both sides)
const IDEAL_ZONES = [
  { x: 0.02, y: 0.08, w: 0.22, h: 0.55 },  // Left wide channel
  { x: 0.76, y: 0.08, w: 0.22, h: 0.55 },  // Right wide channel
  { x: 0.18, y: 0.08, w: 0.22, h: 0.40 },  // Left half-space
  { x: 0.60, y: 0.08, w: 0.22, h: 0.40 },  // Right half-space
];

function classifyZone(nx, ny) {
  for (const z of IDEAL_ZONES) {
    if (nx >= z.x && nx <= z.x + z.w && ny >= z.y && ny <= z.y + z.h) {
      return 'ideal';
    }
  }
  if (ny < 0.6) return 'partial';
  return 'poor';
}

function drawPitch(points) {
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#0d1a12';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 4);
  ctx.fill();

  // Stripe pattern
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'rgba(255,255,255,0.024)';
    ctx.fillRect(i * (W / 8), 0, W / 8, H);
  }

  // Ideal zone overlays
  ctx.fillStyle = 'rgba(59,130,246,0.07)';
  ctx.strokeStyle = 'rgba(59,130,246,0.2)';
  ctx.lineWidth = 0.5;
  for (const z of IDEAL_ZONES) {
    ctx.beginPath();
    ctx.roundRect(z.x * W, z.y * H, z.w * W, z.h * H, 2);
    ctx.fill();
    ctx.stroke();
  }

  // Pitch markings
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;

  // Outline
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
    const r = 22;
    const grad = ctx.createRadialGradient(pt.px, pt.py, 0, pt.px, pt.py, r);
    const col = pt.zone === 'ideal' ? '16,185,129' : pt.zone === 'partial' ? '245,158,11' : '239,68,68';
    grad.addColorStop(0, `rgba(${col},0.35)`);
    grad.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pt.px, pt.py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Point dots
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
