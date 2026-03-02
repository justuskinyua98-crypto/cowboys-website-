# Cowboys Group Holdings Website Guidebook

Author: Justus Kinyua and team  
Project: Cowboys Group Holdings website and lightweight backend  
Purpose: A step-by-step record of how this website was built, how it works, and how to maintain it

---

## 1. Why This Project Exists

This project was built to create one digital home for:
- brand identity
- apparel showcase
- events and ticket flow
- livestock listings
- decor services
- team and social channels
- foundation and partnership communication

It is designed to be simple, editable, and practical for real business use.

---

## 2. Technology Stack

- Frontend: `HTML + CSS + Vanilla JavaScript`
- Backend: `Node.js` with native `http` module (`server.js`)
- Data storage: local JSON files
- Version control: Git + GitHub
- Assets: images/videos in `assets/`

No heavy framework was used. This keeps learning easier and deployment lighter.

---

## 3. Project Structure

```text
cwboys website/
  assets/
    decor/
    events/
    livestock/
    outfits/
    team/
    videos/
    placeholders/
  data/
    content.json
    payments.json
  index.html
  styles.css
  script.js
  server.js
  package.json
  .env.example
  README.md
  robots.txt
  sitemap.xml
```

---

## 4. How To Run The Project

### Private debug mode (only on this Mac)

```bash
cd "/Users/justusmurerwa/Documents/cwboys website"
HOST="127.0.0.1" PORT="8000" ADMIN_KEY="your-admin-key" MANUAL_TILL_NUMBER="5628570" MANUAL_PAYEE_NAME="Cowboys Group Holdings" npm start
```

Open:

```text
http://127.0.0.1:8000
```

### LAN demo mode (same Wi-Fi)

```bash
cd "/Users/justusmurerwa/Documents/cwboys website"
HOST="0.0.0.0" PORT="8000" ADMIN_KEY="your-admin-key" MANUAL_TILL_NUMBER="5628570" MANUAL_PAYEE_NAME="Cowboys Group Holdings" npm start
```

Find local IP and share `http://<IP>:8000`.

---

## 5. Build Timeline (Real Git History)

These commits show how the project evolved:

1. `79b9cc3` - Initial project snapshot
2. `b665131` - Setup docs and `.env.example`
3. `2aba8b7` - Placeholder images mapped by section
4. `f114a18` - Real team photos + better framing
5. `d1fe6e9` - Videos muted by default
6. `daf8fe1` - Media path normalization
7. `4942996` - Media URL loading fix
8. `f4dd312` - Real media mapped across sections
9. `f81b469` - Backend hardening/security/rate limiting
10. `2ff7b86` - UX polish (admin-only controls, toasts, faster loading)
11. `2fd3ec6` - SEO metadata, `robots.txt`, `sitemap.xml`

---

## 6. Data Model

Main content file: `data/content.json`

Major keys:
- `brand`
- `socials`
- `team`
- `videos`
- `outfits`
- `events`
- `livestock`
- `decor`
- `descriptions`
- `partners`
- `reviews`

Payments file: `data/payments.json`
- stores order records and payment status history

---

## 7. Backend Architecture (`server.js`)

Backend responsibilities:
- serve static files
- expose API routes
- store/read data JSON
- run checkout flow (manual + optional M-Pesa)
- confirm manual payments
- issue receipt/ticket payloads
- upload media files

### Important API routes

- `GET /api/health`
- `GET /api/content`
- `PUT /api/content` (admin key required)
- `GET /api/payments/config`
- `POST /api/payments/checkout`
- `GET /api/payments/status?order_id=...`
- `GET /api/payments/receipt?order_id=...`
- `POST /api/payments/confirm-manual` (admin key required)
- `GET /api/payments/orders` (admin key required)
- `POST /api/payments/mpesa/callback`
- `POST /api/media` (admin key required)

### Safety hardening added

- security headers
- payload limit checks
- safe JSON parsing
- IP-based rate limiting for sensitive endpoints
- clearer API 404 behavior

---

## 8. Frontend Architecture (`script.js`, `index.html`, `styles.css`)

Frontend responsibilities:
- fetch and render content from backend
- render all sections dynamically
- handle cart and checkout
- handle admin forms (adding/editing items)
- display payment status
- upload media paths

### UX improvements added

- admin delete buttons hidden unless admin key is present
- toast notifications for loading/success/warnings
- safer image/video URL handling
- videos muted and set to `preload="none"` for faster mobile load

---

## 9. Media Workflow (How Images/Videos Are Added)

Step-by-step:

1. Put files in proper folder under `assets/`:
   - `assets/team`
   - `assets/outfits`
   - `assets/events`
   - `assets/livestock`
   - `assets/decor`
   - `assets/videos`

2. Use clean filenames:
   - good: `aaron-sang.jpg`
   - avoid spaces and symbols in filenames

3. Map file path in `data/content.json`:
   - example: `"photo": "assets/team/aaron-sang.jpg"`

4. Save and refresh page (`Cmd+Shift+R`).

---

## 10. SEO and Discoverability

Implemented:
- stronger title/description
- canonical URL
- Open Graph tags
- Twitter card tags
- Organization JSON-LD schema
- `robots.txt`
- `sitemap.xml`

After deploying to live domain:
1. open Google Search Console
2. add property
3. submit sitemap URL
4. request homepage indexing

Note: ranking #1 is not instant; SEO grows over time with content and backlinks.

---

## 11. Security Rules For Future Maintenance

- Never paste admin keys or tokens in chats or public docs
- Keep `.env` secrets private
- Rotate exposed tokens immediately
- Use HTTPS on production
- Use strong `ADMIN_KEY` in production

---

## 12. How To Continue Building

### Add a new outfit
1. Add image to `assets/outfits/`
2. Add entry in `data/content.json` under `outfits`
3. Refresh page

### Add a new team member
1. Add image to `assets/team/`
2. Add entry under `team` with `name`, `role`, `photo`, `bio`
3. Refresh page

### Add a new video
1. Add file to `assets/videos/`
2. Add entry in `videos` with `src` and `poster`
3. Refresh page

---

## 13. Troubleshooting Cheatsheet

### Problem: API routes return 404
Cause: running static Python server instead of Node backend.  
Fix: run `npm start` (not `python3 -m http.server`).

### Problem: phone cannot access demo
Cause: server bound to localhost only.  
Fix: run with `HOST=0.0.0.0` and check firewall.

### Problem: image not showing
Cause: wrong path or unsupported format.  
Fix: verify file exists under `assets/`, prefer `.jpg/.jpeg/.png/.webp`.

### Problem: port already in use
Fix:

```bash
pkill -f "node server.js" 2>/dev/null
```

---

## 14. Git Workflow Used In This Project

```bash
git status
git add .
git commit -m "Describe change"
git push
```

This project now has a clean commit history and can be restored from GitHub anytime.

---

## 15. Final Message For My Kid

This website was built step by step, not in one day.
The most important skill is not writing perfect code first; it is:
- start
- test
- fix
- improve
- save your work in git
- keep going

Every real software project grows this way.

