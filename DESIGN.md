---
# gstack: design-md-format=spec
name: Weekbound
description: A night survey map under fog, in quest-log colours, where only your stretch of road is clear; calm, warm and quiet.
colors:
  background: "#1F1A15"
  surface: "#2A231C"
  surface-hover: "#332B22"
  contour: "#3B3127"
  fog: "#C9BBA3"
  text: "#EFE6D2"
  text-muted: "#A99B85"
  primary: "#E8B53A"
  primary-hover: "#F0C258"
  on-primary: "#1F1A15"
  accent: "#9DB86A"
  locked: "#6E6558"
  success: "#9DB86A"
  warning: "#E39A4C"
  error: "#D9675B"
  info: "#9FB7C4"
  line: "rgba(239, 230, 210, 0.12)"
  line-strong: "rgba(239, 230, 210, 0.28)"
  dawn-background: "#E9DFC9"
  dawn-surface: "#F3ECDC"
  dawn-surface-hover: "#EDE3CF"
  dawn-contour: "#D3C5A8"
  dawn-fog: "#FFF9EC"
  dawn-text: "#2A2119"
  dawn-text-muted: "#6B5B47"
  dawn-primary: "#9A6B0C"
  dawn-primary-hover: "#AD7A12"
  dawn-on-primary: "#FFF9EC"
  dawn-accent: "#557A2C"
  dawn-locked: "#8A7F70"
  dawn-warning: "#9A5A16"
  dawn-error: "#A83A2F"
  dawn-info: "#3A6478"
  dawn-line: "rgba(42, 33, 25, 0.14)"
  dawn-line-strong: "rgba(42, 33, 25, 0.3)"
typography:
  display:
    fontFamily: Grenze Gotisch
    fontWeight: 600
    fontSize: clamp(2.75rem, 6vw, 4.5rem)
    lineHeight: 1.05
    letterSpacing: 0em
  headline:
    fontFamily: Grenze Gotisch
    fontWeight: 600
    fontSize: clamp(2rem, 4vw, 3rem)
    lineHeight: 1.05
  title:
    fontFamily: Grenze Gotisch
    fontWeight: 600
    fontSize: 1.625rem
    lineHeight: 1.15
  body:
    fontFamily: Alegreya Sans
    fontWeight: 400
    fontSize: 1.125rem
    lineHeight: 1.55
  body-strong:
    fontFamily: Alegreya Sans
    fontWeight: 500
    fontSize: 1.125rem
    lineHeight: 1.3
  small:
    fontFamily: Alegreya Sans
    fontWeight: 400
    fontSize: 0.9375rem
    lineHeight: 1.45
  label:
    fontFamily: Alegreya Sans SC
    fontWeight: 500
    fontSize: 0.875rem
    letterSpacing: 0.04em
  mono:
    fontFamily: JetBrains Mono
    fontWeight: 400
    fontSize: 0.875rem
    fontFeature: tnum
rounded:
  none: 0px
  sm: 2px
  cut: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  section: 120px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
    padding: 14px 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.text}"
    borderColor: "{colors.line-strong}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.background}"
    borderColor: "{colors.line-strong}"
    rounded: "{rounded.sm}"
  tick-row:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    rounded: "{rounded.none}"
    minHeight: 76px
  nav-link:
    textColor: "{colors.text-muted}"
---

# Weekbound

## Overview

**Creative North Star:** "The fog lifts." A night survey map drawn in thin contour lines and mostly
covered by fog; only the stretch of road the player stands on is clear. Fog of war is Warcraft's
oldest mechanic, and here it explains the product: everything is hidden except the next three steps.
The colours are the classic quest log (warm brown night, gold for the one action, green for the
road and finished steps), so the site feels like WoW without any Blizzard art.

**Product context:** a website (an addon later) that gives a World of Warcraft retail character one
road, shows its next three steps and opens a new stage at each weekly reset. For returning and
casual players who feel lost in retail. Peers: Raider.IO, Wago, ResetReady, the big chore-list
addons. All of them are dark, gold and dense; Weekbound is the quiet one.

**The one thing to remember (the owner, 2026-10-18):** "I know what to do now." A lost player
opens the site and sees their next three steps within ten seconds.

**Mode per surface:**
- Home (landing): Persuade. Name the problem, show the answer, one action.
- My road: Operate. Tick, skip, see when the next stage opens.
- Gallery and road pages: Read.
- Editor and the paste box: Operate.

**Reference sites (screenshots taken 2026-10-18):** raider.io, wago.io, reset-ready.com,
worldofwarcraft.blizzard.com (wowhead.com blocked the headless browser).

**Key characteristics:**
- One road on the screen, three steps, nothing else.
- The map and the fog are the only decoration.
- One gold action per screen, and gold marks "your step now".
- Names (roads, stages, headings) in a gothic display face; everything else in a calm humanist sans.
- One authored moment of motion; everything else is still.

## Colors

**Strategy:** restrained. Warm brown neutrals carry the page; gold is the only action colour and
also marks the current step; green is the road and every finished step. Gold appears at most once
or twice per screen, so it always means "this one".

**Light or dark:** dark ("dusk") by default, from the use scene: players open the site in the
evening, next to the game client, about once a week at the reset. A light "dawn" theme (parchment)
exists for daytime and follows the same roles; it is chosen by the player's system setting and a
toggle.

- `background` is the page; `surface` lifts rows and panels one step; `surface-hover` is the hover
  and pressed tint. Hierarchy comes from these steps and 1px `line` borders, not from shadows.
- `contour` draws the map lines and the signpost; `fog` is the fog and the faint chore labels.
- `primary` (gold) is the one action button and the current step's stone and box. `on-primary`
  is the text on it.
- `accent` (green) is the road line and done ticks; `success` shares it.
- `locked` is a stage that has not opened yet.
- `warning`, `error` and `info` tint messages as a background mix (about 15% over `surface`),
  never as a coloured edge.
- The dawn tokens (`dawn-*`) keep each role; gold darkens to `#9A6B0C` and green to `#557A2C` so
  both still pass contrast on parchment.

## Typography

- **Display: Grenze Gotisch 600** (Google Fonts, OFL). A gothic face with a calm serif rhythm, so
  it reads "fantasy MMO" at a glance without copying Blizzard's own fonts (Friz Quadrata, Morpheus,
  Lifecraft, which we never use). It is used only for names and headings: the hero line, section
  headings, road names, stage names, the camp line. Never for body text, buttons or numbers.
- **Text and UI: Alegreya Sans 400, 500 and 700**. A humanist sans with a pen-drawn feel, calm and
  easy to read at night. Step labels use 500. Numbers use `lining-nums tabular-nums`.
- **Small labels: Alegreya Sans SC 500** at 0.04em tracking, for short tags like "Now",
  "Later" or "Weekly pace". Never above a heading.
- **Codes: JetBrains Mono 400** for road codes and backup codes only.
- **Loading:** one Google Fonts request with `display=swap` in the prototype; in the app, load the
  same families through `next/font/google` (self-hosted at build, no runtime call to Google).
- **Scale:** display 2.75 to 5.25rem, an app page's title 2.5 to 3.5rem, headline 2 to 3rem, title
  1.625 to 2rem, body 1.125rem (1.25rem for a page's lead text and step labels), small 1rem.
  Levels differ by more than weight.
- **Alternative tried:** Marcellus 400 (calmer, more generic). Kept as the fallback if Grenze
  Gotisch ever reads too heavy at small sizes.

## Layout

- **Max width** 1280px with a 24px gutter (16px under 480px).
- **Header:** sticky at the top. Once the page scrolls it settles into a compact bar (12px instead
  of 22px above and below, the name at 1.625rem) on the page colour with a 1px `line` under it, and
  the mark's diamond fills green; 200ms, instant with reduced motion. Columns that stick sit below
  it (96px from the top).
- **Home:** left-aligned throughout. The hero is text on the left and the road with its three
  stones on the right; under 860px the road moves below the text, and under 480px its three steps
  become a short list under the drawing. Sections alternate a narrow text column (up to 440px) with
  the thing itself (recap, signpost, code box) on the right.
- **App pages:** the full width, in two columns from 1024px; rows, not cards. My road and the
  editor keep the work in the main column (the road, the stages being built) and put what goes
  with it in a side column of 360 to 400px (your roads, another road, the backup; the code). The
  gallery and road pages put the words on the left (up to 420px) and the thing itself on the
  right (the signpost, the stages), as the home page's sections do. A side column that helps
  while the other one scrolls (the road page's actions, the editor's code) stays in view. Under
  1024px the columns stack, main first. Long text keeps a readable measure inside its column.
- **Rhythm:** sections 120px apart (80px on mobile); inside a section, 24 to 32px between blocks and
  8px between rows.
- **No horizontal scroll** at any width; long codes truncate with an ellipsis and a Copy button.

## Elevation & Depth

No shadows. Depth is a surface step (`background` to `surface` to `surface-hover`) plus a 1px
line. The fog is the one translucent layer, and it explains depth (things beyond your road are
hidden), so it is the only blur on the site.

## Shapes

- Square by default; inputs and secondary buttons have a 2px radius.
- The primary button has two cut corners (top left and bottom right, 8px), like map signage. It is
  drawn with background gradients, not `clip-path`, so the focus outline still shows.
- Road stones are diamonds (squares rotated 45 degrees): gold for the current step, green outline
  for steps ahead, solid green for done, `locked` for stages not open.
- The roads list is a signpost: arrow-shaped arms on one post, alternating left and right.

## Components

- **Primary button:** gold, dark text, 700 weight, label names the outcome ("Show my next three
  steps", "Start this road"). Hover lightens to `primary-hover`; active moves down 1px;
  focus-visible has a 2px `text` outline at 3px offset; disabled uses `surface-hover` and muted
  text. One per screen.
- **Secondary button:** 1px `line-strong` border, transparent; hover fills `surface`.
- **Text link:** underlined at 4px offset with a faint underline that turns solid on hover.
- **Tick row:** the whole row is the tap target (at least 76px tall), with a 28px box (24px on a
  phone), the step label in 500 at 1.25rem, and progress text under it in muted 1.0625rem
  ("1,240 of 1,500"). The current step's
  box has a gold border. Done: the box fills green with a check, the label goes muted and the
  progress text ends in "· done". Skip is a quiet text action at the row's end; a skipped row fades
  to 55% and offers Undo. ARIA: `role="checkbox"` with `aria-checked`.
- **Stage strip:** diamonds joined by short lines, done in green, current in gold, the rest `locked`.
- **Camp:** shown when all steps of a stage are done or skipped: a tent mark, "Make camp." in
  display, "The road opens Wednesday morning, at the EU reset." and, in small text, the exact local
  time. No countdown timer.
- **Weekly recap:** on the first visit after a reset, one sentence of what the player did, with the
  things in green. It never lists what was missed. Dismissable.
- **Code box:** mono code, ellipsis, a Copy button that says "Copied" for 1.4s.
- **Inputs:** `background` fill, 1px `line-strong` border, green border on focus, `error` border and
  a plain sentence under it when invalid ("That isn't a road code. Road codes start with SR1!").
- **Messages:** an icon and a sentence on a tinted background (success, warning, error, info).
- **States every page designs:** empty ("No road yet." with a way forward), loading (the stage strip
  and rows as quiet `surface` blocks, no spinner), error (a plain sentence and what to do), camp,
  a newer code than the page knows, and long content (labels wrap, codes truncate).

## Do's and Don'ts

- Do show the player's next three steps on the first screen of the home page.
- Do keep gold to one action and the current step per screen.
- Do write numbers inside sentences and rows ("Win 10 rated 2v2 games, 6 of 10"), never in tables
  or leaderboards.
- Do say "Fan tool. Not affiliated with Blizzard Entertainment." in the footer of every page.
- Do respect `prefers-reduced-motion`: the authored moment becomes an instant cut.
- Don't use Blizzard logos, game art, icons, screenshots or Blizzard's fonts.
- Don't add ads, a chore list, a daily task list, a countdown timer or a list of missed things.
- Don't use cards inside cards, three-column feature grids, kickers above headings or glow.
- Don't use gold for decoration, headings or borders; it means "do this".
- Don't animate anything except the one moment and small state changes (tick, camp appearing).

## Motion

- **Approach:** intentional, with one authored moment.
- **Easing:** enter ease-out, exit ease-in, move ease-in-out.
- **Duration:** micro 100 to 150ms (tick, hover), short 200 to 250ms, medium 350 to 450ms, the
  moment about 1.4s in total.
- **The one authored moment ("the fog lifts"):** on the home page, in a pinned scene under the
  hero, about fifty chore labels drift faintly in the fog behind "Retail is loud." When the player
  scrolls on, it plays: the labels sink into the fog (staggered over about 0.4s), the fog pulls
  back to the right, "Walk one road." appears, and the road draws itself down through three stones
  next to three steps. Scrolling back up plays it in reverse: the steps leave first, then the fog
  and the chores return. With reduced motion it is an instant swap both ways.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-18 | Initial design system created | /design-consultation from the box 3 design doc (Amendment 1, web first), research screenshots of Raider.IO, Wago, ResetReady and Blizzard's site, and the owner's pick "I know what to do now" |
| 2026-10-18 | Direction "The fog lifts" | Proposed by an independent design agent and taken over my parchment draft: fog of war is the product (only the next three steps visible) |
| 2026-10-18 | Quest log palette | The owner chose it over Pine dusk and Northrend after seeing all three in the preview |
| 2026-10-18 | Display face Grenze Gotisch | The owner chose it over Marcellus after seeing both in the preview |
| 2026-10-18 | Defaults set by Claude, not reviewed one by one | The spacing scale (4 to 120px), 64px tick rows, the motion timings, the 2px radius, the 680px app column and the message tint strength; change freely |
| 2026-10-18 | Wider pages, larger type | The owner found the 680px column too small ("we have so much space, but we dont use and our content is tiny"): 1280px pages, two columns from 1024px, larger titles, labels and tick rows |
| 2026-10-18 | The landing, the map and the fog built from the approved preview | The owner asked for the look of the preview ("i dont see your fancy fog"): the contour map behind every page, fog in the hero, the scene and the road ahead, the hero road, the moment, the recap and codes sections, and fog over the steps still ahead on My road. Two chores swapped for Midnight's (Prey hunts, Special assignments) |
| 2026-10-18 | The moment plays both ways | The owner expected the fog to come back when scrolling up ("there is no animation when i scroll up"); it was once only |
| 2026-10-18 | Named Weekbound | The owner picked it over the working name Slow Road, which a viral driving game (Slow Roads) owns in search; one stage per weekly reset, an echo of WoW's "Warbound". The approved preview (`docs/design/preview.html`) keeps the old name as the record of what was approved |
| 2026-10-18 | Sticky header | The owner asked for a header that stays at the top "with some animation when it became fixed": it settles into a compact bar and the diamond fills green (a small state change, no shadow or blur) |
| 2026-10-18 | Camp instead of a countdown | From the design agent; the slow pace shown as rest, with the exact time in small text |
