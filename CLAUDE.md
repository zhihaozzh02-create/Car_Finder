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
1. **Home** (`#home`): nothing but the 3D model, drawn as **two stacked decks** - L2 above L1,
   centred in the viewport. There is deliberately no top bar, no visible heading and no caption -
   the two decks are the entire screen. Each deck is a real `<button class="deck">` holding an
   HTML label (`.deck-tag`) and the plate SVG (`.deck-art`); the model *is* the control.
   A visually hidden `<h1 class="sr-only">` keeps the screen named for screen readers and is what
   `show()` moves focus to. **Do not add a heading, a hint line or L1 / L2 buttons back.**
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
3. `CENTRE` - the traced outlines. **These are not hand-authored**: each shape was extracted from
   `images/reference-sign.jpg` by flood-filling the sign's colour regions and simplifying the
   contour, so the silhouettes (the notches on P8/P9, the wedges on P15-P18, the stepped aqua and
   blue bands) match the real sign. Coordinates are already-projected picture coordinates in a
   999 x 755 box - there is no separate plan space. One shape can cover two car parks
   (`AQUA` = P4 + P5, `BLUE` = P2 + P3), exactly as the sign draws them.
4. `MODEL` - how one deck is drawn: `squash` (1 = the sign's exact proportions, but the stack gets
   very tall), `depth` (deck thickness), `pad` (canvas margin). The spacing between the two decks
   and the size of the L1 / L2 labels are CSS, not JS - see `.decks` and `.deck-tag` in
   `styles.css`. Both decks share one rendered plate; `deck()` is called once in `renderStage()`.

To swap in a floor plan: drop the file in `images/`, set `image: 'images/L1.png'`, set `aspect` to
the image's real width / height, then tune the pin and zone percentages against the image.

## Rendering notes
- `slab()` extrudes a polygon straight down. It normalises the winding, then draws a wall for
  every edge whose projected direction has a negative x - those are the faces turned toward the
  viewer - and finally lays the top face over them.
- Shapes are painted back-to-front by their lowest point (painter's algorithm), so the decks
  overlap the way they do on the sign.
- Model outlines use `vector-effect: non-scaling-stroke` so they stay hairline at any size.

## Design rules (keep these)
- One task per screen. Big tap targets, short sentence-case copy, no extra buttons or banners.
- Colour is semantic: black / white is the interface, **red only ever means "your car"**
  (pin, zone, the picked deck). Car park colours appear only inside the model and on the swatch.
  Never colour-code L1 / L2 - it would clash with "P2 Blue" / "P17 Yellow".
- Flat: no gradients. Elevation is a hard offset shadow (`--lift`), never a blur.
- Font: Jost (Google Fonts) with system fallbacks.
- Light / dark both have to work - define colours as tokens under `:root`, never inline.
- Respect `prefers-reduced-motion` (one rule at the bottom of `styles.css` turns everything off)
  and keep keyboard focus visible.

## Run
Open `index.html`, or `python3 -m http.server 8000` in this folder and open
http://localhost:8000 (for phone testing on the same Wi-Fi, use http://<mac-ip>:8000).
