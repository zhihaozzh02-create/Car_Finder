(function () {
  /* Exact top-face coordinates traced from the supplied Garden City reference sign.
     L1 is the Coles/Myer layer immediately above “You Are Here”.
     L2 is the BIG W layer. Every entry is rendered as its own extruded 3D slab. */
  var referenceShapes = [
    { id: "P15", floor: "L2", colour: "#F26B21", points: "76 210,96 216,147 257,43 265,40 285,3 255,0 235,75 211" },
    { id: "P17", floor: "L2", colour: "#F6C700", points: "91 210,165 214,176 236,223 237,243 248,147 256,91 211" },
    { id: "P11", floor: "L2", colour: "#5B2D8E", points: "274 198,396 202,378 217,257 215,169 212,169 207,273 199" },
    { id: "P22", floor: "L2", colour: "#3F5A2E", points: "409 224,756 233,756 247,393 237,408 225" },
    { id: "B2", floor: "L2", building: true, colour: "#F7F4EC", points: "839 233,977 236,976 249,975 243,966 243,898 288,795 298,771 284,779 278,777 268,708 267,672 293,614 292,615 281,532 279,512 294,273 288,89 304,43 268,241 252,245 247,261 249,274 239,817 249,838 234" },
    { id: "P10", floor: "L2", colour: "#B15CB5", points: "282 291,402 295,384 309,374 309,187 303,182 299,281 292" },
    { id: "P7", floor: "L2", colour: "#7C7C7C", points: "727 269,774 270,779 274,769 274,726 307,514 301,532 283,613 285,612 295,679 296,710 272,726 270" },

    { id: "P21", floor: "L1", colour: "#6DBE2B", points: "654 375,685 377,653 397,384 388,400 378,653 376" },
    { id: "B3", floor: "L1", building: true, colour: "#F7F4EC", points: "734 378,805 380,805 392,832 393,824 403,825 413,866 413,869 400,882 394,959 397,888 442,786 451,772 446,615 441,597 454,502 451,501 459,494 461,494 445,479 444,497 442,513 430,512 421,414 418,385 440,291 438,303 429,302 420,261 412,326 398,337 390,700 402,733 379" },
    { id: "P13", floor: "L1", building: true, colour: "#FFF2BD", points: "422 421,520 425,489 444,395 441,421 422" },
    { id: "P14", floor: "L1", colour: "#D12B2B", points: "166 430,191 444,188 448,112 453,92 437,165 431" },
    { id: "P6", floor: "L1", colour: "#E0457B", points: "622 445,740 449,740 468,730 472,726 458,610 454,621 446" }
  ];

  function parseReferencePoints(value) {
    return value.split(",").map(function (pair) {
      return pair.trim().split(/\s+/).map(Number);
    });
  }

  function shade(hex, amount) {
    var number = parseInt(hex.slice(1), 16);
    var red = (number >> 16) & 255;
    var green = (number >> 8) & 255;
    var blue = number & 255;
    var mix = function (channel) { return Math.round(channel * (1 - amount)); };
    return "rgb(" + mix(red) + "," + mix(green) + "," + mix(blue) + ")";
  }

  function slabMarkup(shape, shadowId) {
    var points = parseReferencePoints(shape.points);
    var area = 0;
    var height = shape.building ? 44 : 32;
    var front = shape.building ? "#E9D99A" : shade(shape.colour, .25);
    var side = shape.building ? "#CFBB70" : shade(shape.colour, .38);

    points.forEach(function (point, index) {
      var next = points[(index + 1) % points.length];
      area += point[0] * next[1] - next[0] * point[1];
    });
    if (area < 0) points.reverse();

    var walls = "";
    points.forEach(function (point, index) {
      var next = points[(index + 1) % points.length];
      if (next[0] - point[0] < 0) {
        var wallClass = next[1] > point[1] ? "side" : "front";
        walls += "<polygon class=\"" + wallClass + "\" points=\"" +
          point[0] + "," + point[1] + " " + next[0] + "," + next[1] + " " +
          next[0] + "," + (next[1] + height) + " " + point[0] + "," + (point[1] + height) + "\"/>";
      }
    });

    return "<g class=\"model-slab" + (shape.building ? " model-building" : "") +
      "\" data-zone=\"" + shape.id + "\" filter=\"url(#" + shadowId + ")\" style=\"--top:" +
      shape.colour + ";--front:" + front + ";--side:" + side + "\">" + walls +
      "<polygon class=\"top\" points=\"" + points.map(function (point) { return point.join(","); }).join(" ") + "\"/></g>";
  }

  function renderReferenceModels() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-model-floor]"), function (svg) {
      var floor = svg.getAttribute("data-model-floor");
      var shadowId = "reference-shadow-" + floor;
      var shapes = referenceShapes.filter(function (shape) { return shape.floor === floor; });
      shapes.sort(function (a, b) {
        var aMax = Math.max.apply(null, parseReferencePoints(a.points).map(function (point) { return point[1]; }));
        var bMax = Math.max.apply(null, parseReferencePoints(b.points).map(function (point) { return point[1]; }));
        return aMax - bMax;
      });
      svg.innerHTML = "<defs><filter id=\"" + shadowId + "\" x=\"-15%\" y=\"-25%\" width=\"140%\" height=\"185%\"><feDropShadow dx=\"4\" dy=\"11\" stdDeviation=\"7\" flood-color=\"#000\" flood-opacity=\".20\"/></filter></defs>" +
        shapes.map(function (shape) { return slabMarkup(shape, shadowId); }).join("");
      });
  }

  /* Draw the two full-floor models before the main application is initialised. */
  renderReferenceModels();
})();
