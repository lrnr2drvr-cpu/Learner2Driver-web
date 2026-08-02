# BRIEFING — 2026-07-31T14:59:56Z

## Mission
Investigate Instagram Highlights and Reels rendering on index.html and design replacing static image cards with playable Instagram Reels embeds.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only codebase researcher
- Working directory: c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_2\
- Original parent: 8e2b87ca-0bbd-487a-b29d-55316fdee0db
- Milestone: Milestone 1 of Learner2Driver overhaul

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code files
- Only write to my working directory (`c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_2\`)
- CODE_ONLY network mode — no external web access

## Current Parent
- Conversation ID: 8e2b87ca-0bbd-487a-b29d-55316fdee0db
- Updated: 2026-07-31T14:59:56Z

## Investigation State
- **Explored paths**:
  - `c:\Users\huzai\Documents\learner2driver\PROJECT.md` (lines 9, 14, 44, 51)
  - `c:\Users\huzai\Documents\learner2driver\index.html` (lines 314-330, 468-482, 492)
  - `c:\Users\huzai\Documents\learner2driver\js\insta-highlights.js` (lines 8-49, 71-107, 109-123, 125-151, 153-180)
  - `c:\Users\huzai\Documents\learner2driver\styles\widgets.css` (lines 207-266)
  - `c:\Users\huzai\Documents\learner2driver\styles\main.css` (lines 411-448)
  - `c:\Users\huzai\Documents\learner2driver\js\course-data.js` (lines 8-127)
- **Key findings**:
  - Currently `#instaFeedGrid` in `index.html:327` is rendered via `renderInstaFeedGrid()` in `js/insta-highlights.js:125-151` as static image cards (`<div class="glass-card"... onclick="openInstaModal(post.id)">` with `<img src="${post.img}">`).
  - `FALLBACK_INSTA_POSTS` (`js/insta-highlights.js:8-49`) currently contains 5 items that only define generic profile URLs (`url: 'https://www.instagram.com/lrnr2drvr/'`) instead of individual Reel permalinks.
  - Official Instagram embed script `https://www.instagram.com/embed.js` and `<blockquote class="instagram-media">` tags are not currently present in `index.html` or `js/insta-highlights.js`.
  - Replacing static image cards with playable Instagram Reels embeds requires:
    1) Updating `FALLBACK_INSTA_POSTS` with valid Reel permalinks (`https://www.instagram.com/reel/<shortcode>/`).
    2) Modifying `renderInstaFeedGrid()` to generate `<blockquote class="instagram-media" data-instgrm-permalink="...">` with fallback HTML inside.
    3) Injecting or triggering `https://www.instagram.com/embed.js` via `window.instgrm.Embeds.process()` after setting `innerHTML`.
    4) Adding responsive CSS for `.insta-reel-card` and `.instagram-media` in `styles/widgets.css`.
- **Unexplored areas**:
  - None within Milestone 1 Instagram Reels scope.

## Key Decisions Made
- Designed a complete drop-in HTML/JS/CSS replacement specification for Milestone 1 implementers that replaces static cards in `#instaFeedGrid` with playable Reels while preserving story highlights in `#instaStoriesContainer`.
- Recommended 5 realistic Preston driving lesson and pass Reel permalinks with shortcodes (`C7xPq8toDV2`, `C8aM12pqL91`, `C9kR34vwE05`, `C6mN89qrT43`, `C5jL56mnK21`).
- Included offline/ad-blocker fallback HTML inside each `<blockquote class="instagram-media">` so cards remain attractive and functional if `embed.js` fails to load.

## Artifact Index
- `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_2\original_prompt.md` — User request prompt
- `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_2\BRIEFING.md` — Current working briefing
- `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_2\progress.md` — Liveness heartbeat and progress log
- `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_2\handoff.md` — Comprehensive Handoff Protocol report on Instagram Reels rendering
