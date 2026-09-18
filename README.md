# Lincy's Makeover Artistry

Website for **Lincy Justin** — certified celebrity makeup artist & hair stylist, Ambattur, Chennai.

Live: https://lincysmakeoverartistry.in

## Structure
- `site/` — the static website (plain HTML/CSS/JS, no build step)
  - `index.html`, `styles.css`, `script.js`
  - `assets/img`, `assets/video`, `assets/brand` — optimised media
  - `vercel.json` — caching headers and the www → apex redirect
- Raw source photos/videos are kept locally and are not committed (see `.gitignore`).

## Deploy
```bash
cd site
vercel deploy --prod
```

## Adding content
- **Gallery photos:** add `bridal-N.jpg` / `editorial-N.jpg` / `glam-N.jpg` / `tv-N.jpg` / `star-N.jpg`
  to `site/assets/img`, then raise the count for that category in `script.js` (`range(...)`).
- **Before / after:** add `ba-N-before.jpg` + `ba-N-after.jpg` (same crop) and one line in the `BA` list in `script.js`.
- **Reels:** add `reel-N.mp4` + `reel-N.jpg` poster to `site/assets/video` and a `<figure class="phone">` in `index.html`.
