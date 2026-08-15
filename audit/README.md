# audit/

Automated checks that run against a **built, served** copy of the site.

```bash
npm run build && npm run start &   # serve on :3111
npm run audit:setup                # once per machine — downloads Chromium
npm run audit                      # the whole suite
```

## Why `audit:setup` is separate

The suite talks to a real browser, but the repository depends on
**`playwright-core`**, not `playwright`. They are the same API; the difference is
that `playwright` runs a postinstall that downloads ~150 MB of browser binaries.
As a devDependency that fires on every `npm ci` — including the one Vercel runs
to build the site, which has no use for a browser. So the browser is installed
deliberately, once, by whoever is running audits.

`audit/scripts/browser.mjs` finds a Chromium in this order:

| # | Source | Notes |
|---|---|---|
| 1 | `AUDIT_CHROMIUM` | explicit path, wins over everything |
| 2 | `PLAYWRIGHT_BROWSERS_PATH` | set by CI images that pre-install browsers |
| 3 | system locations | `/usr/bin/chromium`, Chrome on macOS, … |
| 4 | Playwright's own cache | if `npm run audit:setup` has been run |

If none resolves it exits with the command that fixes it, rather than a stack
trace. Already have a browser?

```bash
AUDIT_CHROMIUM=/path/to/chrome npm run audit
```

## The checks

| Script | What it proves |
|---|---|
| `axe-scan` | WCAG 2.1/2.2 A+AA, every route, via axe-core |
| `responsive` | continuous width 320→1920, reflow at 320×256 (1.4.10), 200% text (1.4.4) |
| `overflow` | no horizontal scroll across the device matrix |
| `tap-targets` | WCAG 2.5.8 target size on touch viewports |
| `structure` | one `h1`, landmarks, heading order, table scopes |
| `input-font-size` | inputs ≥16px, so iOS does not zoom on focus |
| `reduced-motion` | nothing animates under `prefers-reduced-motion` |
| `token-contrast` | every design-token colour pair, against its own stated ratio |
| `parse-check` | every source file parses; no stranded `${...}`, no literal `\n` |
| `contrast` | computed contrast of rendered text |
| `payload` | cold transfer per route; proves three.js stays off non-3D routes |
| `viewports` | shared device matrix + route list (imported, not run) |
| `browser` | shared launcher (imported, not run) |

Two more scripts, `lh.mjs` and `lh3.mjs`, need `lighthouse` and
`chrome-launcher`, which are deliberately **not** dependencies: Lighthouse's
simulated throttling is unreliable on shared CI hardware, and a performance
number nobody can reproduce is worse than no number. Install them ad hoc if you
want a local run.

## A note on what these catch

`overflow` swept ten named devices across eleven routes and reported zero for
months. It was correct about all 110 configurations and blind to a 738 px
overflow on every page of the site, because a fixed list of widths only finds
what it lands on, and because horizontal width is not the only axis a layout can
fail on. That is why `responsive` exists, and why it sweeps continuously and
tests text size as well as viewport size.
