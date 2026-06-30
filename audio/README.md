# Recitation audio

Drop a recitation file here named **`chalisa.mp3`** and the app will load it
automatically on startup.

```
audio/chalisa.mp3
```

You can also load any audio file at runtime with the **Load recitation** button —
no need to place it here.

## Syncing the lines to the audio

The app highlights each line in time with the track. There are two ways it knows
the timing:

1. **Auto (approximate)** — as soon as a track is loaded, verses are spread evenly
   across the track's duration so highlighting works immediately.
2. **Calibrated (exact)** — click **Calibrate**, then tap `Space` / `Enter` at the
   start of each verse. When done, copy the generated array into `../timings.js`
   (or download a ready-made `timings.js`). These exact timings then drive the sync.

> Note: no recitation audio is bundled with this repo (to respect copyright).
> Add your own file as described above.
