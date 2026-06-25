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

  // ---------- State ----------
  let index = 0;
  let playing = false;
  let timer = null;
  let perVerseMs = parseFloat(speed.value) * 1000;
  const total = CHALISA.length;

  const LANG_MODES = [
    { key: "both", label: "दोनों · Both", cls: "lang-both" },
    { key: "hi", label: "हिंदी · Hindi", cls: "lang-hi" },
    { key: "en", label: "Roman · English", cls: "lang-en" }
  ];
  let langIdx = 0;

  const BADGE = { doha: "दोहा", chaupai: "चौपाई", section: "" };

  // ---------- Helpers ----------
  function splitLines(text) {
    return text
      .split("\n")
      .map((l) => `<span class="ln">${l}</span>`)
      .join("");
  }

  function render(animate) {
    const verse = CHALISA[index];

    verseHi.innerHTML = splitLines(verse.hi);
    verseEn.innerHTML = splitLines(verse.en);

    verseBadge.textContent = BADGE[verse.type] || "";
    verseCard.classList.toggle("is-section", verse.type === "section");

    counter.textContent = `${index + 1} / ${total}`;
    progressFill.style.width = `${((index + 1) / total) * 100}%`;

    // restart entrance animation
    verseCard.classList.remove("show", "lit");
    // force reflow so the animation replays
    void verseCard.offsetWidth;
    if (animate !== false) {
      verseCard.classList.add("show", "lit");
    } else {
      verseCard.classList.add("show");
    }
  }

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleNext() {
    clearTimer();
    if (!playing) return;
    timer = setTimeout(() => {
      if (index < total - 1) {
        go(index + 1);
        scheduleNext();
      } else {
        pause(); // reached the end
      }
    }, perVerseMs);
  }

  function go(i) {
    index = Math.max(0, Math.min(total - 1, i));
    render(true);
  }

  function play() {
    playing = true;
    document.body.classList.add("playing");
    // If at the very end, restart from the top.
    if (index >= total - 1) go(0);
    scheduleNext();
  }

  function pause() {
    playing = false;
    document.body.classList.remove("playing");
    clearTimer();
  }

  function togglePlay() {
    playing ? pause() : play();
  }

  function setLang(i) {
    langIdx = (i + LANG_MODES.length) % LANG_MODES.length;
    const mode = LANG_MODES[langIdx];
    document.body.classList.remove("lang-both", "lang-hi", "lang-en");
    document.body.classList.add(mode.cls);
    langLabel.textContent = mode.label;
  }

  // ---------- Embers ----------
  function spawnEmbers() {
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
  }

  // ---------- Events ----------
  playBtn.addEventListener("click", togglePlay);

  nextBtn.addEventListener("click", () => {
    go(index + 1);
    if (playing) scheduleNext();
  });

  prevBtn.addEventListener("click", () => {
    go(index - 1);
    if (playing) scheduleNext();
  });

  restartBtn.addEventListener("click", () => {
    go(0);
    if (playing) scheduleNext();
  });

  speed.addEventListener("input", () => {
    perVerseMs = parseFloat(speed.value) * 1000;
    speedVal.textContent = parseFloat(speed.value).toFixed(1) + "s";
    if (playing) scheduleNext();
  });

  langToggle.addEventListener("click", () => setLang(langIdx + 1));

  progressTrack.addEventListener("click", (ev) => {
    const rect = progressTrack.getBoundingClientRect();
    const ratio = (ev.clientX - rect.left) / rect.width;
    go(Math.floor(ratio * total));
    if (playing) scheduleNext();
  });

  document.addEventListener("keydown", (ev) => {
    switch (ev.key) {
      case " ":
        ev.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        go(index + 1);
        if (playing) scheduleNext();
        break;
      case "ArrowLeft":
        go(index - 1);
        if (playing) scheduleNext();
        break;
      case "r":
      case "R":
        go(0);
        if (playing) scheduleNext();
        break;
      case "l":
      case "L":
        setLang(langIdx + 1);
        break;
    }
  });

  // ---------- Init ----------
  setLang(0);
  speedVal.textContent = parseFloat(speed.value).toFixed(1) + "s";
  spawnEmbers();
  render(true);
})();
