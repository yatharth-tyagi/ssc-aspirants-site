# SSC Aspirants Official – Website

Mock tests (Eduquity pattern), notes and PYQ papers for SSC exams.
Instagram: https://www.instagram.com/sscaspirants_official/

## Files
| File | What it is |
|---|---|
| `index.html` | Home page |
| `mock-tests.html` | Mock Tests page |
| `notes.html` | Notes page |
| `pyq.html` | Previous Year Papers page |
| `note.html` | Notes reader (opens a chapter: note.html?id=preamble) |
| `data/notes.js` | All notes content |
| `assets/protect.js` | Copy protection (no right-click, copy, print; blur on focus loss) |
| `assets/reader.css` / `reader.js` | Notes reader design + watermark |
| `assets/logo.png` | Logo (replace this file to change the logo everywhere) |
| `assets/favicon.png` | Small icon in the browser tab |
| `assets/style.css` | Shared styles |

## How it is hosted
- Code: GitHub repository
- Hosting: Cloudflare Pages (auto-updates when GitHub changes)
- Login + database: Firebase (connected in the next stage)

## Build stages
1. [x] Pages: Home, Mock Tests, Notes, PYQ
2. [x] Notes reader with sscaspirants_official watermark + copy protection
3. [ ] Student login (later, optional)
3. [ ] Admin panel for notes
4. [ ] Test engine (Eduquity screen) + admin for tests
5. [ ] Student dashboard

Tech: plain HTML, CSS and JavaScript. No Python, no build step.
