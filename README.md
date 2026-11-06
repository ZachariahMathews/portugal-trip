# Portugal: Three Ways In

A magazine-style travel guide to **Lisbon**, **Madeira** and **the Azores**, built as a plain static site for GitHub Pages.

- Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no npm.
- All content lives in [`data/places.json`](data/places.json). Every page renders from it.
- Images are stored locally under `images/<region>/`, and each one carries a photographer, licence and source credit.
- Fonts (Fraunces and Source Sans 3, SIL Open Font License) are self-hosted in `fonts/`.
- No analytics, cookies or trackers. The "Want to see" stars are stored only in the visitor's browser (`localStorage`).

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Cover and the three region panels |
| `lisbon.html`, `madeira.html`, `azores.html` | Region features: hero, intro essay, quick facts, filterable spots |
| `shortlist.html` | Starred spots across all regions (local to the browser) |

All URLs are relative, so the site works from a domain root or a project subpath (`https://<user>.github.io/<repo>/`).

## Preview locally

The pages load `data/places.json` with `fetch`, which browsers block for `file://` URLs. Serve the folder instead:

```sh
cd portugal-trip
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Add a spot

1. Put the photo in `images/<region>/` (see **Images** below).
2. Add an object to that region's `spots` array in `data/places.json`.
3. Reload. No code changes are needed.

Each spot opens with its main `image`. If the spot has a `gallery`, the photos become a carousel: swipe on a phone, or use the arrow buttons or the arrow keys. A counter and dots show your position, and the credit line follows the current photo. To add a photo, append an entry to `gallery`.

Spots appear under their category heading in the order they appear in the JSON. Every fourth spot in a category is automatically shown as a full-width "feature". You can force or prevent that with `"layout": "feature"` or `"layout": "standard"`.

## JSON schema

```jsonc
{
  "site": { "title": "…", "eyebrow": "…", "dek": "…", "intro": "…" },
  "regions": {
    "lisbon": {                         // key = page name (lisbon.html) and image folder
      "name": "Lisbon",
      "kicker": "The river city",       // small label above the hero title
      "tagline": "…",
      "teaser": "…",                    // short text on the home-page panel
      "heroImage": "images/lisbon/hero.webp",
      "heroImageSmall": "images/lisbon/hero-800.webp",   // optional, ~800px wide
      "heroAlt": "Describe the photo",
      "heroCredit": { /* same shape as imageCredit */ },
      "intro": ["paragraph 1", "paragraph 2", "paragraph 3"],
      "pullQuote": "…",                 // shown after the first paragraph
      "quickFacts": [ { "label": "Getting there", "value": "…" } ],
      "categoryIntros": { "food-wine": "…", "history-culture": "…", "nature": "…" },
      "interludes": [                   // optional full-width image breaks
        { "image": "…", "imageSmall": "…", "alt": "…", "caption": "…",
          "credit": { /* imageCredit */ }, "after": "history-culture" }
      ],
      "spots": [
        {
          "id": "alfama",               // unique within the region; used as the #anchor
          "name": "Alfama",
          "area": "Alfama",             // neighbourhood, island or town
          "category": "history-culture",// food-wine | history-culture | nature
          "blurb": "60–90 words…",
          "image": "images/lisbon/alfama.webp",
          "imageSmall": "images/lisbon/alfama-800.webp",  // optional
          "imageAlt": "Describe the photo",
          "imageFocus": "50% 80%",      // optional: which part of the photo to keep when cropped (CSS object-position)
          "imageCredit": {
            "photographer": "Name",
            "license": "CC BY-SA 4.0",
            "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
            "sourceUrl": "https://commons.wikimedia.org/wiki/File:…",
            "via": "Wikimedia Commons"
          },
          "gallery": [                  // optional: extra photos shown in a swipeable carousel
            { "image": "images/lisbon/alfama-2.webp", "imageSmall": "images/lisbon/alfama-2-800.webp",
              "alt": "Describe the photo", "credit": { /* imageCredit */ }, "focus": "50% 50%" }
          ],
          "tags": ["fado", "viewpoints"],
          "effort": "easy",             // optional: easy | short stroll | easy to moderate | moderate
          "mapUrl": "https://www.google.com/maps/search/?api=1&query=Alfama%20Lisbon",
          "websiteUrl": "https://…",    // optional
          "bestTime": "…",              // optional
          "insiderTip": "…",            // optional
          "layout": "feature"           // optional: feature | standard
        }
      ]
    }
  }
}
```

An effort value containing "moderate" or "steep" is highlighted as a gentle heads-up.
Build `mapUrl` as `https://www.google.com/maps/search/?api=1&query=` followed by the URL-encoded place name.

## Images

- Use freely licensed photos (Wikimedia Commons, or Unsplash under the Unsplash licence), and download them. Don't hotlink.
- Save a ~1600px-wide main file and, optionally, a ~800px version for phones. WebP at quality 70–80 keeps files around 150–350 KB. JPEG works too. For example:
  ```sh
  # ImageMagick
  convert photo.jpg -resize 1600x -quality 75 images/madeira/fanal.webp
  convert photo.jpg -resize 800x  -quality 72 images/madeira/fanal-800.webp
  ```
- Fill in `imageCredit` with the photographer, licence name, licence URL and the source page. The credit appears under the photo.
- Write a short, literal `imageAlt` describing what is in the picture.
- If `image` is empty or the file is missing, the page shows a coloured placeholder instead.

## Enable GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select your branch (for example `main`) and the **/ (root)** folder, then click **Save**.
4. After a minute the site is live at `https://<user>.github.io/<repo>/`.

The empty `.nojekyll` file tells Pages to serve the files as they are, without Jekyll processing.

## Accessibility and performance notes

- Semantic landmarks, a skip link, visible focus styles, and filter chips and stars built as real buttons with `aria-pressed`.
- Every image has alt text. Only hero images load eagerly; the rest use `loading="lazy"` and responsive `srcset`.
- Scroll reveal effects and smooth scrolling are turned off for visitors who prefer reduced motion.

## Credits

Photo credits sit beneath each image and are stored in `data/places.json`. Font licences are in `fonts/LICENSE.txt`.
Opening hours, prices and access rules change often, so check official sources before visiting. Open questions are tracked in [`TODO.md`](TODO.md).
