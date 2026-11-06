/* Portugal: Three Ways In — renders every page from data/places.json.
   No dependencies, no tracking. The shortlist lives only in this browser's localStorage. */
(function () {
  "use strict";

  var DATA_URL = "data/places.json";
  var STORE_KEY = "three-ways-in:shortlist";
  var REGION_ORDER = ["lisbon", "madeira", "azores"];
  var CATEGORIES = [
    { key: "food-wine", label: "Food & Wine" },
    { key: "history-culture", label: "History & Culture" },
    { key: "nature", label: "Nature" }
  ];
  var ROMAN = ["I", "II", "III", "IV", "V", "VI"];

  var body = document.body;
  var page = body.getAttribute("data-page");
  var main = document.getElementById("main");

  /* ---------- helpers ---------- */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function safeUrl(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u) || /^[\w./#?=&%-]+$/.test(u)) {
      return /^javascript:/i.test(u) ? "" : u;
    }
    return "";
  }
  function categoryLabel(key) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].key === key) return CATEGORIES[i].label;
    return key;
  }

  /* ---------- shortlist storage (local only) ---------- */
  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function writeStore(list) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable: star still toggles for this visit */ }
  }
  var memoryStore = readStore();
  function isStarred(key) { return memoryStore.indexOf(key) !== -1; }
  function toggleStar(key) {
    var i = memoryStore.indexOf(key);
    if (i === -1) memoryStore.push(key); else memoryStore.splice(i, 1);
    writeStore(memoryStore);
    updateCount();
    return i === -1;
  }
  function updateCount() {
    var els = document.querySelectorAll("[data-shortlist-count]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = memoryStore.length;
      els[i].hidden = memoryStore.length === 0;
    }
  }
  window.addEventListener("storage", function (e) {
    if (e.key === STORE_KEY) {
      memoryStore = readStore();
      updateCount();
      syncStarButtons();
    }
  });

  var STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" stroke-linejoin="round"/></svg>';
  function starButton(key, name) {
    var on = isStarred(key);
    return '<button type="button" class="star" data-star="' + esc(key) + '" aria-pressed="' + on + '" aria-label="Want to see: ' + esc(name) + '">' +
      STAR_SVG + '<span>' + (on ? "On my shortlist" : "Want to see") + "</span></button>";
  }
  function syncStarButtons() {
    var btns = document.querySelectorAll("[data-star]");
    for (var i = 0; i < btns.length; i++) {
      var on = isStarred(btns[i].getAttribute("data-star"));
      btns[i].setAttribute("aria-pressed", on);
      btns[i].querySelector("span").textContent = on ? "On my shortlist" : "Want to see";
    }
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-star]");
    if (!btn) return;
    toggleStar(btn.getAttribute("data-star"));
    syncStarButtons();
  });

  /* ---------- images ---------- */
  function img(opts) {
    // opts: src, small, alt, sizes, eager, label
    var src = safeUrl(opts.src);
    if (!src) {
      return '<div class="img-frame img-frame--placeholder ' + (opts.cls || "") + '" role="img" aria-label="' + esc(opts.alt || "Image coming soon") + '"><span>' + esc(opts.label || "Photo coming soon") + "</span></div>";
    }
    var small = safeUrl(opts.small);
    var srcset = small ? ' srcset="' + esc(small) + " 800w, " + esc(src) + ' 1600w" sizes="' + esc(opts.sizes || "100vw") + '"' : "";
    var loading = opts.eager ? ' fetchpriority="high"' : ' loading="lazy"';
    if (opts.defer) {
      // gallery photos further along: real URLs are swapped in when the reader gets close
      srcset = srcset.replace(" srcset=", " data-srcset=");
      return '<div class="img-frame ' + (opts.cls || "") + '"><img data-src="' + esc(src) + '"' + srcset +
        ' alt="' + esc(opts.alt || "") + '" decoding="async" loading="lazy" data-label="' + esc(opts.label || "") + '"' +
        (opts.focus && /^[\d.]+% [\d.]+%$/.test(opts.focus) ? ' style="object-position:' + opts.focus + '"' : "") + "></div>";
    }
    return '<div class="img-frame ' + (opts.cls || "") + '"><img src="' + esc(src) + '"' + srcset +
      ' alt="' + esc(opts.alt || "") + '" decoding="async"' + loading +
      (opts.focus && /^[\d.]+% [\d.]+%$/.test(opts.focus) ? ' style="object-position:' + opts.focus + '"' : "") + ' data-label="' + esc(opts.label || "") + '"></div>';
  }
  // Swap any image that fails to load for a placeholder.
  document.addEventListener("error", function (e) {
    var el = e.target;
    if (!el || el.tagName !== "IMG" || !el.parentNode || el.hasAttribute("data-src")) return;
    var frame = el.parentNode;
    frame.classList.add("img-frame--placeholder");
    frame.setAttribute("role", "img");
    frame.setAttribute("aria-label", el.getAttribute("alt") || "Image unavailable");
    frame.innerHTML = "<span>" + esc(el.getAttribute("data-label") || "Photo coming soon") + "</span>";
  }, true);

  function credit(c, prefix) {
    if (!c || !c.photographer) return '<span class="credit">' + (prefix || "") + "Photo: placeholder</span>";
    var who = esc(c.photographer);
    var src = safeUrl(c.sourceUrl);
    if (src) who = '<a href="' + esc(src) + '" rel="noopener">' + who + "</a>";
    var lic = esc(c.license || "");
    var licUrl = safeUrl(c.licenseUrl);
    if (lic && licUrl) lic = '<a href="' + esc(licUrl) + '" rel="license noopener">' + lic + "</a>";
    var via = c.via ? " via " + esc(c.via) : "";
    return '<span class="credit">' + (prefix || "") + "Photo: " + who + (lic ? ", " + lic : "") + via + "</span>";
  }

  /* ---------- reveal on scroll (only when motion is welcome) ---------- */
  var motionOK = window.matchMedia && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  function observeReveals(root) {
    if (!motionOK || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    var els = root.querySelectorAll("[data-reveal]");
    for (var i = 0; i < els.length; i++) { els[i].classList.add("reveal"); io.observe(els[i]); }
  }

  /* ---------- data ---------- */
  function load() {
    return fetch(DATA_URL, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function showError(err) {
    main.innerHTML = '<div class="notice"><h1>Couldn’t load the guide</h1><p>The page reads its content from <code>data/places.json</code>. ' +
      "If you opened this file directly from disk, serve the folder with a local web server instead (see the README).</p>" +
      "<p><small>" + esc(err && err.message) + "</small></p></div>";
  }

  /* ==========================================================================
     HOME
     ========================================================================== */
  function renderHome(data) {
    var regions = REGION_ORDER.filter(function (k) { return data.regions[k]; });
    var strips = regions.map(function (k) {
      var r = data.regions[k];
      return img({ src: r.heroImage, small: r.heroImageSmall, alt: r.heroAlt, sizes: "(min-width: 48em) 34vw, 60vw", eager: true, label: r.name });
    }).join("");
    var credits = regions.map(function (k) {
      var r = data.regions[k], c = r.heroCredit || {};
      return esc(r.name) + ": " + (c.photographer ? (safeUrl(c.sourceUrl) ? '<a href="' + esc(c.sourceUrl) + '" rel="noopener">' + esc(c.photographer) + "</a>" : esc(c.photographer)) + (c.license ? " (" + esc(c.license) + ")" : "") : "placeholder");
    }).join(" · ");

    var site = data.site || {};
    var html = '<section class="cover" aria-labelledby="cover-title">' +
      '<div class="cover__strips">' + strips + "</div>" +
      '<div class="cover__text">' +
      '<p class="cover__eyebrow">' + esc(site.eyebrow || "A travel guide") + "</p>" +
      '<h1 id="cover-title">Portugal: <em>Three Ways In</em></h1>' +
      '<p class="cover__dek">' + esc(site.dek || "") + "</p>" +
      "</div>" +
      '<p class="cover__credit">Photos — ' + credits + "</p>" +
      "</section>";

    if (site.intro) html += '<div class="home-intro" data-reveal><p>' + esc(site.intro) + "</p></div>";

    regions.forEach(function (k, i) {
      var r = data.regions[k];
      var counts = CATEGORIES.map(function (c) {
        var n = (r.spots || []).filter(function (s) { return s.category === c.key; }).length;
        return n ? "<li>" + n + " " + esc(c.label) + "</li>" : "";
      }).join("");
      html += '<section class="region-panel region-panel--' + esc(k) + (i % 2 ? " region-panel--flip" : "") + '" aria-labelledby="panel-' + esc(k) + '">' +
        '<figure class="region-panel__media" style="margin:0">' +
        img({ src: r.heroImage, small: r.heroImageSmall, alt: r.heroAlt, sizes: "(min-width: 56em) 56vw, 100vw", label: r.name }) +
        "</figure>" +
        '<div class="region-panel__body" data-reveal>' +
        '<span class="region-panel__num" aria-hidden="true">' + ROMAN[i] + "</span>" +
        '<h2 id="panel-' + esc(k) + '">' + esc(r.name) + "</h2>" +
        '<p class="region-panel__tagline">' + esc(r.tagline) + "</p>" +
        '<p class="region-panel__excerpt">' + esc(r.teaser || (r.intro && r.intro[0]) || "") + "</p>" +
        '<ul class="region-panel__stats" aria-label="Spots in this guide">' + counts + "</ul>" +
        '<a class="region-panel__cta" href="' + esc(k) + '.html">Explore ' + esc(r.name.replace(/^The /, "the ")) + ' <span aria-hidden="true">→</span></a>' +
        "</div>" +
        '<div class="region-panel__band" aria-hidden="true"></div>' +
        "</section>";
    });

    main.innerHTML = html;
    observeReveals(main);
  }

  /* ==========================================================================
     REGION
     ========================================================================== */
  function spotHTML(regionKey, s, flip, feature) {
    var key = regionKey + ":" + s.id;
    var cls = "spot" + (flip ? " spot--flip" : "") + (feature ? " spot--feature" : "");
    var sizes = feature ? "100vw" : "(min-width: 64em) 44rem, (min-width: 48em) 54vw, 100vw";
    var meta = "";
    if (s.effort) {
      var moderate = /moderate|steep|strenuous/i.test(s.effort);
      meta += '<li class="effort' + (moderate ? " effort--moderate" : "") + '"><span>Effort</span> <strong>' + esc(s.effort) + "</strong></li>";
    }
    if (s.bestTime) meta += "<li><span>Best time</span> <strong>" + esc(s.bestTime) + "</strong></li>";
    var tags = (s.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
    var links = "";
    if (safeUrl(s.mapUrl)) links += '<a class="link-out" href="' + esc(s.mapUrl) + '" target="_blank" rel="noopener">Open in Maps<span class="visually-hidden"> (opens in a new tab)</span></a>';
    if (safeUrl(s.websiteUrl)) links += '<a class="link-out" href="' + esc(s.websiteUrl) + '" target="_blank" rel="noopener">Official site<span class="visually-hidden"> (opens in a new tab)</span></a>';

    return '<article class="' + cls + '" id="' + esc(s.id) + '" data-category="' + esc(s.category) + '" aria-labelledby="h-' + esc(s.id) + '">' +
      '<figure class="spot__figure" data-reveal style="margin-block:0">' +
      galleryHTML(s, sizes) +
      "</figure>" +
      '<div class="spot__body" data-reveal>' +
      '<p class="kicker spot__area">' + esc(s.area) + "</p>" +
      '<h3 id="h-' + esc(s.id) + '">' + esc(s.name) + "</h3>" +
      '<p class="spot__blurb">' + esc(s.blurb) + "</p>" +
      (s.insiderTip ? '<p class="tip"><b>Insider tip</b>' + esc(s.insiderTip) + "</p>" : "") +
      (meta ? '<ul class="spot__meta">' + meta + "</ul>" : "") +
      (tags ? '<p class="spot__tags"><span class="visually-hidden">Tags: </span>' + tags + "</p>" : "") +
      '<div class="spot__actions">' + starButton(key, s.name) + links + "</div>" +
      "</div>" +
      "</article>";
  }

  /* ---------- photo gallery (swipeable carousel) ---------- */
  function gallerySlides(s) {
    var slides = [{ image: s.image, imageSmall: s.imageSmall, alt: s.imageAlt || s.name, credit: s.imageCredit, focus: s.imageFocus }];
    (s.gallery || []).forEach(function (g) {
      if (g && safeUrl(g.image)) slides.push({ image: g.image, imageSmall: g.imageSmall, alt: g.alt || s.name, credit: g.credit, focus: g.focus });
    });
    return slides;
  }
  function galleryHTML(s, sizes) {
    var slides = gallerySlides(s);
    if (slides.length < 2) {
      return img({ src: s.image, small: s.imageSmall, alt: s.imageAlt || s.name, sizes: sizes, label: s.name, focus: s.imageFocus }) +
        "<figcaption>" + credit(s.imageCredit) + "</figcaption>";
    }
    var n = slides.length;
    var items = slides.map(function (sl, i) {
      return '<li class="gallery__slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " of " + n + '">' +
        img({ src: sl.image, small: sl.imageSmall, alt: sl.alt, sizes: sizes, label: s.name, focus: sl.focus, defer: i > 0 }) + "</li>";
    }).join("");
    var dots = slides.map(function (sl, i) {
      return '<span class="gallery__dot' + (i === 0 ? " is-active" : "") + '"></span>';
    }).join("");
    var credits = slides.map(function (sl, i) {
      return '<span class="gallery__credit"' + (i === 0 ? "" : " hidden") + ">" + credit(sl.credit) + "</span>";
    }).join("");
    return '<div class="gallery" data-gallery role="region" aria-roledescription="carousel" aria-label="Photos of ' + esc(s.name) + '">' +
      '<ul class="gallery__track" tabindex="0" aria-label="' + n + ' photos of ' + esc(s.name) + '. Swipe or use the arrow keys.">' + items + "</ul>" +
      '<p class="gallery__count" aria-hidden="true"><span data-current>1</span> / ' + n + "</p>" +
      '<button type="button" class="gallery__nav gallery__nav--prev" data-dir="-1" aria-label="Previous photo of ' + esc(s.name) + '" disabled>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="gallery__nav gallery__nav--next" data-dir="1" aria-label="Next photo of ' + esc(s.name) + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg></button>' +
      "</div>" +
      '<figcaption class="gallery__caption"><span class="gallery__dots" aria-hidden="true">' + dots + "</span>" + credits + "</figcaption>";
  }
  function setupGalleries(root) {
    var galleries = root.querySelectorAll("[data-gallery]");
    for (var g = 0; g < galleries.length; g++) initGallery(galleries[g]);
  }
  function initGallery(el) {
    var track = el.querySelector(".gallery__track");
    var slides = track.children;
    var n = slides.length;
    var prev = el.querySelector(".gallery__nav--prev");
    var next = el.querySelector(".gallery__nav--next");
    var counter = el.querySelector("[data-current]");
    var fig = el.parentNode;
    var dots = fig.querySelectorAll(".gallery__dot");
    var credits = fig.querySelectorAll(".gallery__credit");
    var current = 0, ticking = false;
    function index() { return Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))); }
    function update() {
      ticking = false;
      var i = index();
      if (i === current && counter.textContent === String(i + 1)) return;
      current = i;
      counter.textContent = i + 1;
      prev.disabled = i === 0;
      next.disabled = i === n - 1;
      for (var d = 0; d < dots.length; d++) dots[d].classList.toggle("is-active", d === i);
      for (var c = 0; c < credits.length; c++) credits[c].hidden = c !== i;
      for (var s = 0; s < n; s++) slides[s].setAttribute("aria-hidden", s === i ? "false" : "true");
      wake(i); wake(i + 1);
    }
    function wake(i) {
      if (i < 0 || i >= n) return;
      var im = slides[i].querySelector("img[data-src]");
      if (!im) return;
      if (im.getAttribute("data-srcset")) { im.setAttribute("srcset", im.getAttribute("data-srcset")); im.removeAttribute("data-srcset"); }
      im.loading = "eager";
      im.src = im.getAttribute("data-src"); im.removeAttribute("data-src");
    }
    function go(i) {
      i = Math.max(0, Math.min(n - 1, i));
      wake(i); wake(i + 1);
      track.scrollTo({ left: i * track.clientWidth, behavior: motionOK ? "smooth" : "auto" });
    }
    track.addEventListener("pointerdown", function () { wake(current + 1); }, { passive: true });
    track.addEventListener("touchstart", function () { wake(current + 1); }, { passive: true });
    track.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    prev.addEventListener("click", function () { go(current - 1); });
    next.addEventListener("click", function () { go(current + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
      else if (e.key === "Home") { e.preventDefault(); go(0); }
      else if (e.key === "End") { e.preventDefault(); go(n - 1); }
    });
    // fetch the next photo as soon as the reader shows interest (hover, touch, focus)
    el.addEventListener("pointerenter", function () { wake(current + 1); });
    el.addEventListener("focusin", function () { wake(current + 1); });
    for (var s = 1; s < n; s++) slides[s].setAttribute("aria-hidden", "true");
    // keep the current slide aligned after a resize / rotation
    window.addEventListener("resize", function () { track.scrollLeft = current * track.clientWidth; });
  }

  function interludeHTML(it) {
    return '<figure class="interlude" data-interlude>' +
      img({ src: it.image, small: it.imageSmall, alt: it.alt, sizes: "100vw", label: it.caption }) +
      '<figcaption><p class="caption">' + esc(it.caption) + "</p>" + credit(it.credit) + "</figcaption>" +
      "</figure>";
  }

  function renderRegion(data, key) {
    var r = data.regions[key];
    if (!r) { showError(new Error("Unknown region: " + key)); return; }
    document.title = r.name + " — Portugal: Three Ways In";
    var spots = r.spots || [];

    var intro = (r.intro || []).map(function (p, i) {
      var para = "<p>" + esc(p) + "</p>";
      if (i === 0 && r.pullQuote) para += '<blockquote class="pullquote"><p>' + esc(r.pullQuote) + "</p></blockquote>";
      return para;
    }).join("");
    var facts = (r.quickFacts || []).map(function (f) {
      return "<div><dt>" + esc(f.label) + "</dt><dd>" + esc(f.value) + "</dd></div>";
    }).join("");

    var html = '<header class="hero">' +
      img({ src: r.heroImage, small: r.heroImageSmall, alt: r.heroAlt, sizes: "100vw", eager: true, label: r.name }) +
      '<div class="hero__text"><p class="kicker">Portugal · ' + esc(r.kicker || "Region") + "</p>" +
      "<h1>" + esc(r.name) + "</h1>" +
      '<p class="hero__tagline">' + esc(r.tagline) + "</p></div>" +
      '<p class="hero__credit">' + credit(r.heroCredit) + "</p>" +
      "</header>";

    html += '<div class="essay"><div class="essay__body">' + intro + "</div>" +
      (facts ? '<aside class="facts" aria-labelledby="facts-h"><h2 id="facts-h">At a glance</h2><dl>' + facts + "</dl></aside>" : "") +
      "</div>";

    // filter chips
    var chips = '<button type="button" class="chip" data-filter="all" aria-pressed="true">All <span class="chip__count">' + spots.length + "</span></button>";
    CATEGORIES.forEach(function (c) {
      var n = spots.filter(function (s) { return s.category === c.key; }).length;
      if (n) chips += '<button type="button" class="chip" data-filter="' + c.key + '" aria-pressed="false">' + esc(c.label) + ' <span class="chip__count">' + n + "</span></button>";
    });
    html += '<nav class="filters" aria-label="Filter spots by category"><div class="filters__inner">' + chips + "</div></nav>" +
      '<p class="visually-hidden" aria-live="polite" id="filter-status"></p>';

    var interludes = r.interludes || [];
    var sectionIndex = 0;
    CATEGORIES.forEach(function (c) {
      var list = spots.filter(function (s) { return s.category === c.key; });
      if (!list.length) return;
      sectionIndex++;
      var dek = r.categoryIntros && r.categoryIntros[c.key];
      html += '<section class="section" data-section="' + c.key + '" aria-labelledby="sec-' + c.key + '">' +
        '<div class="section__head" data-reveal><p class="kicker">' + ("0" + sectionIndex).slice(-2) + "</p>" +
        '<h2 id="sec-' + c.key + '">' + esc(c.label) + "</h2>" + (dek ? "<p>" + esc(dek) + "</p>" : "") + "</div>";
      var flip = false;
      list.forEach(function (s, i) {
        var feature = s.layout === "feature" || (!s.layout && i % 4 === 3);
        html += spotHTML(key, s, flip, feature);
        if (!feature) flip = !flip;
      });
      html += "</section>";
      interludes.filter(function (it) { return it.after === c.key; }).forEach(function (it) { html += interludeHTML(it); });
    });

    html += '<p class="empty-filter" hidden id="empty-filter">No spots in this category yet.</p>';

    var idx = REGION_ORDER.indexOf(key);
    var nextKey = REGION_ORDER[(idx + 1) % REGION_ORDER.length];
    var next = data.regions[nextKey];
    if (next) {
      html += '<a class="next-region next-region--' + esc(nextKey) + '" href="' + esc(nextKey) + '.html"><div class="next-region__inner">' +
        '<p class="kicker">Next destination</p><strong>' + esc(next.name) + '</strong><span class="arrow">' + esc(next.tagline) + " →</span></div></a>";
    }

    main.innerHTML = html;
    setupFilters(main);
    setupGalleries(main);
    observeReveals(main);

    // honour deep links to a spot (e.g. from the shortlist)
    if (location.hash) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) setTimeout(function () { target.scrollIntoView(); }, 50);
    }
  }

  function setupFilters(root) {
    var chips = root.querySelectorAll("[data-filter]");
    var status = root.querySelector("#filter-status");
    function apply(cat, announce) {
      var shown = 0;
      for (var i = 0; i < chips.length; i++) chips[i].setAttribute("aria-pressed", chips[i].getAttribute("data-filter") === cat);
      var sections = root.querySelectorAll("[data-section]");
      for (var j = 0; j < sections.length; j++) {
        var match = cat === "all" || sections[j].getAttribute("data-section") === cat;
        sections[j].hidden = !match;
        if (match) shown += sections[j].querySelectorAll(".spot").length;
        // reveal-animated items in a section that becomes visible should not stay invisible
        if (match) {
          var rv = sections[j].querySelectorAll(".reveal");
          for (var k = 0; k < rv.length; k++) rv[k].classList.add("is-visible");
        }
      }
      var ints = root.querySelectorAll("[data-interlude]");
      for (var m = 0; m < ints.length; m++) ints[m].hidden = cat !== "all";
      root.querySelector("#empty-filter").hidden = shown > 0;
      if (announce && status) status.textContent = "Showing " + shown + " " + (cat === "all" ? "" : categoryLabel(cat) + " ") + "spot" + (shown === 1 ? "" : "s");
      try {
        var url = new URL(location.href);
        if (cat === "all") url.searchParams.delete("category"); else url.searchParams.set("category", cat);
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (e) { /* ignore */ }
    }
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function () {
        apply(this.getAttribute("data-filter"), true);
        var bar = root.querySelector(".filters");
        var firstVisible = root.querySelector("[data-section]:not([hidden])");
        if (bar && firstVisible && bar.getBoundingClientRect().top <= parseFloat(getComputedStyle(bar).top) + 1) {
          firstVisible.scrollIntoView({ block: "start" });
        }
      });
    }
    var initial = "all";
    try { initial = new URL(location.href).searchParams.get("category") || "all"; } catch (e) { /* ignore */ }
    if (!root.querySelector('[data-filter="' + initial + '"]')) initial = "all";
    if (initial !== "all") apply(initial, false);
  }

  /* ==========================================================================
     SHORTLIST
     ========================================================================== */
  function renderShortlist(data) {
    var target = document.getElementById("shortlist");
    var groups = "";
    var total = 0;
    REGION_ORDER.forEach(function (k) {
      var r = data.regions[k];
      if (!r) return;
      var items = (r.spots || []).filter(function (s) { return isStarred(k + ":" + s.id); });
      if (!items.length) return;
      total += items.length;
      groups += '<section class="shortlist__group shortlist__group--' + esc(k) + '" aria-labelledby="sl-' + esc(k) + '"><h2 id="sl-' + esc(k) + '">' + esc(r.name) + "</h2><ol>" +
        items.map(function (s) {
          var key = k + ":" + s.id;
          return "<li>" + img({ src: s.imageSmall || s.image, alt: s.imageAlt || s.name, label: s.name }) +
            '<div><p class="kicker">' + esc(categoryLabel(s.category)) + " · " + esc(s.area) + "</p>" +
            '<h3><a href="' + esc(k) + ".html#" + esc(s.id) + '">' + esc(s.name) + "</a></h3>" +
            '<div class="shortlist__actions">' +
            (safeUrl(s.mapUrl) ? '<a class="link-out" href="' + esc(s.mapUrl) + '" target="_blank" rel="noopener">Maps<span class="visually-hidden"> for ' + esc(s.name) + " (opens in a new tab)</span></a>" : "") +
            '<button type="button" class="text-button" data-remove="' + esc(key) + '">Remove<span class="visually-hidden"> ' + esc(s.name) + "</span></button>" +
            "</div></div></li>";
        }).join("") + "</ol></section>";
    });

    if (!total) {
      target.innerHTML = '<div class="shortlist-empty"><p>Nothing here yet. Tap <strong>Want to see</strong> on any spot in ' +
        '<a href="lisbon.html">Lisbon</a>, <a href="madeira.html">Madeira</a> or <a href="azores.html">the Azores</a> and it will appear here.</p>' +
        "<p>Your picks are stored only in this browser. Nothing is sent anywhere.</p></div>";
      return;
    }
    target.innerHTML = groups +
      '<p style="margin-top:2rem"><button type="button" class="text-button" data-clear>Clear the whole shortlist</button></p>';
  }

  function setupShortlist(data) {
    renderShortlist(data);
    document.getElementById("shortlist").addEventListener("click", function (e) {
      var rm = e.target.closest("[data-remove]");
      if (rm) { toggleStar(rm.getAttribute("data-remove")); renderShortlist(data); document.getElementById("shortlist-title").focus(); return; }
      if (e.target.closest("[data-clear]") && window.confirm("Remove every spot from your shortlist?")) {
        memoryStore = []; writeStore(memoryStore); updateCount(); renderShortlist(data);
        document.getElementById("shortlist-title").focus();
      }
    });
    window.addEventListener("storage", function (e) { if (e.key === STORE_KEY) renderShortlist(data); });
  }

  /* ---------- boot ---------- */
  updateCount();
  load().then(function (data) {
    if (page === "home") renderHome(data);
    else if (page === "region") renderRegion(data, body.getAttribute("data-region"));
    else if (page === "shortlist") setupShortlist(data);
  }).catch(showError);
})();
