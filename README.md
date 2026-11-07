# COROX Films website

Live: https://corox.vercel.app

A static site with no build step: plain HTML, CSS and JavaScript.

## Files

```
index.html          Page structure: header, Act 1 (logo), index, footer, player
css/style.css       All styles, in numbered sections
js/films.js         The film list (the only file to edit when adding a film)
js/main.js          Scroll animation, video loading, index, player, crows
media/logo.png      COROX logo (transparent)
media/films/        One web-encoded MP4 per film
vercel.json         Cache headers for media
```

## Add a film

1. Encode the video for web (about 7 MB for 30 s):

   ```bash
   ffmpeg -i input.mp4 -vf "scale=1280:-2" -c:v libx264 -crf 25 -preset slow \
     -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 112k media/films/006-name.mp4
   ```

   For a vertical film, use `scale=540:-2` instead.

2. Add an entry at the end of `FILMS` in `js/films.js`. Set `wide: true` for 16:9 films.

3. Commit and push. Vercel deploys it automatically.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The site uses ES modules, so opening `index.html` directly as a file won't work.
