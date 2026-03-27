# SCOUTi — Pitch Control Analyst

Manual analysis workspace for competitive youth soccer. Upload Veo footage, plot player positions on a live pitch map, score criteria, and generate AI-powered coaching recommendations.

Built as a manual proof-of-concept for the SCOUTi Pitch Control metric.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/scouti-analyst.git
cd scouti-analyst
```

### 2. Add your API key

Copy the example config and add your Anthropic API key:

```bash
cp config.example.js config.js
```

Open `config.js` and replace `YOUR_API_KEY_HERE` with your key from [console.anthropic.com](https://console.anthropic.com).

```js
const SCOUTI_CONFIG = {
  ANTHROPIC_API_KEY: 'sk-ant-...'
};
```

> `config.js` is listed in `.gitignore` and will never be committed.

### 3. Open in browser

No build step required. Just open `index.html` directly in Chrome or Safari:

```bash
open index.html
```

Or serve it locally if you prefer:

```bash
npx serve .
# then open http://localhost:3000
```

---

## How to use

1. **Enter player name** in the header and select position (Winger)
2. **Upload footage** — click the left panel to load any video file (MP4, MOV, Veo export, etc.)
3. **Plot positions** — click anywhere on the pitch diagram while watching. Each click is classified as:
   - 🟢 **Ideal** — wide channels and half-spaces (optimal winger territory)
   - 🟡 **Partial** — upper half of the pitch
   - 🔴 **Poor** — deep/defensive zones
4. **Score the 5 criteria** on the right panel (0–10 each)
5. **Add analyst notes** — freeform observations, timestamps, patterns
6. **Generate AI recommendation** — calls the Anthropic API with your heatmap data and scores to produce a coaching recommendation
7. **Save session** — exports a `.json` file with all data

---

## Scoring

The Pitch Control score (0–100) is calculated as:

- **60%** weighted average of the 5 criteria scores
- **40%** derived from the pitch heatmap (ideal zone % × 10)

---

## File structure

```
scouti-analyst/
├── index.html          # Main UI
├── style.css           # All styles
├── pitch.js            # Canvas drawing + zone classification
├── app.js              # App logic, scoring, AI call, save/clear
├── config.example.js   # Copy to config.js and add your API key
├── .gitignore          # Keeps config.js and session files out of git
└── README.md
```

---

## Roadmap

- [ ] Load saved session from JSON
- [ ] Additional positions (CB, CM, Striker)
- [ ] Multi-match comparison view
- [ ] Export session as PDF report
- [ ] All 8 SCOUTi metrics

---

## Built by

Ben Callaghan & Vir Sawhney — Purdue University  
[scouti.com](https://scouti.com)
