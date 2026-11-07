# COROX Films

A collection of short films about the city’s other residents. Scroll through the COROX logo to reveal the opening footage, then through each film’s title to see a muted excerpt. Choose **Watch with sound** to open the film, or jump straight to a title from the **Index**. [Visit COROX Films](https://corox.vercel.app/)

## Run locally

The site uses plain HTML, CSS, and JavaScript ES modules. All films and the logo are included in the repository. A local preview needs only Python 3 and a browser.

From the website repository root (the folder containing `index.html`), run this command and open [the local site](http://127.0.0.1:8000/).

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Use the HTTP address so the browser can load the modules. Refresh after editing a file and press `Ctrl+C` in the terminal to stop the server.

## Where to make changes

| To change | Edit |
| --- | --- |
| Film titles, story times and locations, runtimes, loglines, or running order | [js/films.js](js/films.js) |
| Opening footage and copy, header navigation, footer, or player markup | [index.html](index.html) |
| Typography, layout, logo masks, or portrait and widescreen player sizing | [css/style.css](css/style.css) |
| Scroll reveals, preview loading, index interactions, or playback controls | [js/main.js](js/main.js) |
| Film files or the transparent logo | [media/films/](media/films/) and [media/logo.png](media/logo.png) |
| Production cache headers | [vercel.json](vercel.json) |

## Add a film

1. Put a web-ready MP4 in `media/films/`. To encode one with FFmpeg, use the following command for a landscape film. For a portrait film, change the scale to `540:-2`. Both settings preserve the source proportions.

   ```sh
   ffmpeg -i input.mp4 -vf "scale=1280:-2" \
     -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p \
     -c:a aac -b:a 112k -movflags +faststart media/films/006-example.mp4
   ```

2. Append an object to the `FILMS` array in [js/films.js](js/films.js). Use a unique three-digit ID and a path relative to `index.html`. The example below is for a 16:9 film. Omit `wide` for a 9:16 film.

   ```js
   {
     id: '006',
     title: 'Example Film',
     time: '04:15',
     place: 'Taipei',
     dur: '00:30',
     src: 'media/films/006-example.mp4',
     wide: true,
     line: 'A night-shift worker catches the first train home.',
   },
   ```

   `time` is the clock time in the story. `dur` is the running time printed in the caption and index. Set it from the finished MP4. The player reads its own duration from the video.

3. Refresh the local site. Check that the new film appears in both the scroll sequence and the index. Open it from each, confirm the framing and sound, and seek near the end to check the transition to the next film.

Array order sets the scroll sequence, index order, and playback order. Two references live separately in [index.html](index.html). If you change which film comes first, update the **Films** button’s `data-go="act-001"` to match its section ID. If you rename or replace the opening clip, update the video inside `#door`, which currently points to `003-bass-gravity.mp4`.

## Player controls

While the player is open, press **Space** to play or pause, **M** to toggle sound, **←** or **→** to change films, and **Esc** to close. Click or drag the progress bar to seek. When a film ends, the next one starts automatically and the last film wraps to the first. Playback starts muted if the browser blocks the initial attempt to play with sound.

## Deployment

Vercel serves the repository root as a static site. There are no dependencies to install, build command to run, or runtime environment variables to supply. For a Git-connected Vercel project, commit the catalog edit and MP4 together and push to the configured production branch.

Files under `/media/` have a seven-day cache lifetime (`Cache-Control: public, max-age=604800`). When replacing an existing cut, give the new MP4 a new filename and update its references so the new page requests a fresh copy.
