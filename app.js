// ─────────────────────────────────────────────
//  SCOUTi Analyst — App Logic
// ─────────────────────────────────────────────

const state = {
  points: [],
  scores: [null, null, null, null, null],
  logCount: 0
};

// ── YOUTUBE ────────────────────────────────────

function extractYouTubeID(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function loadYouTube() {
  const url = document.getElementById('yt-url').value.trim();
  if (!url) return;

  const videoId = extractYouTubeID(url);
  if (!videoId) {
    alert('Could not parse YouTube URL. Make sure it\'s a valid youtube.com or youtu.be link.');
    return;
  }

  const embed = document.getElementById('yt-embed');
  const zone  = document.getElementById('upload-zone');

  embed.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  embed.style.display = 'block';
  zone.style.display  = 'none';
}

// Also trigger on Enter key in URL field
document.getElementById('yt-url').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadYouTube();
});

// ── PITCH CANVAS ───────────────────────────────

canvas.addEventListener('click', (e) => {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top)  * scaleY;
  const nx = px / W;
  const ny = py / H;
  const zone = classifyZone(nx, ny);

  state.points.push({ px, py, nx, ny, zone });
  state.logCount++;

  drawPitch(state.points);
  updatePitchStats();
  addLogItem(zone, nx, ny, state.logCount);
});

function updatePitchStats() {
  const total = state.points.length;
  document.getElementById('stat-total').textContent = total;

  if (total === 0) {
    document.getElementById('stat-ideal').textContent = '0%';
    document.getElementById('stat-control').textContent = '—';
    updateOverallScore();
    return;
  }

  const ideal   = state.points.filter(p => p.zone === 'ideal').length;
  const partial = state.points.filter(p => p.zone === 'partial').length;
  const pct      = Math.round((ideal / total) * 100);
  const mapScore = Math.round(((ideal * 10 + partial * 5) / total) * 10);

  document.getElementById('stat-ideal').textContent   = pct + '%';
  document.getElementById('stat-control').textContent = mapScore;

  updateOverallScore();
}

function addLogItem(zone, nx, ny, n) {
  const list  = document.getElementById('log-list');
  const empty = list.querySelector('.log-empty');
  if (empty) empty.remove();

  const el = document.createElement('div');
  el.className = 'log-item';
  el.dataset.index = n - 1;

  const zoneClass = zone === 'ideal' ? 'zone-ideal' : zone === 'partial' ? 'zone-partial' : 'zone-poor';
  const zoneLabel = zone === 'ideal' ? 'IDEAL'      : zone === 'partial' ? 'PARTIAL'      : 'POOR';

  el.innerHTML = `
    <span style="color:var(--text3);width:20px;">#${n}</span>
    <span class="log-zone ${zoneClass}">${zoneLabel}</span>
    <span>x:${Math.round(nx * 100)}% &nbsp;y:${Math.round(ny * 100)}%</span>
  `;
  list.appendChild(el);
  list.scrollTop = list.scrollHeight;
}

// ── UNDO ───────────────────────────────────────

function undoLast() {
  if (state.points.length === 0) return;
  state.points.pop();
  state.logCount = Math.max(0, state.logCount - 1);

  // Remove last log item
  const list = document.getElementById('log-list');
  const items = list.querySelectorAll('.log-item');
  if (items.length > 0) items[items.length - 1].remove();
  if (list.querySelectorAll('.log-item').length === 0) {
    list.innerHTML = '<div class="log-empty">No positions plotted yet. Click on the pitch map to begin.</div>';
  }

  drawPitch(state.points);
  updatePitchStats();
}

// ── CRITERIA SCORING ───────────────────────────

function updateScores() {
  state.scores = ['c0','c1','c2','c3','c4'].map(id => {
    const v = parseInt(document.getElementById(id).value);
    return isNaN(v) ? null : Math.min(10, Math.max(0, v));
  });
  updateOverallScore();
}

function updateOverallScore() {
  const valid = state.scores.filter(s => s !== null);
  if (valid.length === 0 && state.points.length === 0) return;

  const criteriaAvg = valid.length > 0
    ? (valid.reduce((a, b) => a + b, 0) / valid.length) * 10
    : null;

  const total = state.points.length;
  const mapScore = total > 0 ? (() => {
    const ideal   = state.points.filter(p => p.zone === 'ideal').length;
    const partial = state.points.filter(p => p.zone === 'partial').length;
    return Math.round(((ideal * 10 + partial * 5) / total) * 10);
  })() : null;

  let overall;
  if (criteriaAvg !== null && mapScore !== null) {
    overall = Math.round(criteriaAvg * 0.6 + mapScore * 0.4);
  } else if (criteriaAvg !== null) {
    overall = Math.round(criteriaAvg);
  } else if (mapScore !== null) {
    overall = mapScore;
  } else {
    return;
  }

  // Score ring
  document.getElementById('score-display').textContent = overall;
  const arc    = document.getElementById('score-arc');
  const offset = 226.2 - (overall / 100) * 226.2;
  arc.style.strokeDashoffset = offset;
  arc.style.stroke = overall >= 75 ? '#10b981' : overall >= 50 ? '#f59e0b' : '#ef4444';

  // Sub-bars
  [
    { bar: 'bar-zone',    val: 'val-zone',    idx: 0 },
    { bar: 'bar-pos',     val: 'val-pos',     idx: 1 },
    { bar: 'bar-spatial', val: 'val-spatial', idx: 2 },
    { bar: 'bar-trans',   val: 'val-trans',   idx: 4 },
  ].forEach(({ bar, val, idx }) => {
    const s = state.scores[idx];
    document.getElementById(bar).style.width    = s !== null ? (s * 10) + '%' : '0%';
    document.getElementById(val).textContent = s !== null ? s * 10 : '—';
  });

  // Player label
  const name = document.getElementById('player-name').value || 'Unnamed Player';
  document.getElementById('player-display').textContent = name + ' · Winger';
}

document.getElementById('player-name').addEventListener('input', updateOverallScore);

// ── SAVE SESSION ───────────────────────────────

function saveSession() {
  const name = document.getElementById('player-name').value || 'unnamed';
  const data = {
    player:   name,
    position: 'Winger',
    date:     new Date().toISOString(),
    ytUrl:    document.getElementById('yt-url').value,
    points:   state.points,
    scores:   state.scores,
    notes:    document.getElementById('analyst-notes').value,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `scouti-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CLEAR ──────────────────────────────────────

function clearAll() {
  if (!confirm('Clear all plotted positions and scores?')) return;

  state.points   = [];
  state.scores   = [null, null, null, null, null];
  state.logCount = 0;

  ['c0','c1','c2','c3','c4'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('analyst-notes').value = '';
  document.getElementById('log-list').innerHTML =
    '<div class="log-empty">No positions plotted yet. Click on the pitch map to begin.</div>';
  document.getElementById('score-display').textContent = '—';
  document.getElementById('score-arc').style.strokeDashoffset = '226.2';
  document.getElementById('score-arc').style.stroke = '#2563eb';
  ['bar-zone','bar-pos','bar-spatial','bar-trans'].forEach(id =>
    document.getElementById(id).style.width = '0%');
  ['val-zone','val-pos','val-spatial','val-trans'].forEach(id =>
    document.getElementById(id).textContent = '—');
  document.getElementById('stat-total').textContent   = '0';
  document.getElementById('stat-ideal').textContent   = '0%';
  document.getElementById('stat-control').textContent = '—';

  drawPitch([]);
}

// ── INIT ───────────────────────────────────────
drawPitch([]);
