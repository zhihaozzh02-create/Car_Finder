# Find my car – Garden City (DECO7250 mid-fi prototype)

A mobile-first web prototype that helps shoppers find their car at Westfield Garden City.
No build step, no dependencies - open `index.html` in a browser.

## Files
- `index.html` - structure only (three `<section class="screen">` blocks + the "Finding your car…" overlay)
- `styles.css` - all styling. Everything goes through the tokens at the top of `:root`
- `app.js` - data + logic, in four numbered blocks (see below)
- `images/` - floor plans and tip photos. `reference-sign.jpg` is the centre's
  "Can't Find Your Car?" sign; the 3D model on screen 1 is traced from it

## Flow (3 screens)
1. **Home** (`#home`): an L1 / L2 pill switch, **one level's model**, and a small drawing-sheet
   caption (`LEVEL 01`). There is deliberately no top bar, no visible heading and no hint line.
   The model is a real `<button class="deck">` - tapping it opens that level. A visually hidden
   `<h1 class="sr-only">` keeps the screen named for screen readers and is what `show()` focuses.
   **Never show both levels at once.** An earlier version stacked two decks and the client read the
   rows of slabs as a stack of floors, which is exactly the confusion the floor plate now prevents.
2. **Level plan** (`#level`): floor plan of the chosen level. Red zone = the user's car park,
   red pin = the car, a callout sits on the pin. Tapping the pin opens screen 3.
   The L1 / L2 segmented control in the top bar switches level without re-running the search.
3. **Car park detail** (`#detail`): detail plan of that car park, pin "Your car", a list of tips,
   "I found my car" returns home.

## Where to change things (`app.js`)
1. `CONFIG` - per level: plan image, `aspect`, pin `x/y` and the red `zone`
   (all percentages of the plan box, 0-100 from the top-left); per car park: detail image and tips.
   `useRealGPS` is `false` by default.
2. `CARPARKS` - each car park's display name and sign colour. Used for the titles, the colour
   swatch and the model.
3. `CENTRE` - the traced outlines plus `plate`, the floor outline. **These are not hand-authored**:
   each shape was extracted from `images/reference-sign.jpg` by flood-filling the sign's colour
   regions and simplifying the contour, so the silhouettes (the notches on P8/P9, the wedges on
   P15-P18, the stepped aqua and blue bands) match the real sign. `plate` is the convex hull of
   every shape, offset outward by 34. Coordinates are already-projected picture coordinates in a
   999 x 755 box - there is no separate plan space. One shape can cover two car parks
   (`AQUA` = P4 + P5, `BLUE` = P2 + P3), exactly as the sign draws them.
4. `MODEL` - how one level is built: `squash` (1 = the sign's exact proportions), `floor` (how thick
   the floor plate is), `zone` (how far a car park sits above the plate - keep it thin, they are
   painted areas), `tower` (how tall the shopping centre masses stand; raising them too far hides
   the car parks behind them - 15 is about the limit), `margin`.

To swap in a floor plan: drop the file in `images/`, set `image: 'images/L1.png'`, set `aspect` to
the image's real width / height, then tune the pin and zone percentages against the image.

## Rendering notes
- **One floor plate = one level.** `deck()` draws the plate first, then the car park zones and the
  building masses on top of it. This is load-bearing: floating slabs read as a stack of floors.
- `slab(pts, lift, height, top, side)` raises a polygon by `lift` and extrudes it down by `height`.
  It normalises the winding, then draws a wall for every edge whose direction has a negative x -
  those are the faces turned toward the viewer - and lays the top face over them.
- Shapes are painted back-to-front by their lowest point (painter's algorithm).
- **Materials, not outlines.** Walls are filled with a per-colour vertical gradient (lit at the top
  edge, shaded at the bottom) built by `wallGrads()`; top faces are flat matte with one hairline
  `--edge` highlight. The plate and the building masses each get an `feDropShadow`. There are no
  keylines anywhere - if you find yourself adding a stroke to a wall, stop.

## Design rules (keep these)
- The model is styled as **a photograph of a physical architectural scale model**: matte materials,
  believable light from above, soft shadows, a studio backdrop that fades into the page.
  The client explicitly rejected the earlier flat Bauhaus look - do not reintroduce keylines,
  square hard-edged cards or a purely flat treatment.
- One task per screen. Big tap targets, short sentence-case copy, no extra buttons or banners.
- Colour is semantic: black / white is the interface, **red only ever means "your car"**
  (pin, zone, the picked level). Car park colours appear only inside the model and on the swatch,
  and they must stay recognisable against the physical sign - shift value for material realism,
  never hue. Never colour-code L1 / L2 - it would clash with "P2 Blue" / "P17 Yellow".
- Font: Jost (Google Fonts) with system fallbacks.
- Light / dark both have to work - define colours as tokens under `:root`, never inline.
- Respect `prefers-reduced-motion` (one rule at the bottom of `styles.css` turns everything off)
  and keep keyboard focus visible.

## Run
Open `index.html`, or `python3 -m http.server 8000` in this folder and open
http://localhost:8000 (for phone testing on the same Wi-Fi, use http://<mac-ip>:8000).
