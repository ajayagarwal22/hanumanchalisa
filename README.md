# Hanuman Chalisa — Line-by-Line Animation

An animated, line-by-line presentation of the **Hanuman Chalisa** (हनुमान चालीसा)
in Devanagari with Roman transliteration. Each verse fades in line by line with a
warm, devotional aesthetic — glowing rays, rising embers, and a pulsing ॐ.

## Features

- **Cinematic animated scenes** — shaded figures (Hanuman, Ram, Sita, Lakshman, demons, the Sun, the ocean, the Sanjeevani mountain, Lanka in flames, sages, devas…) act out each verse over layered parallax environments (sky, clouds, moon, stars, sea, fire, cosmos) with a slow camera push-in, glow/bloom, motion trails and particles. Scenes change as the recitation advances.
- **Line-by-line animation** — every verse reveals its lines with a soft blur-up entrance.
- **Synced audio playback** — the bundled recitation is matched to the text with **forced alignment**, so each **word** highlights (karaoke-style) exactly in time; spoken words glow, sung words stay lit, upcoming words dim.
- **Auto-play recitation** — plays through all 46 verses (opening Dohas → 40 Chaupais → closing Doha).
- **Playback controls** — play/pause, next, previous, restart, and a clickable/seekable progress bar.
- **Adjustable pace** — slider sets how long each verse stays on screen (used when no audio is loaded).
- **Language toggle** — switch between Both / हिंदी (Devanagari) / Roman transliteration.
- **Keyboard shortcuts**
  - `Space` — play / pause
  - `→` / `←` — next / previous verse
  - `R` — restart
  - `L` — cycle language mode
  - `T` — show / hide the verse text (focus on the animation)
- **Responsive** and respects `prefers-reduced-motion`.

## Animated scenes

Above each verse, an illustrated stage shows characters acting out the meaning — for
example:

- **Sukshma/Vikat roop** → tiny Hanuman before Sita, then a fierce giant as Lanka burns
- **Bhim roop asur sanhare** → Hanuman striking down demons
- **Laye Sanjivan** → Hanuman carrying the Sanjeevani mountain while Lakshman revives
- **Yug sahasra yojan par bhanu** → child Hanuman leaping to swallow the sun
- **Jaladhi langhi** → Hanuman soaring across the ocean with Ram's ring
- **Aapan tej / teenon lok** → Hanuman growing immense as the worlds tremble
- **Ram duware tum rakhware** → Hanuman guarding Ram's gate
- … and devotional tableaus (darshan, embrace, blessings, the heart finale) for the
  praise verses.

A short bilingual caption under the scene explains what's being depicted. Use the
**पाठ · Text** toggle (or `T`) to hide the words and watch only the animation.
The scene-to-verse mapping and all figures live in `scenes.js`.

## Synced audio playback

No recitation audio is bundled (to respect copyright), but syncing your own track is easy:

1. **Load a track** — click **Load recitation** (or drop a file at `audio/chalisa.mp3`,
   which is auto-loaded on startup).
2. **It syncs immediately** — verses are spread evenly across the track and each word
   is highlighted in turn (weighted by word length), so the recitation reads
   karaoke-style right away.
3. **Exact word-level sync** — the included `timings.js` was produced by **CTC forced
   alignment** (MMS model) of the Devanagari text against `audio/chalisa.mp3`, giving a
   start time for every verse *and every word*. If you swap in a different recording,
   regenerate these timings (forced alignment) or use the **Calibrate** button to tap
   per-verse start times and paste/download a new `timings.js`.

If no track is loaded, the app falls back to the timed auto-advance using the pace slider.

## Run it

It's plain HTML/CSS/JS — no build step. Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8123
# then open http://localhost:8123
```

## Files

| File         | Purpose                                              |
|--------------|------------------------------------------------------|
| `index.html` | Page structure, audio bar, and controls              |
| `styles.css` | Devotional theme + all animations + karaoke highlight |
| `script.js`  | Animation engine, audio sync, calibrate tool, controls |
| `data.js`    | The full Chalisa text (Devanagari + transliteration) |
| `scenes.js`  | SVG character library + per-verse animated scene mapping |
| `timings.js` | Per-verse + per-word audio start times (from forced alignment) |
| `audio/`     | Place `chalisa.mp3` here to auto-load a recitation   |

॥ श्री हनुमते नमः ॥
