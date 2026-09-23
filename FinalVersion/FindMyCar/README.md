# FindMyCar modular prototype

Open `index.html` directly in a browser. The prototype is self-contained and does not depend on the old single-file HTML page.

## Structure

```text
FindMyCar/
├── index.html
├── css/
│   ├── variables.css       Design tokens and colours
│   ├── base.css            Reset and document defaults
│   ├── layout.css          Phone shell and shared screen layout
│   ├── home.css            Level selection and search screen
│   ├── map.css             Floor-map screen
│   ├── details.css         Parking-detail screen
│   ├── map-renderer.css    Generated SVG map and bay styles
│   ├── feedback.css        Dialog, locating overlay, and toast
│   ├── buttons.css         Shared and action-button styles
│   └── responsive.css      Small-screen and reduced-motion rules
└── js/
    ├── config.js           Floor, car-park, and model data
    ├── home-model.js       Home-screen 3D model rendering
    ├── app.js              Core state, rendering, and interaction logic
    └── map-experience.js   Camera, focus, and bay-refinement enhancements
```

The CSS files are loaded in cascade order, and the JavaScript files are loaded in dependency order at the end of `index.html`.
