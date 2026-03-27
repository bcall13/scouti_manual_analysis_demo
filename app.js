// ─────────────────────────────────────────────
//  SCOUTi Analyst — App Logic
// ─────────────────────────────────────────────

const state = {
  points: [],
  scores: [null, null, null, null, null],
  logCount: 0
};

// ── VIDEO ──────────────────────────────────────

function triggerUpload() {
  if (!document.getElementById('video-player').src || document.getElementById('video-player').src === window.location.href) {
    document.getElementById('file-input').click();
  }
}

function loadVideo(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const player = document.getElementById('video-player');
  player.src = url;
  player.style.display = 'block';
  document.getElementById('upload-zone').style.display = 'none';
  document.getElementById('recording-badge').style.display = 'block';
  document.getElementById('timestamp-badge').style.display = 'block';
  document.getElementById('video-area').style.cursor = 'default';
  document.getElementById('video-area').onclick = null;
  player.addEventListener('timeupdate', updateTimestamp);
}

function updateTimestamp() {
  const player = document.getElementById('video-player');
  const t = player.currentTime;
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  document.getElementById('timestamp-badge').textContent = m + ':' + s;
}

// ── PITCH CANVAS ───────────────────────────────

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top) * scaleY;
  const nx = px / W;
  const ny = py / H;
  const zone = classifyZone(nx, ny);

  const player = document.getElementById('video-player');
  const hasSrc = player.src && player.src !== window.location.href;
  const t = hasSrc ? player.currentTime : null;
  const timestamp = t !== null
    ? Math.floor(t / 60).toString().padStart(2, '0') + ':' + Math.floor(t % 60).toString().padStart(2, '0')
    : 'N/A';

  state.points.push({ px, py, nx, ny, zone, timestamp });
  state.logCount++;

  drawPitch(state.points);
  updatePitchStats();
  addLogItem(zone, nx, ny, timestamp, state.logCount);
});

function updatePitchStats() {
  const total = state.points.length;
  document.getElementById('stat-total').textContent = total;

  if (total === 0) {
    document.getElementById('stat-ideal').textContent = '0%';
    document.getElementById('stat-control').textContent = '—';
    return;
  }

  const ideal = state.points.filter(p => p.zone === 'ideal').length;
  const partial = state.points.filter(p => p.zone === 'partial').length;
  const pct = Math.round((ideal / total) * 100);
  const mapScore = Math.round(((ideal * 10 + partial * 5) / total) * 10);

  document.getElementById('stat-ideal').textContent = pct + '%';
  document.getElementById('stat-control').textContent = mapScore;

  updateOverallScore();
}

function addLogItem(zone, nx, ny, timestamp, n) {
  const list = document.getElementById('log-list');
  const empty = list.querySelector('.log-empty');
  if (empty) empty.remove();

  const el = document.createElement('div');
  el.className = 'log-item';
  const zoneClass = zone === 'ideal' ? 'zone-ideal' : zone === 'partial' ? 'zone-partial' : 'zone-poor';
  const zoneLabel = zone === 'ideal' ? 'IDEAL' : zone === 'partial' ? 'PARTIAL' : 'POOR';
  el.innerHTML = `
    <span style="color:var(--text3);width:20px;">#${n}</span>
    <span class="log-zone ${zoneClass}">${zoneLabel}</span>
    <span>x:${Math.round(nx * 100)}% y:${Math.round(ny * 100)}%</span>
    <span style="margin-left:auto">⏱ ${timestamp}</span>
  `;
  list.appendChild(el);
  list.scrollTop = list.scrollHeight;
}

// ── CRITERIA SCORING ───────────────────────────

function updateScores() {
  const ids = ['c0', 'c1', 'c2', 'c3', 'c4'];
  state.scores = ids.map(id => {
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
    const ideal = state.points.filter(p => p.zone === 'ideal').length;
    const partial = state.points.filter(p => p.zone === 'partial').length;
    return Math.round(((ideal * 10 + partial * 5) / total) * 10);
  })() : null;

  let overall;
  if (criteriaAvg !== null && mapScore !== null) {
    overall = Math.round(criteriaAvg * 0.6 + mapScore * 0.4);
  } else if (criteriaAvg !== null) {
    overall = Math.round(criteriaAvg);
  } else {
    overall = mapScore;
  }

  // Score ring
  document.getElementById('score-display').textContent = overall;
  const arc = document.getElementById('score-arc');
  const offset = 226.2 - (overall / 100) * 226.2;
  arc.style.strokeDashoffset = offset;
  arc.style.stroke = overall >= 75 ? '#10b981' : overall >= 50 ? '#f59e0b' : '#ef4444';

  // Sub bars
  const barMap = [
    { bar: 'bar-zone',    val: 'val-zone',    idx: 0 },
    { bar: 'bar-pos',     val: 'val-pos',     idx: 1 },
    { bar: 'bar-spatial', val: 'val-spatial', idx: 2 },
    { bar: 'bar-trans',   val: 'val-trans',   idx: 4 },
  ];
  barMap.forEach(({ bar, val, idx }) => {
    const s = state.scores[idx];
    document.getElementById(bar).style.width = s !== null ? (s * 10) + '%' : '0%';
    document.getElementById(val).textContent = s !== null ? s * 10 : '—';
  });

  // Player label
  const name = document.getElementById('player-name').value || 'Unnamed Player';
  document.getElementById('player-display').textContent = name + ' · Winger';
}

document.getElementById('player-name').addEventListener('input', updateOverallScore);

// ── AI RECOMMENDATION ──────────────────────────

async function generateAIRecommendation() {
  const total = state.points.length;
  const valid = state.scores.filter(s => s !== null);

  if (total < 3 && valid.length < 2) {
    document.getElementById('ai-output').innerHTML =
      '<span class="ai-empty">Please plot at least 3 positions and score 2 criteria first.</span>';
    return;
  }

  // Check for API key
  if (
    typeof SCOUTI_CONFIG === 'undefined' ||
    !SCOUTI_CONFIG.ANTHROPIC_API_KEY ||
    SCOUTI_CONFIG.ANTHROPIC_API_KEY === 'YOUR_API_KEY_HERE'
  ) {
    document.getElementById('ai-output').innerHTML =
      '<span class="ai-empty">API key not set. Copy config.example.js to config.js and add your Anthropic API key.</span>';
    return;
  }

  const btn = document.getElementById('ai-btn');
  btn.disabled = true;
  const output = document.getElementById('ai-output');
  output.innerHTML = '';
  output.classList.add('loading');

  const ideal   = state.points.filter(p => p.zone === 'ideal').length;
  const partial = state.points.filter(p => p.zone === 'partial').length;
  const poor    = state.points.filter(p => p.zone === 'poor').length;
  const pctIdeal = total > 0 ? Math.round((ideal / total) * 100) : 0;

  const criteriaLabels = [
    'Territorial zone occupation',
    'Opponent-relative positioning',
    'Dominant area vs dead zones',
    'Movement into space',
    'Transition behavior'
  ];
  const scoredCriteria = state.scores
    .map((s, i) => s !== null ? `${criteriaLabels[i]}: ${s}/10` : null)
    .filter(Boolean)
    .join(', ');

  const notes = document.getElementById('analyst-notes').value;
  const playerName = document.getElementById('player-name').value || 'the player';

  const prompt = `You are an elite youth soccer development coach and analyst specializing in winger positioning and pitch control. You are analyzing a manual analysis session for ${playerName}, a winger.

Heatmap data: ${total} positions plotted. ${ideal} in ideal zones (${pctIdeal}%), ${partial} in partial zones, ${poor} out of position.
Criteria scores: ${scoredCriteria || 'None scored yet'}.
Analyst notes: ${notes || 'None provided'}.

Based on this data, provide a concise, specific coaching recommendation focused on improving pitch control for this winger. Include:
1. A brief assessment of their current pitch control pattern (2-3 sentences)
2. The single most important area to improve
3. One specific, actionable training drill or exercise to address it

Keep the tone direct and professional — this is for a coach reviewing film. 150 words max.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SCOUTI_CONFIG.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Unable to generate recommendation.';

    output.classList.remove('loading');
    output.innerHTML = `<div class="ai-tag">AI · SCOUTi COACH</div><div>${text.replace(/\n/g, '<br>')}</div>`;
  } catch (err) {
    output.classList.remove('loading');
    output.innerHTML = '<span class="ai-empty">API error — check your key and connection, then try again.</span>';
    console.error('AI error:', err);
  }

  btn.disabled = false;
}

// ── SAVE SESSION ───────────────────────────────

function saveSession() {
  const name = document.getElementById('player-name').value || 'unnamed';
  const data = {
    player: name,
    position: 'Winger',
    date: new Date().toISOString(),
    points: state.points,
    scores: state.scores,
    notes: document.getElementById('analyst-notes').value,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scouti-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CLEAR ──────────────────────────────────────

function clearAll() {
  if (!confirm('Clear all plotted positions and scores for this session?')) return;

  state.points = [];
  state.scores = [null, null, null, null, null];
  state.logCount = 0;

  ['c0', 'c1', 'c2', 'c3', 'c4'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('analyst-notes').value = '';
  document.getElementById('ai-output').innerHTML =
    '<span class="ai-empty">Score at least 3 criteria and plot 5+ positions, then generate a recommendation.</span>';
  document.getElementById('log-list').innerHTML =
    '<div class="log-empty">No positions plotted yet. Click on the pitch map to begin.</div>';
  document.getElementById('score-display').textContent = '—';
  document.getElementById('score-arc').style.strokeDashoffset = '226.2';
  document.getElementById('score-arc').style.stroke = '#2563eb';
  ['bar-zone', 'bar-pos', 'bar-spatial', 'bar-trans'].forEach(id =>
    document.getElementById(id).style.width = '0%');
  ['val-zone', 'val-pos', 'val-spatial', 'val-trans'].forEach(id =>
    document.getElementById(id).textContent = '—');
  document.getElementById('stat-total').textContent = '0';
  document.getElementById('stat-ideal').textContent = '0%';
  document.getElementById('stat-control').textContent = '—';

  drawPitch([]);
}

// ── INIT ───────────────────────────────────────
drawPitch([]);
