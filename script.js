(function () {
  "use strict";

  // ---------- Elements ----------
  const verseCard = document.getElementById("verseCard");
  const verseHi = document.getElementById("verseHi");
  const verseEn = document.getElementById("verseEn");
  const verseBadge = document.getElementById("verseBadge");
  const counter = document.getElementById("counter");
  const progressFill = document.getElementById("progressFill");
  const progressTrack = document.getElementById("progressTrack");
  const playBtn = document.getElementById("playBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const restartBtn = document.getElementById("restartBtn");
  const speed = document.getElementById("speed");
  const speedVal = document.getElementById("speedVal");
  const langToggle = document.getElementById("langToggle");
  const langLabel = langToggle.querySelector("[data-lang-label]");
  const textToggle = document.getElementById("textToggle");
  const sceneStage = document.getElementById("sceneStage");
  const sceneDesc = document.getElementById("sceneDesc");

  // Audio elements
  const audio = document.getElementById("audio");
  const audioFile = document.getElementById("audioFile");
  const audioLoadLabel = document.getElementById("audioLoadLabel");
  const audioTime = document.getElementById("audioTime");
  const audioHint = document.getElementById("audioHint");
  const calibrateBtn = document.getElementById("calibrateBtn");

  // Calibration elements
  const calPanel = document.getElementById("calPanel");
  const calStep = document.getElementById("calStep");
  const calNow = document.getElementById("calNow");
  const calTap = document.getElementById("calTap");
  const calUndo = document.getElementById("calUndo");
  const calFinish = document.getElementById("calFinish");
  const calCancel = document.getElementById("calCancel");
  const calOutput = document.getElementById("calOutput");
  const calText = document.getElementById("calText");
  const calCopy = document.getElementById("calCopy");
  const calDownload = document.getElementById("calDownload");
  const calUse = document.getElementById("calUse");
  const calClose = document.getElementById("calClose");

  // ---------- State ----------
  const total = CHALISA.length;
  let index = 0;
  let playing = false;
  let timer = null;
  let perVerseMs = parseFloat(speed.value) * 1000;

  let hasAudio = false;
  let sessionTimings = null; // set by Calibrate "Use now"
  let wordData = { hi: null, en: null }; // per-container word spans + timing weights
  let lastProgress = 0;

  let calibrating = false;
  let calIndex = 0;
  let captured = [];

  const LANG_MODES = [
    { key: "both", label: "दोनों · Both", cls: "lang-both" },
    { key: "hi", label: "हिंदी · Hindi", cls: "lang-hi" },
    { key: "en", label: "Roman · English", cls: "lang-en" }
  ];
  let langIdx = 0;

  const BADGE = { doha: "दोहा", chaupai: "चौपाई", section: "" };

  // ---------- Timing helpers ----------
  function explicitTimings() {
    if (sessionTimings && sessionTimings.length === total) return sessionTimings;
    if (typeof TIMINGS !== "undefined" && Array.isArray(TIMINGS) && TIMINGS.length === total) {
      return TIMINGS;
    }
    return null;
  }

  // Returns a usable per-verse start-time array, or null.
  function effectiveTimings() {
    const explicit = explicitTimings();
    if (explicit) return explicit;
    if (hasAudio && isFinite(audio.duration) && audio.duration > 0) {
      const step = audio.duration / total;
      return Array.from({ length: total }, (_, i) => i * step);
    }
    return null;
  }

  function isSynced() {
    return hasAudio && effectiveTimings() !== null;
  }

  // ---------- Render ----------
  function splitLines(text) {
    return text
      .split("\n")
      .map((line) => {
        const words = line
          .split(/(\s+)/)
          .map((tok) => (/^\s+$/.test(tok) || tok === "" ? tok : '<span class="wd">' + tok + "</span>"))
          .join("");
        return '<span class="ln">' + words + "</span>";
      })
      .join("");
  }

  // Build the word list for a container with cumulative timing weights
  // (longer words occupy a larger slice of the verse's time window).
  function indexWords(container) {
    const spans = Array.prototype.slice.call(container.querySelectorAll(".wd"));
    const weights = spans.map((s) => Math.max(1, (s.textContent || "").trim().length));
    const totalW = weights.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const ends = weights.map((w) => {
      acc += w;
      return acc / totalW;
    });
    return { spans: spans, ends: ends };
  }

  function applyActive(w, active) {
    for (let i = 0; i < w.spans.length; i++) {
      const cl = w.spans[i].classList;
      if (i < active) { cl.add("said"); cl.remove("spoken"); }
      else if (i === active) { cl.add("spoken"); cl.remove("said"); }
      else { cl.remove("said"); cl.remove("spoken"); }
    }
  }

  function idxByProgress(w, p) {
    if (p < 0) p = 0;
    if (p > 0.9999) p = 0.9999;
    let active = w.spans.length - 1;
    for (let i = 0; i < w.ends.length; i++) {
      if (p < w.ends[i]) { active = i; break; }
    }
    return active;
  }

  function idxByTime(times, t) {
    let active = 0;
    for (let i = 0; i < times.length; i++) {
      if (times[i] <= t) active = i; else break;
    }
    return active;
  }

  // Highlight the spoken word. When precise per-word timings exist for the
  // Devanagari line (from forced alignment), the Hindi words follow the audio
  // exactly; the transliteration follows the verse progress proportionally.
  function highlightWords(progress, t) {
    lastProgress = progress;
    if (wordData.hi && wordData.hi.spans.length) {
      const w = wordData.hi;
      const active = (wordData.hiTimes && typeof t === "number")
        ? idxByTime(wordData.hiTimes, t)
        : idxByProgress(w, progress);
      applyActive(w, active);
    }
    if (wordData.en && wordData.en.spans.length) {
      applyActive(wordData.en, idxByProgress(wordData.en, progress));
    }
  }

  function clearWordHighlight() {
    [wordData.hi, wordData.en].forEach((w) => {
      if (!w) return;
      w.spans.forEach((s) => s.classList.remove("said", "spoken"));
    });
  }

  function render(animate) {
    const verse = CHALISA[index];

    verseHi.innerHTML = splitLines(verse.hi);
    verseEn.innerHTML = splitLines(verse.en);
    wordData = { hi: indexWords(verseHi), en: indexWords(verseEn), hiTimes: null };
    // Attach precise per-word timings for the Devanagari line, if available
    // and consistent with the rendered word count.
    if (typeof TIMINGS_WORDS !== "undefined" && Array.isArray(TIMINGS_WORDS)) {
      const wt = TIMINGS_WORDS[index];
      if (wt && wt.length === wordData.hi.spans.length) wordData.hiTimes = wt;
    }
    if (document.body.classList.contains("synced")) highlightWords(0, undefined);

    verseBadge.textContent = BADGE[verse.type] || "";
    verseCard.classList.toggle("is-section", verse.type === "section");

    // Animated figures that act out this verse's meaning.
    if (window.Scenes) window.Scenes.render(sceneStage, sceneDesc, index);

    counter.textContent = `${index + 1} / ${total}`;
    if (!hasAudio) {
      progressFill.style.width = `${((index + 1) / total) * 100}%`;
    }

    verseCard.classList.remove("show", "lit");
    void verseCard.offsetWidth; // reflow to replay animation
    verseCard.classList.add("show");
    if (animate !== false && !document.body.classList.contains("synced")) {
      verseCard.classList.add("lit");
    }
  }

  // ---------- Timer (no-audio) playback ----------
  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function scheduleNext() {
    clearTimer();
    if (!playing || hasAudio) return;
    timer = setTimeout(() => {
      if (index < total - 1) {
        go(index + 1);
        scheduleNext();
      } else {
        pause();
      }
    }, perVerseMs);
  }

  function go(i) {
    index = Math.max(0, Math.min(total - 1, i));
    render(true);
  }

  // ---------- Unified play/pause ----------
  function play() {
    if (hasAudio) {
      if (audio.ended || audio.currentTime >= (audio.duration || Infinity)) audio.currentTime = 0;
      audio.play().catch(() => {});
      return; // body.playing handled by audio events
    }
    playing = true;
    document.body.classList.add("playing");
    if (index >= total - 1) go(0);
    scheduleNext();
  }

  function pause() {
    if (hasAudio) { audio.pause(); return; }
    playing = false;
    document.body.classList.remove("playing");
    clearTimer();
  }

  function togglePlay() {
    if (hasAudio) {
      audio.paused ? play() : pause();
    } else {
      playing ? pause() : play();
    }
  }

  // ---------- Language ----------
  function setLang(i) {
    langIdx = (i + LANG_MODES.length) % LANG_MODES.length;
    const mode = LANG_MODES[langIdx];
    document.body.classList.remove("lang-both", "lang-hi", "lang-en");
    document.body.classList.add(mode.cls);
    langLabel.textContent = mode.label;
  }

  // ---------- Audio sync ----------
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function refreshSyncState() {
    const synced = isSynced();
    document.body.classList.toggle("synced", synced);
    if (!synced) {
      clearWordHighlight();
    }
    updateHint();
  }

  function updateHint() {
    if (calibrating) return;
    if (!hasAudio) {
      audioHint.textContent = "No track loaded — using timed auto-advance.";
    } else if (explicitTimings()) {
      audioHint.textContent = "Word-by-word sync (aligned to recitation).";
    } else {
      audioHint.textContent = "Loaded — words auto-sync. Use Calibrate for exact timing.";
    }
  }

  function onAudioReady() {
    hasAudio = true;
    document.body.classList.add("has-audio");
    calibrateBtn.disabled = false;
    audioTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    clearTimer();
    refreshSyncState();
  }

  function onTime() {
    if (calibrating) {
      audioTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
      return;
    }
    audioTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;

    if (hasAudio && isFinite(audio.duration) && audio.duration > 0) {
      progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }

    const timings = effectiveTimings();
    if (!timings) return;

    const t = audio.currentTime;
    let target = 0;
    for (let i = 0; i < total; i++) {
      if (timings[i] <= t) target = i; else break;
    }
    if (target !== index) go(target);

    const start = timings[index];
    const end = index < total - 1 ? timings[index + 1] : (audio.duration || start + 4);
    const span = Math.max(0.001, end - start);
    highlightWords((t - start) / span, t);
  }

  function loadAudioSrc(src, label) {
    audio.src = src;
    audio.load();
    if (label) audioLoadLabel.textContent = label;
  }

  // Candidate locations for the bundled recitation, tried in order.
  // 1) same-origin relative path (works locally and on GitHub Pages)
  // 2) raw.githubusercontent fallback (works on raw.githack.com, whose CDN
  //    refuses large media files with a 403).
  const AUDIO_SOURCES = [
    "audio/chalisa.mp3",
    "https://raw.githubusercontent.com/ajayagarwal22/hanumanchalisa/cursor/hanuman-chalisa-animation-4603/audio/chalisa.mp3",
  ];

  function probeBundledAudio() {
    let i = 0;
    (function tryNext() {
      if (i >= AUDIO_SOURCES.length || hasAudio || audio.src) return;
      const url = AUDIO_SOURCES[i++];
      const probe = new Audio();
      probe.preload = "metadata";
      probe.addEventListener("loadedmetadata", function () {
        if (!hasAudio && !audio.src) loadAudioSrc(url, "Recitation: chalisa.mp3");
      }, { once: true });
      probe.addEventListener("error", function () { tryNext(); }, { once: true });
      probe.src = url;
    })();
  }

  // ---------- Calibration ----------
  function showCalVerse() {
    const v = CHALISA[calIndex];
    const firstHi = v.hi.split("\n")[0];
    calNow.innerHTML = `<div style="opacity:.7;font-size:.7em;letter-spacing:2px">VERSE ${calIndex + 1} / ${total}</div>${firstHi}`;
    calStep.innerHTML = "Tap exactly when this verse <b>begins</b> in the audio.";
  }

  function startCalibrate() {
    if (!hasAudio) return;
    calibrating = true;
    calIndex = 0;
    captured = [];
    calOutput.hidden = true;
    calPanel.hidden = false;
    audioHint.textContent = "Calibrating…";
    audio.currentTime = 0;
    audio.play().catch(() => {});
    showCalVerse();
  }

  function calTapNow() {
    if (!calibrating || calIndex >= total) return;
    captured[calIndex] = Math.max(0, Math.round(audio.currentTime * 1000) / 1000);
    calIndex++;
    if (calIndex >= total) {
      finishCalibrate();
    } else {
      showCalVerse();
    }
  }

  function calUndoTap() {
    if (!calibrating || calIndex === 0) return;
    calIndex--;
    captured.length = calIndex;
    calOutput.hidden = true;
    showCalVerse();
  }

  function buildTimingsFile(arr) {
    const body = arr.map((n) => "  " + n).join(",\n");
    return (
      "// Generated by the in-app Calibrate tool.\n" +
      "// One start time (seconds) per verse, aligned with CHALISA in data.js.\n" +
      "const TIMINGS = [\n" + body + "\n];\n"
    );
  }

  function finishCalibrate() {
    audio.pause();
    const arr = captured.slice();
    calOutput.hidden = false;
    calText.value = buildTimingsFile(arr);
    if (arr.length === total) {
      calStep.innerHTML = "All verses captured ✓";
      calUse.disabled = false;
    } else {
      calStep.innerHTML = `Captured ${arr.length} / ${total}. You can finish later or re-calibrate for full sync.`;
      calUse.disabled = arr.length !== total;
    }
    calNow.textContent = "";
  }

  function endCalibrate() {
    calibrating = false;
    calPanel.hidden = true;
    audio.pause();
    refreshSyncState();
  }

  // ---------- Events ----------
  playBtn.addEventListener("click", togglePlay);
  nextBtn.addEventListener("click", () => {
    const timings = effectiveTimings();
    if (hasAudio && timings && index < total - 1) {
      audio.currentTime = timings[index + 1] + 0.01;
    } else {
      go(index + 1);
      if (playing) scheduleNext();
    }
  });
  prevBtn.addEventListener("click", () => {
    const timings = effectiveTimings();
    if (hasAudio && timings) {
      audio.currentTime = index > 0 ? timings[index - 1] + 0.01 : 0;
    } else {
      go(index - 1);
      if (playing) scheduleNext();
    }
  });
  restartBtn.addEventListener("click", () => {
    if (hasAudio) { audio.currentTime = 0; }
    else { go(0); if (playing) scheduleNext(); }
  });

  speed.addEventListener("input", () => {
    perVerseMs = parseFloat(speed.value) * 1000;
    speedVal.textContent = parseFloat(speed.value).toFixed(1) + "s";
    if (playing) scheduleNext();
  });

  langToggle.addEventListener("click", () => setLang(langIdx + 1));
  textToggle.addEventListener("click", () => document.body.classList.toggle("hide-text"));

  progressTrack.addEventListener("click", (ev) => {
    const rect = progressTrack.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
    if (hasAudio && isFinite(audio.duration)) {
      audio.currentTime = ratio * audio.duration;
    } else {
      go(Math.floor(ratio * total));
      if (playing) scheduleNext();
    }
  });

  // Audio element events
  audio.addEventListener("loadedmetadata", onAudioReady);
  audio.addEventListener("durationchange", () => {
    if (hasAudio) audioTime.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  });
  audio.addEventListener("timeupdate", onTime);
  audio.addEventListener("play", () => { if (!calibrating) document.body.classList.add("playing"); });
  audio.addEventListener("pause", () => { if (!calibrating) document.body.classList.remove("playing"); });
  audio.addEventListener("ended", () => document.body.classList.remove("playing"));

  // File loading
  audioFile.addEventListener("change", (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    loadAudioSrc(URL.createObjectURL(file), file.name);
  });

  // Calibration controls
  calibrateBtn.addEventListener("click", startCalibrate);
  calTap.addEventListener("click", calTapNow);
  calUndo.addEventListener("click", calUndoTap);
  calFinish.addEventListener("click", finishCalibrate);
  calCancel.addEventListener("click", endCalibrate);
  calClose.addEventListener("click", endCalibrate);
  calCopy.addEventListener("click", () => {
    calText.select();
    navigator.clipboard && navigator.clipboard.writeText(calText.value);
    calCopy.textContent = "Copied!";
    setTimeout(() => (calCopy.textContent = "Copy"), 1400);
  });
  calDownload.addEventListener("click", () => {
    const blob = new Blob([calText.value], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "timings.js";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  calUse.addEventListener("click", () => {
    if (captured.length !== total) return;
    sessionTimings = captured.slice();
    endCalibrate();
    audio.currentTime = 0;
    go(0);
    refreshSyncState();
  });

  // Keyboard
  document.addEventListener("keydown", (ev) => {
    if (calibrating) {
      if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); calTapNow(); }
      else if (ev.key === "Escape") { endCalibrate(); }
      else if (ev.key === "Backspace") { ev.preventDefault(); calUndoTap(); }
      return;
    }
    switch (ev.key) {
      case " ":
        ev.preventDefault(); togglePlay(); break;
      case "ArrowRight":
        nextBtn.click(); break;
      case "ArrowLeft":
        prevBtn.click(); break;
      case "r": case "R":
        restartBtn.click(); break;
      case "l": case "L":
        setLang(langIdx + 1); break;
      case "t": case "T":
        document.body.classList.toggle("hide-text"); break;
    }
  });

  // ---------- Init ----------
  setLang(0);
  speedVal.textContent = parseFloat(speed.value).toFixed(1) + "s";
  calibrateBtn.disabled = true;
  updateHint();

  // embers
  (function spawnEmbers() {
    const container = document.getElementById("embers");
    if (!container) return;
    const count = window.matchMedia("(max-width: 560px)").matches ? 16 : 30;
    for (let i = 0; i < count; i++) {
      const e = document.createElement("span");
      e.className = "ember";
      e.style.left = Math.random() * 100 + "vw";
      const dur = 7 + Math.random() * 9;
      e.style.animationDuration = dur + "s";
      e.style.animationDelay = -Math.random() * dur + "s";
      const size = 3 + Math.random() * 5;
      e.style.width = e.style.height = size + "px";
      e.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      container.appendChild(e);
    }
  })();

  render(true);

  // If explicit timings are already present, we still need audio to sync to.
  // Try to auto-load a bundled track; harmless if it doesn't exist.
  probeBundledAudio();
})();
