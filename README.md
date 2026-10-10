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
| `service-worker.js` | Saves the page on the first visit. Online, every launch fetches the latest page. With no signal or a server error it opens the last saved copy; on a weak signal (no answer in 4 seconds) it does so only if that copy is from the last 24 hours. |
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

## The activity data

Each activity is written once, in the `activities` list in `index.html`, and
each dated session once, in `calendarData`. Other parts of the page are built
from those, so they cannot disagree with the cards:

- **Book ahead** lists every activity that has a `bookAhead` sentence, such as
  `bookAhead:'Booking required; no drop-ins.'`. Write only the reason to book
  there. The page adds the days still to come (from `calendarData`), the price,
  and the booking link or a tappable phone number (from the activity's `url`).
  An activity with no sessions left drops out by itself. Do not write items into
  the Book ahead panel by hand; a hand-written copy had already lost a Saturday
  class that the card and the week both showed.
- **Add to calendar** on the week and the cards: give the activity
  `calendar:true`. Each session still to come whose time is a single range
  (`10:00–17:00`) gets a link, with the times from `calendarData` and the place
  from the activity's `where`.
- **Add to calendar** in "Later this month": put the end time and the place on
  the link, `data-calendar-end="14:00" data-calendar-where="…"` (and
  `data-calendar-details="…"` if needed). The start is the item's own
  `<time datetime="2026-10-18T11:00">`. A link without them is removed.
- **Title links** come from each activity's `source:'…'`.
- **A price shown elsewhere** reads from its card:
  `<span data-price-of="Bexhill Museum">…</span>`. Keep the title exact; if it
  stops matching, the written text stays and the browser console says so.
- **Phone numbers** written in the usual form (`01424 212545`, `0345 6080196`)
  become tappable links by themselves; write them as text, not as links.
- **`cat`** is one of `sports`, `hubs`, `music`, `play`, `library`, `events`
  (a second word, as in `'sports play'`, is allowed). Anything else lands in an
  "Other" section and the browser console names it. Before that fallback, one
  `cat:'community'` on 10 Oct blanked the whole page for everyone.

## If the installed app shows a 404

A home-screen icon created before the repository was renamed still points at
the old address, and that address no longer exists. Remove the icon and install
again from <https://thamistco.github.io/bex/>.

## The nightly update

The update must start from the current `index.html` in this repository. If it
rebuilds the page from an older copy of its own, it will put back the `data:`
manifest and the base64 photos and break installing again.
