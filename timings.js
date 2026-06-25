// ---------------------------------------------------------------------------
// Audio sync timings for the Hanuman Chalisa recitation.
//
// TIMINGS is an array of START TIMES (in seconds) — one entry per verse,
// aligned 1:1 with the CHALISA array in data.js (currently 46 entries,
// including the "॥ दोहा ॥" / "॥ चौपाई ॥" section headings).
//
//   TIMINGS[i] = the moment in the audio when verse i begins.
//
// While the recitation plays, the app highlights the verse whose start time
// has been reached, and karaoke-highlights each line within that verse by
// interpolating between this verse's start and the next verse's start.
//
// HOW TO GENERATE THESE FOR YOUR OWN TRACK
//   1. Put your recitation file at  audio/chalisa.mp3  (or load it with the
//      "Load recitation" button in the app).
//   2. Click "Calibrate" in the app. Playback starts from the top.
//   3. Tap SPACE (or click "Tap") exactly when each verse begins.
//   4. When finished, copy the generated array and paste it below, replacing
//      the contents of TIMINGS. (You can also download a ready-made
//      timings.js from the app.)
//
// Leave this as an empty array to disable audio sync and use the built-in
// timer-based auto-advance instead.
// ---------------------------------------------------------------------------

const TIMINGS = [
  // Example shape (uncomment & replace with real values from Calibrate):
  // 0.0, 6.2, 12.4, 18.1, ...
];
