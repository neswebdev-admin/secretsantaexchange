# 🎁 Family Gift Exchange

A tiny website that draws names for a family gift exchange and gives you
**one link per family**. Each link shows that family's picks (parents and kids),
with a tap-to-reveal for each person.

It has no server, no database and no logins. Each family's picks are stored
(scrambled) inside their own link.

## Files

| File | What it is |
| --- | --- |
| `config.js` | **Edit this.** Names, families, budget, date, and optional rules. |
| `index.html` | Organizer page. Press **Draw names** and copy each family's link. It never shows who has who, so the organizer can take part too. |
| `view.html` | The page each family sees when they open their link. |
| `shared.js` | Draw logic and link encoding. |
| `style.css` | Looks. |

## Rules

Always enforced:
- Everyone gives exactly one gift and gets exactly one gift. Nobody gets themselves.
- Kids never get their own parent.
- Parents never get their spouse.

Optional (switch on or off in `config.js`):
- `noMutualPairs` (**on** by default): two people never get each other.
- `noParentDrawsOwnChild` (off): parents can't draw their own kids.
- `noSiblings` (off): brothers and sisters can't draw each other.

## Using it

1. Put real names in `config.js` (every name must be unique).
2. Host it (see below) and open `index.html`.
3. Press **Draw names**, then **Copy link** for each family and text or email it to them.
4. Each family page shows a short **draw code**. If everyone's code matches, everyone has links from the same draw.

The organizer page remembers your last draw in that browser, so refreshing won't lose the links.
Drawing again makes new links. Links from an old draw still open but show the old picks.

## Hosting (free) with GitHub Pages

Repo → **Settings → Pages** → Source: *Deploy from a branch* → pick the branch and `/ (root)` → Save.
Your site will be at `https://<your-username>.github.io/secretsantaexchange/`.

To try it on your own computer, open `index.html` in a browser
(or run `python3 -m http.server` in this folder and go to http://localhost:8000).

## How secret is it?

It's secret enough for a family: links can't be read just by looking at them.
It isn't real encryption, though. Someone tech-savvy who got another family's link could decode it.
Only send each link to its own family.
