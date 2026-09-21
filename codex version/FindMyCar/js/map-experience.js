(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll(".level-card"));
  var results = Array.prototype.slice.call(document.querySelectorAll(".search-result"));
  var search = document.getElementById("parkingSearch");
  var searchResults = document.getElementById("searchResults");
  var clearSearch = document.getElementById("clearSearch");
  var noResult = document.getElementById("noResult");
  var savedHome = document.getElementById("savedHome");
  var prototype = document.getElementById("prototype");
  var toast = document.getElementById("toast");
  var detectedByFloor = { L1: "P6", L2: "P22" };
  var draftBayByArea = {};
  var levelCamera = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.classList.remove("show"); }, 1700);
  }

  /* Home models come from the same polygons as the level maps.  Normalise
     by units-per-metre first so L1 and L2 keep a comparable physical size.
     This is a true isometric projection: both plan axes have unit length,
     so the source-plan proportions are not stretched in either direction. */
  function projectPlanPoint(point) {
    return [
      +((point[0] + point[1]) * .8660254).toFixed(2),
      +((point[1] - point[0]) * .5).toFixed(2)
    ];
  }

  function planMetres(points, unitsPerMetre) {
    return points.filter(function (point) {
      return point.length > 1 && isFinite(point[0]) && isFinite(point[1]);
    }).map(function (point) {
      return [point[0] / unitsPerMetre, point[1] / unitsPerMetre];
    });
  }

  function floorPlanItems(level) {
    var plan = CONFIG.levels[level].plan;
    var units = plan.upm || 1;
    var items = plan.mall.map(function (polygon, index) {
      return {
        id: "mall-" + index,
        building: true,
        pts: planMetres(parseZone(polygon), units).map(projectPlanPoint)
      };
    });

    CONFIG.levels[level].zones.forEach(function (zone, index) {
      var metres = planMetres(parseZone(zone.pts), units);
      items.push({
        id: zone.park + "-" + index,
        park: zone.park,
        pts: metres.map(projectPlanPoint)
      });
    });
    return items;
  }

  var planCardDepth = {
    building: 24,
    parking: 16
  };

  function planDeckMarkup(level, items) {
    var markup = '';

    items.slice().sort(function (a, b) {
      var aBottom = Math.max.apply(null, a.pts.map(function (point) { return point[1]; }));
      var bBottom = Math.max.apply(null, b.pts.map(function (point) { return point[1]; }));
      return aBottom - bBottom;
    }).forEach(function (item) {
      if (item.building) {
        markup += '<g class="plan-card-mass">' +
          slab(item.pts, planCardDepth.building, planCardDepth.building,
            'var(--bldg)', 'var(--bldg-side-2)') +
          '</g>';
      } else {
        var fill = parkFill(item.park);
        markup += '<g class="plan-card-zone" data-zone="' + item.id + '">' +
          slab(item.pts, planCardDepth.parking, planCardDepth.parking,
            fill, sideColour(fill, .38)) +
          '</g>';
      }
    });
    return markup;
  }

  function renderCardModels() {
    var models = Object.keys(CONFIG.levels).map(function (level) {
      var items = floorPlanItems(level);
      var points = items.reduce(function (all, item) { return all.concat(item.pts); }, []);
      var xs = points.map(function (point) { return point[0]; });
      var ys = points.map(function (point) { return point[1]; });
      return {
        level: level,
        items: items,
        x0: Math.min.apply(null, xs),
        x1: Math.max.apply(null, xs),
        y0: Math.min.apply(null, ys) - planCardDepth.building,
        y1: Math.max.apply(null, ys)
      };
    });
    var margin = 28;
    var width = Math.max.apply(null, models.map(function (model) { return model.x1 - model.x0; })) + margin * 2;
    var height = Math.max.apply(null, models.map(function (model) { return model.y1 - model.y0; })) + margin * 2;

    cards.forEach(function (card) {
      var level = card.getAttribute("data-floor");
      var model = models.filter(function (item) { return item.level === level; })[0];
      var viewBox = [
        (model.x0 + model.x1) / 2 - width / 2,
        (model.y0 + model.y1) / 2 - height / 2,
        width,
        height
      ].map(function (number) { return number.toFixed(1); }).join(" ");
      var svg = card.querySelector(".level-model");
      svg.setAttribute("viewBox", viewBox);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.setAttribute("aria-label", CONFIG.levels[level].name + " 3D model based on the floor plan");
      svg.innerHTML = planDeckMarkup(level, model.items);
    });
  }

  function activePark() {
    var car = carOf(state.level);
    if (car) return car.park;
    if (state.detail && CONFIG.levels[state.level].zones.some(function (zone) { return zone.park === state.detail; })) return state.detail;
    return detectedByFloor[state.level];
  }

  function installLevelCamera(source, initialBounds) {
    /* Clone once to remove the index camera listeners. Those listeners use
       the focused viewBox as zoom level 1, which makes zooming back to the
       complete plan impossible. */
    var svg = source.cloneNode(true);
    source.parentNode.replaceChild(svg, source);
    svg.removeAttribute("data-zoom");
    svg.dataset.moved = "0";
    var zoomer = svg.querySelector(".zoomer");
    var vb = svg.viewBox.baseVal;
    var view = { k: 1, x: 0, y: 0 };
    var pointers = new Map();
    var pinch = null;
    var downScreen = null;
    var captured = false;
    var minZoom = 1;
    var maxZoom = 14;

    function clamp() {
      var span = 1 - view.k;
      var edgeX = vb.width * .14;
      var edgeY = vb.height * .14;
      var minX = (vb.x + vb.width) * span - edgeX;
      var maxX = vb.x * span + edgeX;
      var minY = (vb.y + vb.height) * span - edgeY;
      var maxY = vb.y * span + edgeY;
      view.x = Math.max(minX, Math.min(maxX, view.x));
      view.y = Math.max(minY, Math.min(maxY, view.y));
    }

    function apply() {
      clamp();
      zoomer.setAttribute("transform", "translate(" + view.x.toFixed(2) + " " + view.y.toFixed(2) + ") scale(" + view.k.toFixed(4) + ")");
      svg.classList.toggle("is-zoomed", view.k > 1.02);
    }

    function toUser(clientX, clientY) {
      var matrix = svg.getScreenCTM();
      if (!matrix) return [vb.x + vb.width / 2, vb.y + vb.height / 2];
      var point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
      return [point.x, point.y];
    }

    function zoomAt(point, nextZoom) {
      nextZoom = Math.max(minZoom, Math.min(maxZoom, nextZoom));
      var worldX = (point[0] - view.x) / view.k;
      var worldY = (point[1] - view.y) / view.k;
      view.k = nextZoom;
      view.x = point[0] - worldX * nextZoom;
      view.y = point[1] - worldY * nextZoom;
      apply();
    }

    function centrePoint() {
      return [vb.x + vb.width / 2, vb.y + vb.height / 2];
    }

    function reset() {
      view.k = 1;
      view.x = 0;
      view.y = 0;
      apply();
    }

    function focus(bounds) {
      var scale = Math.min(vb.width / bounds.width, vb.height / bounds.height);
      view.k = Math.max(1.85, Math.min(6, scale));
      var centreX = bounds.x + bounds.width / 2;
      var centreY = bounds.y + bounds.height / 2;
      view.x = vb.x + vb.width / 2 - centreX * view.k;
      view.y = vb.y + vb.height / 2 - centreY * view.k;
      apply();
    }

    svg.addEventListener("pointerdown", function (event) {
      pointers.set(event.pointerId, toUser(event.clientX, event.clientY));
      svg.dataset.moved = "0";
      downScreen = [event.clientX, event.clientY];
      if (pointers.size === 2) {
        var pair = Array.from(pointers.values());
        pinch = { distance: Math.hypot(pair[0][0] - pair[1][0], pair[0][1] - pair[1][1]), zoom: view.k };
        try { svg.setPointerCapture(event.pointerId); captured = true; } catch (error) {}
      }
    });

    svg.addEventListener("pointermove", function (event) {
      if (!pointers.has(event.pointerId)) return;
      var previous = pointers.get(event.pointerId);
      var current = toUser(event.clientX, event.clientY);
      pointers.set(event.pointerId, current);

      if (pointers.size === 2 && pinch) {
        var pair = Array.from(pointers.values());
        var distance = Math.hypot(pair[0][0] - pair[1][0], pair[0][1] - pair[1][1]);
        var middle = [(pair[0][0] + pair[1][0]) / 2, (pair[0][1] + pair[1][1]) / 2];
        if (pinch.distance) zoomAt(middle, pinch.zoom * distance / pinch.distance);
        svg.dataset.moved = "1";
        return;
      }

      if (pointers.size === 1 && downScreen && Math.hypot(event.clientX - downScreen[0], event.clientY - downScreen[1]) > 7) {
        svg.dataset.moved = "1";
        if (!captured) {
          try { svg.setPointerCapture(event.pointerId); captured = true; } catch (error) {}
        }
      }
      if (svg.dataset.moved === "1" && view.k > 1.001) {
        view.x += current[0] - previous[0];
        view.y += current[1] - previous[1];
        apply();
      }
    });

    function finishPointer(event) {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) { captured = false; downScreen = null; }
    }
    svg.addEventListener("pointerup", finishPointer);
    svg.addEventListener("pointercancel", finishPointer);
    svg.addEventListener("wheel", function (event) {
      event.preventDefault();
      zoomAt(toUser(event.clientX, event.clientY), view.k * (event.deltaY < 0 ? 1.22 : 1 / 1.22));
    }, { passive: false });
    svg.addEventListener("dblclick", function (event) {
      event.preventDefault();
      zoomAt(toUser(event.clientX, event.clientY), view.k * 1.8);
    });

    Array.prototype.forEach.call(svg.querySelectorAll(".pz"), function (zone) {
      zone.addEventListener("click", function () {
        if (svg.dataset.moved === "1") return;
        tapThen(zone, function () { openDetail(zone.getAttribute("data-park")); });
      });
      zone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          tapThen(zone, function () { openDetail(zone.getAttribute("data-park")); });
        }
      });
    });

    levelCamera = {
      zoomIn: function () { zoomAt(centrePoint(), view.k * 1.45); },
      zoomOut: function () { zoomAt(centrePoint(), view.k / 1.45); },
      reset: reset
    };
    focus(initialBounds);
    return svg;
  }

  /* Fit the active area the way a map camera fits a destination: the whole
     target stays visible, with a neighbour, nearby landmarks and a road for
     orientation. Bay-level detail is intentionally reserved for Details. */
  function focusLevelPlan() {
    var level = CONFIG.levels[state.level];
    var park = activePark();
    var svg = document.querySelector("#level-overlay .planmap");
    var targets = level.zones.filter(function (item) { return item.park === park; });
    if (!targets.length || !svg) return;

    var targetPolys = targets.map(function (item) { return parseZone(item.pts); });
    var targetPoints = targetPolys.reduce(function (all, polygon) { return all.concat(polygon); }, []);
    var targetCentres = targetPolys.map(centroid);
    var centre = [
      targetCentres.reduce(function (sum, point) { return sum + point[0]; }, 0) / targetCentres.length,
      targetCentres.reduce(function (sum, point) { return sum + point[1]; }, 0) / targetCentres.length
    ];
    var cameraPoint = centroid(targetPolys[0]);
    var car = carOf(state.level);
    if (car && car.park === park && car.bay != null) {
      var parkedBays = layoutBays(targetPolys[0], baySpec(level.plan.upm));
      if (parkedBays[car.bay]) cameraPoint = centroid(parkedBays[car.bay].quad);
    }
    var distance = function (point) { return Math.hypot(point[0] - centre[0], point[1] - centre[1]); };

    var zoneGroups = Array.prototype.slice.call(svg.querySelectorAll('.pz[data-park="' + park + '"]'));

    /* No saved bay yet: the floor tap behaves like a simulated GPS lookup.
       It identifies a parking area, not an exact bay, so the accuracy circle
       remains visible until the user confirms a bay in Details. */
    if (!car) {
      zoneGroups.forEach(function (group) { group.classList.add("is-detected"); });
      var pinAt = cameraPoint;
      var unit = level.plan.w / 1000;
      var accuracyRadius = Math.max(9 * level.plan.upm, 34 * unit);
      var marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
      marker.setAttribute("class", "auto-locate");
      marker.setAttribute("transform", "translate(" + pinAt[0].toFixed(1) + " " + pinAt[1].toFixed(1) + ")");
      marker.innerHTML =
        '<circle class="auto-locate-area" r="' + accuracyRadius.toFixed(1) + '"/>' +
        '<circle class="auto-locate-halo" r="' + (30 * unit).toFixed(1) + '"/>' +
        '<circle class="auto-locate-head" r="' + (15 * unit).toFixed(1) + '" stroke-width="' + (4.5 * unit).toFixed(1) + '"/>' +
        '<circle class="auto-locate-eye" r="' + (4.5 * unit).toFixed(1) + '"/>';
      var zoomer = svg.querySelector(".zoomer");
      if (zoomer) zoomer.appendChild(marker);
      document.getElementById("level-title").textContent = parkName(park);
      document.getElementById("level-sub").textContent = "Approximate GPS area · 5–10 m";
      document.getElementById("mapAccuracy").textContent = "Approximate GPS area · 5–10 m";
    } else {
      var savedMarker = svg.querySelector(".carmark");
      if (savedMarker) {
        var savedRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        savedRing.setAttribute("class", "saved-focus-ring");
        savedRing.setAttribute("r", (62 * (level.plan.w / 1000)).toFixed(1));
        savedMarker.insertBefore(savedRing, savedMarker.firstChild);
      }
      document.getElementById("mapAccuracy").textContent = "Saved parking location";
    }

    var contextual = [];
    var neighbours = level.zones.filter(function (item) { return item.park !== park; })
      .map(function (item) {
        var polygon = parseZone(item.pts);
        return { polygon: polygon, distance: distance(centroid(polygon)) };
      })
      .sort(function (a, b) { return a.distance - b.distance; });
    if (neighbours[0]) contextual = contextual.concat(neighbours[0].polygon);

    (level.plan.anchors || []).map(function (anchor) {
      return { point: [anchor.x, anchor.y], distance: distance([anchor.x, anchor.y]) };
    }).sort(function (a, b) { return a.distance - b.distance; }).slice(0, 2)
      .forEach(function (item) { contextual.push(item.point); });

    var street = (level.plan.streets || []).map(function (item) {
      return { point: [item.x, item.y], distance: distance([item.x, item.y]) };
    }).sort(function (a, b) { return a.distance - b.distance; })[0];
    if (street) contextual.push(street.point);

    var interest = targetPoints.concat(contextual);
    var xs = interest.map(function (point) { return point[0]; });
    var ys = interest.map(function (point) { return point[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var contentWidth = Math.max(1, x1 - x0);
    var contentHeight = Math.max(1, y1 - y0);
    var padding = Math.max(contentWidth, contentHeight) * .16;
    x0 -= padding; x1 += padding; y0 -= padding; y1 += padding;

    var slot = document.getElementById("level-plan");
    var ratio = slot.clientWidth && slot.clientHeight ? slot.clientWidth / slot.clientHeight : 1;
    var frameWidth = x1 - x0;
    var frameHeight = y1 - y0;
    if (frameWidth / frameHeight > ratio) {
      var requiredHeight = frameWidth / ratio;
      y0 -= (requiredHeight - frameHeight) / 2;
      frameHeight = requiredHeight;
    } else {
      var requiredWidth = frameHeight * ratio;
      x0 -= (requiredWidth - frameWidth) / 2;
      frameWidth = requiredWidth;
    }

    /* Keep the located pin at the visual centre. Context remains available
       around it, while the minimum 1.85× camera scale prevents a full-plan
       view from weakening the location emphasis. */
    x0 = cameraPoint[0] - frameWidth / 2;
    y0 = cameraPoint[1] - frameHeight / 2;

    svg.setAttribute("aria-label", parkName(park) + " with nearby landmarks and map grid");
    installLevelCamera(svg, { x: x0, y: y0, width: frameWidth, height: frameHeight });
  }

  var renderWholeLevel = renderLevel;
  renderLevel = function (level, drop) {
    renderWholeLevel(level, drop);
    focusLevelPlan();
  };

  function detailAreaKey() {
    return state.level + ":" + (state.detail || activePark());
  }

  function nearestBayTo(points, target) {
    var best = 0;
    var bestDistance = Infinity;
    points.forEach(function (spot, index) {
      var point = centroid(spot.quad);
      var distance = Math.hypot(point[0] - target[0], point[1] - target[1]);
      if (distance < bestDistance) { best = index; bestDistance = distance; }
    });
    return best;
  }

  function paintDetailPin() {
    var svg = document.querySelector("#detail-overlay .baymap");
    var hint = document.getElementById("detailHint");
    var spots = state.spots || [];
    var park = state.detail || activePark();
    var car = carOf(state.level);
    if (!svg || !spots.length) {
      hint.textContent = "Detailed parking-bay layout will be inserted here";
      return;
    }

    var old = svg.querySelector(".detail-draft-pin");
    if (old) old.remove();
    if (car && car.park === park) {
      hint.textContent = "Saved · " + (car.ref || "parking bay");
      return;
    }

    var zone = CONFIG.levels[state.level].zones.filter(function (item) { return item.park === park; })[0];
    var key = detailAreaKey();
    if (draftBayByArea[key] == null) {
      draftBayByArea[key] = nearestBayTo(spots, centroid(parseZone(zone.pts)));
    }
    var bay = Math.max(0, Math.min(spots.length - 1, draftBayByArea[key]));
    var at = centroid(spots[bay].quad);
    var all = spots.reduce(function (points, spot) { return points.concat(spot.quad); }, []);
    var width = Math.max.apply(null, all.map(function (point) { return point[0]; })) -
      Math.min.apply(null, all.map(function (point) { return point[0]; }));
    var unit = Math.max(.35, width / 1000);
    var marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
    marker.setAttribute("class", "detail-draft-pin");
    marker.setAttribute("transform", "translate(" + at[0].toFixed(1) + " " + at[1].toFixed(1) + ")");
    marker.innerHTML =
      '<circle class="detail-draft-ring" r="' + (70 * unit).toFixed(1) + '"/>' +
      '<circle class="detail-draft-halo" r="' + (42 * unit).toFixed(1) + '"/>' +
      '<circle class="detail-draft-head" r="' + (22 * unit).toFixed(1) + '" stroke-width="' + (7 * unit).toFixed(1) + '"/>' +
      '<circle class="detail-draft-eye" r="' + (7 * unit).toFixed(1) + '"/>';
    var zoomer = svg.querySelector(".zoomer");
    if (zoomer) zoomer.appendChild(marker);
    hint.textContent = "Schematic bays · tap one to refine the pin";
  }

  function enableDetailRefinement() {
    var layer = document.getElementById("detail-overlay");
    Array.prototype.forEach.call(layer.querySelectorAll(".bay"), function (bay) {
      var refine = function () {
        if (zoomMoved(layer)) return;
        draftBayByArea[detailAreaKey()] = Number(bay.getAttribute("data-bay"));
        paintDetailPin();
      };
      bay.addEventListener("click", refine);
      bay.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") refine();
      });
    });
  }

  var renderWholeDetail = renderDetail;
  renderDetail = function () {
    renderWholeDetail();
    paintDetailPin();
    enableDetailRefinement();
  };

  function syncSkin() {
    prototype.setAttribute("data-floor", state.level);
    var car = carOf(state.level);
    var park = activePark();
    document.getElementById("cueMark").textContent = park;
    savedHome.hidden = !state.parked;
    if (state.parked) savedHome.textContent = "Saved · " + state.parked.level + " · " + state.parked.park;
    cards.forEach(function (card) {
      card.classList.remove("selected");
      card.setAttribute("aria-pressed", "false");
    });
  }

  async function chooseLevel(level, node) {
    if (!carOf(level)) state.detail = detectedByFloor[level];
    document.querySelector("#locating p").textContent = "Locating your parking area…";
    showFinding(true);
    await pickLevel(level, node);
    node.classList.remove("is-picked");
    syncSkin();
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () { chooseLevel(card.getAttribute("data-floor"), card); });
  });
  document.querySelectorAll(".floor-switch button").forEach(function (button) {
    button.addEventListener("click", function () {
      var level = button.getAttribute("data-level");
      if (!carOf(level)) state.detail = detectedByFloor[level];
      window.setTimeout(function () {
        renderLevel(level, true);
        syncSkin();
      }, 0);
    });
  });

  document.getElementById("locateButton").addEventListener("click", function () {
    if (!carOf(state.level)) state.detail = detectedByFloor[state.level];
    renderLevel(state.level, true);
    syncSkin();
    showToast("Approximate GPS area · 5–10 m");
  });
  document.getElementById("mapZoomIn").addEventListener("click", function () {
    if (levelCamera) levelCamera.zoomIn();
  });
  document.getElementById("mapZoomOut").addEventListener("click", function () {
    if (levelCamera) levelCamera.zoomOut();
  });
  document.getElementById("mapZoomAll").addEventListener("click", function () {
    if (levelCamera) levelCamera.reset();
    showToast("Showing the complete floor plan");
  });

  function openCurrentPark() {
    openDetail(activePark());
    syncSkin();
  }
  document.getElementById("parkingInfo").addEventListener("click", openCurrentPark);
  document.getElementById("confirmButton").addEventListener("click", openCurrentPark);
  document.getElementById("ask-yes").addEventListener("click", function () {
    window.setTimeout(function () { syncSkin(); showToast("Parking location saved"); }, 0);
  });

  function matches(query, floor) {
    var q = query.trim().toLowerCase().replace(/[-_]+/g, " ");
    if (!q) return true;
    var terms = floor === "L1"
      ? "park parking l1 level 1 p4 p5 p6 p21 p11 aqua pink green purple coles kmart myer"
      : "park parking l2 level 2 p8 p7 p22 p10 p17 p15 p14 black grey olive violet yellow orange red big w woolworths";
    return terms.indexOf(q) !== -1;
  }

  function updateSearch() {
    var value = search.value;
    var visible = 0;
    clearSearch.hidden = !value;
    searchResults.hidden = !value;
    results.forEach(function (button) {
      var show = matches(value, button.getAttribute("data-floor"));
      button.hidden = !show;
      if (show) visible += 1;
    });
    noResult.hidden = visible !== 0;
  }

  search.addEventListener("input", updateSearch);
  search.addEventListener("focus", function () { if (search.value) searchResults.hidden = false; });
  search.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    var visible = results.filter(function (button) { return !button.hidden; });
    if (visible.length === 1) chooseLevel(visible[0].getAttribute("data-floor"), visible[0]);
    else showToast(visible.length ? "Choose L1 or L2" : "No L1 or L2 match");
  });
  results.forEach(function (button) {
    button.addEventListener("click", function () { chooseLevel(button.getAttribute("data-floor"), button); });
  });
  clearSearch.addEventListener("click", function () {
    search.value = "";
    updateSearch();
    search.focus();
  });

  document.querySelectorAll("[data-back]").forEach(function (button) {
    button.addEventListener("click", function () { window.setTimeout(syncSkin, 0); });
  });
  document.getElementById("foundButton").addEventListener("click", function () {
    draftBayByArea = {};
  });

  renderCardModels();
  syncSkin();
})();
