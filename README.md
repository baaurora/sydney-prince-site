# Sydney Prince — portfolio redesign options

Two design directions for [sydneyhprince.com](https://www.sydneyhprince.com), built as a plain static site (HTML, CSS, vanilla JS, no build step). All copy is carried over verbatim from the live site.

| | Version A: The Matchbook | Version B: Standby / Spotlight |
|---|---|---|
| Idea | The site as a vintage venue matchbook from her collection. Warm, collected, a little nostalgic. | The site as a show about to start. Sydney is the one calling it. |
| Palette | cream `#F6EEDF`, tomato red `#D9442B`, ink `#1F1B18`, striker brown `#8A6A4F` | house black `#141214`, spot gold `#F2C46D`, velvet red `#7A1F2B`, white |
| Loader | Pencil-sketched matchbook draws in, a match strikes, the flame catches, the glow fades into the page | "Standby..." then "Go." then a circle of light opens to reveal the page |
| Signature | Photos as tilted matchbook covers that lift, straighten and spring back; "What's happening" cards whose flaps flip open | A soft spotlight follows the cursor and brightens the dimmed photos it passes |
| Folder / branch | `version-a/` · branch `version-a-matchbook` | `version-b/` · branch `version-b-spotlight` |

Version B's dark palette is a bigger departure from her current light site. If she wants to stay closer to what she has, A is the safer pick.

## Branches

- `main` — both versions plus the side-by-side comparison page at `/index.html`.
- `version-a-matchbook` — the shared scaffold + Version A only.
- `version-b-spotlight` — the shared scaffold + Version B only.

## Layout

```
index.html            comparison page (main only)
version-a/            index, about, resume, contact + matchbook.css/js
version-b/            index, about, resume, contact + spotlight.css/js
shared/site.js        loader-once-per-session, scroll reveal, touch fallbacks, mailto form
shared/base.css       reset, skip link, reduced-motion rules
shared/content.md     verbatim copy reference
assets/img/           photos, re-encoded to WebP (all under 300 KB)
assets/docs/          the three resume PDFs from the live site
```

## Run locally

Any static server works. From the repo root:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 (comparison), http://localhost:8080/version-a/ or http://localhost:8080/version-b/.

The loader plays once per browser tab session. To see it again, open a new tab or run `sessionStorage.clear()` in the console. It is skipped entirely when the OS has "reduce motion" turned on.

## Deploy to GitHub Pages

1. Push to GitHub (already done for `baaurora/sydney-prince-site`).
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.
3. After a minute the site is live at `https://<user>.github.io/sydney-prince-site/`, with each version at `/version-a/` and `/version-b/`.

To preview one direction on its own, point Pages at `version-a-matchbook` or `version-b-spotlight` instead. To use a custom domain, add it under Settings → Pages and point DNS at GitHub (A records to the four GitHub Pages IPs, or a CNAME for `www`).

## Contact form

GitHub Pages has no form backend, so the form opens a pre-filled email to `shprince13@gmail.com`. To collect submissions instead, create a form on a service like Formspree and set the form's `action` attribute to its endpoint (and `method="POST"`). `shared/site.js` leaves the form alone as soon as an `action` is present.

## Porting to Squarespace (code injection)

Squarespace keeps its own page structure, so the simplest path is to keep the existing pages and layer the chosen version's styles and motion on top. Code Injection requires a Business plan or higher.

1. **Host the assets.** Either keep this repo on GitHub Pages and reference the CSS/JS by URL, or paste the file contents directly into Squarespace.
2. **Fonts.** In Settings → Advanced → Code Injection → **Header**, add the Google Fonts `<link>` tags from the top of any page in the version you picked.
3. **Styles.** Paste the version's CSS (`version-a/matchbook.css` or `version-b/spotlight.css`) into **Design → Custom CSS**. Selectors are written for this repo's markup, so expect to retarget some of them to Squarespace classes (`.header`, `.sqs-block-image`, `.gallery-grid-item`, etc.). Palette and type tokens live in `:root` at the top of each file, so those carry over unchanged.
4. **Loader.** Paste the `#loader` markup plus the small inline `<script>` from the page `<head>` into Code Injection → **Header**, and `shared/site.js` + the version's JS into **Footer**. The loader logic is self-contained and only needs `#loader` to exist.
5. **Signature interactions.**
   - A: add the `photo-card` class to image blocks via a Code Block wrapper, or target `.sqs-block-image` in the CSS.
   - B: the spotlight overlay is created by `spotlight.js`. Point its photo selector at Squarespace's image wrappers.
6. **Per-page tweaks** (e.g. the credits fan) go in each page's Settings → Advanced → Page Header Code Injection.

If the port gets fiddly, the alternative is to move the domain to this static site (GitHub Pages, Netlify, Cloudflare Pages) and keep Squarespace only for the domain registration.

## Notes

- Lighthouse targets: performance and accessibility 90+. Images are lazy-loaded with explicit dimensions, fonts use `display=swap`, and no JS framework or animation library is loaded (GSAP wasn't needed).
- Every image has alt text. Hover-only effects have tap/scroll equivalents on touch screens and focus equivalents for keyboard users.
