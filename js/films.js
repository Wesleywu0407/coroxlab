/* =========================================================
   COROX Films — film list
   This is the only file to edit when adding or changing a film.
   Each entry becomes one scroll act and one row in the index.

   id     File number shown on the site ("004")
   title  Big split title
   time   Clock time in the kicker ("18:52")
   place  Location in the kicker
   dur    Running time ("00:30")
   src    Video file in media/films/
   wide   true for 16:9 films, leave out for vertical 9:16
   line   One- or two-sentence logline
   ========================================================= */

export const FILMS = [
  {
    id: '001',
    title: '3 A.M.',
    time: '03:00',
    place: 'Taipei',
    dur: '00:18',
    src: 'media/films/001-3am.mp4',
    line: 'A crow who became a man and forgot how to fly. Convenience store, scooter, rooftop. We kept our distance and filmed.',
  },
  {
    id: '002',
    title: 'Night Ride',
    time: '23:47',
    place: 'Tokyo',
    dur: '00:24',
    src: 'media/films/002-night-ride.mp4',
    line: 'Red cap, white tee, black fixed-gear. Every night at 23:47 he races the last train.',
  },
  {
    id: '003',
    title: 'Bass Gravity',
    time: '03:07',
    place: '24-hour store',
    dur: '00:34',
    src: 'media/films/003-bass-gravity.mp4',
    line: 'A white rabbit walks into a 24-hour store. Three stomps, and the whole place tips upside down.',
  },
  {
    id: '004',
    title: 'Spotter',
    time: '18:52',
    place: 'Outback',
    dur: '00:30',
    src: 'media/films/004-spotter.mp4',
    wide: true,
    line: 'A small owl, a bow three times his size, a kangaroo who will not stop smirking. Then someone else picks up the bow.',
  },
  {
    id: '005',
    title: 'One More Wave',
    time: '05:40',
    place: 'Open sea',
    dur: '00:30',
    src: 'media/films/005-one-more-wave.mp4',
    wide: true,
    line: 'Storm clouds, cold water, a kid who will not paddle in. He waits for the last one.',
  },
  {
    id: '006',
    title: 'Hatch',
    time: '04:44',
    place: 'The well',
    dur: '00:34',
    src: 'media/films/006-hatch.mp4',
    line: 'A gloved hand learns fire. A bow of light, a fight by the well, a ring burning in the palm. Then he looks up and sees himself.',
  },
  {
    id: '007',
    title: 'Skyveil',
    time: '23:58',
    place: 'Clock tower',
    dur: '01:52',
    src: 'media/films/007-skyveil.mp4',
    wide: true,
    line: 'Two minutes to midnight at the academy. A wizard, a brawler and an elf, against something that should have stayed in chains.',
  },
  {
    id: '008',
    title: 'The Star Keeper',
    time: '00:00',
    place: 'Celestial clock',
    dur: '00:32',
    src: 'media/films/008-the-star-keeper.mp4',
    wide: true,
    line: 'A gecko in a spacesuit gets the clock running again. Then the second hand takes off with him on it.',
  },
];
