# Hanuman Chalisa — Line-by-Line Animation

An animated, line-by-line presentation of the **Hanuman Chalisa** (हनुमान चालीसा)
in Devanagari with Roman transliteration. Each verse fades in line by line with a
warm, devotional aesthetic — glowing rays, rising embers, and a pulsing ॐ.

## Features

- **Line-by-line animation** — every verse reveals its lines with a soft blur-up entrance.
- **Auto-play recitation** — plays through all 46 verses (opening Dohas → 40 Chaupais → closing Doha).
- **Playback controls** — play/pause, next, previous, restart, and a clickable progress bar.
- **Adjustable pace** — slider sets how long each verse stays on screen (3s–12s).
- **Language toggle** — switch between Both / हिंदी (Devanagari) / Roman transliteration.
- **Keyboard shortcuts**
  - `Space` — play / pause
  - `→` / `←` — next / previous verse
  - `R` — restart
  - `L` — cycle language mode
- **Responsive** and respects `prefers-reduced-motion`.

## Run it

It's plain HTML/CSS/JS — no build step. Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8123
# then open http://localhost:8123
```

## Files

| File         | Purpose                                              |
|--------------|------------------------------------------------------|
| `index.html` | Page structure and controls                          |
| `styles.css` | Devotional theme + all animations                    |
| `script.js`  | Animation engine, playback, and keyboard/UI controls |
| `data.js`    | The full Chalisa text (Devanagari + transliteration) |

॥ श्री हनुमते नमः ॥
