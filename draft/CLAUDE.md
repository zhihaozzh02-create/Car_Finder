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
3. `CENTRE` - the traced outlines. Each shape carries **`lv`, the levels it exists on**
   (`'L1'`, `'L2'`, `'L1 L2'` for both, `''` for not placed yet). This one field decides what each
   level's floor looks like: the plate is the convex hull of whatever is on that level, rebuilt at
   render time, so moving a car park between levels is a one-word edit. The current split comes
   from `images/L1 floor.png` and `images/L2 floor.png`, and P20, P19, P8/P9, P4/P5, P2/P3, P1 and
   the small north building are `''` - not on either floor yet, so they are not drawn.
   The outlines themselves are **not hand-authored**: each shape was extracted from
   `images/reference-sign.jpg` by flood-filling the sign's colour regions and simplifying the
   contour, so the silhouettes (the notches on P8/P9, the wedges on P15-P18, the stepped aqua and
   blue bands) match the real sign. Coordinates are already-projected picture coordinates in a
   999 x 755 box - there is no separate plan space. One shape can cover two car parks
   (`AQUA` = P4 + P5, `BLUE` = P2 + P3), exactly as the sign draws them.
4. `MODEL` - how one level is built: `squash` (1 = the sign's exact proportions), `floor` (how thick
   the floor plate is), `zone` (how far a car park sits above the plate - keep it thin, they are
   painted areas), `tower` (how tall the shopping centre masses stand; raising them too far hides
   the car parks behind them - 15 is about the limit), `edge` (how far the plate reaches past the
   content), `margin`.

There is no preset car. Until someone taps a bay, `carOf()` returns `null` and the level and car
park screens simply show the map with nothing marked - that is the correct empty state, not a bug.
Choosing a level in that state skips the "Finding your car…" step, because there is nothing to find
yet; you are on your way to record where you parked.

## The level plans
`CONFIG.levels[*].plan` holds the plan we draw ourselves - `mall` (the centre's outline, static),
`anchors` (store names), `streets` - and `zones` alongside it holds the car parks, which are the
only thing that takes a tap. All of it is picture-space geometry traced out of the rectified
directory maps in `reference/`, not hand-placed, and everything sizes off `plan.w` so a different
scan needs no new numbers. The view fits the drawn content, not the source sheet.

Tracing the individual tenancy blocks was tried and dropped: at phone size it came out as grey
soup, and the interior of the centre is not what someone looking for their car needs. One clean
silhouette plus anchor names reads far better.

The discriminator that made the tracing work is **r - g**: on these scans the paper, the grid and
the corridors all sit within ±8, while the tenancy fill is 18-37. Colour-distance thresholds
against a seed do not separate them, because the two scans have different paper casts.

`zones[*].park` points at a `CARPARKS` id for the colour and the tips; `zones[*].name` is what the
directory prints ("Pink Carpark"). A colour can cover two separate areas - Aqua on L1, Yellow and
Orange on L2 - and each area is its own polygon under the same name.

## Bays, and marking where you parked
There is no real bay data. `layoutBays()` generates bays inside a car park's traced outline: rows
either side of a drive aisle, which is the layout the centre's own kiosk screens show. The row
direction comes from `minAreaRect()` of the polygon rather than a fixed angle - that is what stops
the long slanted Green car park coming out skewed - and only bays whose four corners fall inside
the outline are kept, so none hang over the boundary. Sizes come from a real 2.5 x 5 m bay and a
6 m aisle through `plan.upm`, the level's units-per-metre, so both levels agree despite being
traced at different scales. The totals land near 5000 across the two levels, the right order for
this centre. Each bay gets a `Row C / Bay 16` reference; row letters skip I and O.

Every bay is tappable and asks "Did you park here?". Confirming writes `state.parked`
(`{level, park, bay, ref}`) to `localStorage` under `findmycar:parked`, and `carOf(lv)` makes that
override the demo data in `CONFIG.levels[*].car`. **A car can only be on one level** - `carOf()`
returns `null` for the other one, so the other level correctly shows no car. "I found my car"
clears the record.

Both maps pan and zoom - one finger drags, two pinch, wheel and double-click also work - via
`makeZoomable()`, which transforms a `<g class="zoomer">` inside the SVG and clamps the translate
so the content cannot be dragged out of view. Bays are only a few pixels at map scale, so zoom is
what makes tapping one possible; `zoomMoved()` suppresses the click that would otherwise fire at
the end of a drag.

## "You are here"
`CONFIG.levels[*].geo` holds two calibration points - for each, the plan coordinate and the real
lat/lon of the same spot. `geoToPlan()` solves the similarity transform (rotation, scale,
translation) from that pair and projects a GPS fix onto the plan, and returns `perMetre` so the
accuracy circle is drawn to scale. **Someone has to stand at two recognisable spots on each level
and record the coordinates** - pick them far apart. Until that is done the fields are `null` and no
"you are here" dot is drawn.

GPS does not have to work out which level you are on - the user already answered that on the home
screen - so its poor vertical accuracy is irrelevant here. What does bite is losing the fix
entirely under a concrete deck, so `trackHere()` watches the position while the level screen is
open and fails silently: no fix simply means no blue dot, and the red pin and the plan still do
their job. Blue is "you", red is "your car" - do not merge them.

To swap in a floor plan: drop the file in `images/`, set `image: 'images/L1.png'`, set `aspect` to
the image's real width / height, then tune the pin and zone percentages against the image.

## Rendering notes
- **One floor plate = one level.** `deck(lv)` takes only the shapes whose `lv` includes that level,
  builds the plate from them with `floorOf()` (`hull()` + `grow()`), draws it, then lays that
  level's car park zones and building masses on top. This is load-bearing: floating slabs read as a
  stack of floors, which is what the client rejected.
- Both levels share one viewBox *size* but are each centred on their own plate, so switching swaps
  the content without the model jumping or changing scale. `setPick()` must re-render - the two
  levels draw different things.
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
