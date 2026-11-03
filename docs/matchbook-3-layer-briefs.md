# Realistic matchbooks: three layers per venue (Version C)

Each matchbook on the site is built from **three separate images** stacked on top of each other, so the cover can swing open like a real one:

1. **Cover**: the front of the matchbook, with the venue's real logo. This is the part that swings up.
2. **Paper**: a blank paper insert that sits in front of the matches. The site prints Sydney's role and description on it.
3. **Inside**: the open interior: card stock, a row of paper matches, the striker strip and staple.

Make all three for each venue below. The same three-image set is also used for the small matchbooks in the jar on the About page.

---

## How to get the real logos into ChatGPT

ChatGPT can put a real logo on the cover if you **upload the logo image with your message**. It shouldn't invent one.
1. Go to the venue's website (links below), right-click the logo and save it. A PNG or SVG with a transparent background is best. If a site only shows the logo small, a screenshot works.
2. In ChatGPT, attach the logo file to the cover prompt and say *"use this exact logo, reproduced faithfully, printed on the cover."*
3. If ChatGPT distorts the logo, ask for the cover **without** a logo ("leave the printed area blank") and send it to Claude. The real logo can then be placed on the cover precisely in code, so it's always crisp and correct.

---

## Exact sizes (so the three layers line up)

All three images for a venue are **the same canvas: 1000 × 1333 px, transparent PNG** (portrait, 3:4).

| Layer | What fills the canvas |
|---|---|
| **Inside** | The whole canvas: the open matchbook interior, edge to edge. The **striker strip** runs along the **bottom 10%** (y 1200–1333). |
| **Cover** | The **top 90%** only (y 0–1200): the front of the cover, straight on, its bottom edge at y 1200. The bottom 10% stays transparent. |
| **Paper** | A paper card centered at x 70–930, y 90–1150, slightly smaller than the cover so it hides behind it. Everything else is transparent. |

---

## 1. Style bible (paste first, in a new ChatGPT chat)

> You are a commercial product photographer shooting vintage-style paper matchbooks for a theatre production manager's portfolio website. Every image must look like a **real photograph of real paper**, all from the **same shoot**:
> - Camera: straight-on, perfectly frontal (no perspective, no tilt), 100mm lens, f/8.
> - Light: one soft key light from the upper left at 45°, gentle and even. No hard shadows on the canvas edges.
> - Materials: matte uncoated card stock with real paper fibres, very slightly worn edges and corners, faint print texture. Printing looks offset-printed: flat ink with tiny registration imperfections, not digital.
> - Background: **fully transparent PNG** (no white, no table, no shadow outside the object).
> - Canvas: **1000 × 1333 px**, and follow the exact placement I give for each layer.
> - Never: no illustration or cartoon look, no 3D render sheen, no extra text I didn't ask for, no hands.
> Reply "Ready" and wait.

## 2. The three prompts (repeat for each venue)

**A. Inside** (`mb-[slug]-inside.png`)
> The inside of an open paper matchbook, straight-on, filling the entire 1000×1333 canvas. A comb of 10 flat paper matches stands in a row across the upper part; each match is a flat cream paper strip with a tall oval head in [HEAD COLOUR]. The matches are joined at their base to a cardboard backing in [CARD COLOUR]. Along the bottom 10% of the canvas (y 1200–1333) is the folded striker strip: dark brown sandpaper texture, with one small silver staple in the centre. Real paper texture throughout. Transparent background outside the matchbook.

**B. Paper** (`mb-[slug]-paper.png`)
> A blank, slightly off-white paper insert card, very lightly textured, with a faint fold crease near the top and the tiniest curl at one corner. It sits centered at x 70–930, y 90–1150 on a 1000×1333 transparent canvas. A small, subtle version of the attached logo printed in the top-left corner of the card in [INK COLOUR], about 90px wide. Everything else on the card is blank. No other text. Transparent background.

**C. Cover** (`mb-[slug]-cover.png`), *attach the venue's logo*
> The closed front cover of a vintage paper matchbook, straight-on, filling the top 90% of a 1000×1333 canvas (y 0–1200); the bottom 10% stays fully transparent. Cover card stock in [COVER COLOUR]. Print the attached logo, reproduced faithfully and exactly, centered in the upper two-thirds of the cover, in [LOGO COLOUR]. A thin printed border inset from the edges in [BORDER COLOUR]. Subtle wear on the corners. No other text. Transparent background.

## 3. Venues, colours and where to find each logo

| Venue | Slug | Logo source | Cover | Logo | Border | Match heads | Card (inside) |
|---|---|---|---|---|---|---|---|
| Cherry Lane Theatre | `cherry-lane` | cherrylanetheatre.org | tomato red | cream | cream | tomato red | kraft brown |
| Iron Bloom Creative Production | `iron-bloom` | ironbloomny.com | deep navy | cream | cream | tomato red | navy |
| NBA All-Star | `nba-all-star` | nba.com/allstar | baby blue | navy and red (original logo colours) | navy | tomato red | cream |
| Ars Nova | `ars-nova` | arsnovanyc.com | black | white | white | tomato red | black |
| Spellbound Theatre | `spellbound` | spellboundtheatre.com | deep red | cream | cream | cream | deep red |
| NYC Children's Theater | `nyc-childrens` | nycchildrenstheater.org | mustard yellow | navy | navy | tomato red | cream |
| Lincoln Center | `lincoln-center` | lincolncenter.org | cream | black | black | tomato red | cream |
| Little Island | `little-island` | littleisland.org | kraft brown | cream | cream | tomato red | kraft brown |
| The Public Theater | `public-theater` | publictheater.org | white | black (their logo is black type) | black | tomato red | white |

For each venue, the paper insert's small logo uses the **Logo** colour from the table.

---

## 4. Checklist before you download
- All three images for a venue are **1000 × 1333** and transparent where specified
- The cover's bottom edge sits exactly at y 1200 (the inside's striker strip shows below it)
- The logo matches the real one (same letterforms, spacing and proportions)
- Light from the upper left on every image; real paper texture, not plastic

## 5. Where the files go
Save them into **`/Users/bianca/sydney-prince-site/assets/img/objects/`** named exactly, for example `mb-cherry-lane-cover.png`, `mb-cherry-lane-paper.png`, `mb-cherry-lane-inside.png`. Or just drop them anywhere in the project folder and tell Claude. They'll be converted and wired in, and the site switches to them automatically.
