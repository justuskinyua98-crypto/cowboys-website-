# Cowboys Group Holdings Website

Website + lightweight Node backend for content management and payments.

## Run locally

```bash
cd "/Users/justusmurerwa/Documents/cwboys website"
npm start
```

Open: `http://127.0.0.1:8000`

Important: do not use `python3 -m http.server` for this project.  
That only serves static files and the API routes (`/api/...`) will fail.

## Environment variables

Copy `.env.example` values into your terminal (or export in shell) before `npm start`.

Minimum required:

- `ADMIN_KEY` for admin-protected routes
- `MANUAL_TILL_NUMBER` for manual M-Pesa guidance
- `MANUAL_PAYEE_NAME` display name for manual payment

M-Pesa STK is enabled only when all `M_PESA_*` values are set.

## Quick API checks

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/content
curl http://127.0.0.1:8000/api/payments/config
```

## Git workflow

```bash
git status
git add .
git commit -m "Describe your change"
git push
```

Remote: `origin` -> `https://github.com/justuskinyua98-crypto/cowboys-website-.git`
