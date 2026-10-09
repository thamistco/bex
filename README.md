# Family Activities – Bexhill

A one-page guide to baby and toddler activities around Bexhill-on-Sea, updated
each night. Served by GitHub Pages from `main` at
<https://thamistco.github.io/bex/>. It is unlisted (`noindex`), not private:
anyone with the address can open it, and this repository is public.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole page: styles, script and the activity data. |
| `manifest.json` | What Chrome reads to install the page as an app. |
| `service-worker.js` | Saves the page on the first visit. Online, every launch fetches the latest page; with no signal, a weak one (no answer in 4 seconds) or a server error, it opens the last saved copy. |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | App icons. |
| `images/` | Photos (16:9 WebP, at most 800 px wide) and the 156 px logo. |
| `logo.webp` | The full-size logo artwork. The page does not load it. |

## Rules that keep "Install app" working

1. `index.html` links the manifest as a file:
   `<link rel="manifest" href="manifest.json">`. Never inline it as a `data:`
   URL. Chrome resolves the manifest's addresses against the manifest's own
   address, so a `data:` manifest loses its start page and every icon, and
   Chrome will not install the app.
2. **Do not rename the repository again.** Every installed copy keeps the
   address it was installed from, and GitHub does not redirect a renamed
   project's Pages address, so a rename turns the app into a 404 on every phone
   that has it. That is what happened on 9 October 2026, when the repository
   became `bex`. If the name must change, use a custom domain first.
3. Keep `start_url` and `scope` in `manifest.json` as `"./"`. They are resolved
   against `manifest.json`, so the manifest is right wherever the site is served
   and a fresh install works. They cannot rescue copies already installed.
4. Keep the manifest's `id` as `"family-activities-bexhill"`. Chrome uses it to
   recognise the installed app; a new id makes the next install a separate app.
   Never use `"./"` or `"/"`: an id resolves against the site's origin, so those
   mean `https://thamistco.github.io/`, which every thamistco Pages site shares.
5. Keep the service worker registration in `index.html`, next to the install
   code.
6. Photos go in `images/` as files, not base64 inside the page. Inline, every
   photo downloaded on every launch.

## If the installed app shows a 404

A home-screen icon created before the repository was renamed still points at
the old address, and that address no longer exists. Remove the icon and install
again from <https://thamistco.github.io/bex/>.

## The nightly update

The update must start from the current `index.html` in this repository. If it
rebuilds the page from an older copy of its own, it will put back the `data:`
manifest and the base64 photos and break installing again.
