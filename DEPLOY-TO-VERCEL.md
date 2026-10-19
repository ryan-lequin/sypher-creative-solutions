# Sypher  -  Vercel Deployment Guide

This Vercel edition uses a serverless Node.js API with Supabase for **persistent** site content, inquiries, and admin sessions. Gmail replies open prefilled drafts and are sent manually from Gmail. It is not the same as the older long-running `api/server.js` edition.

## 1. Extract ZIP

Open the `sypher-creative-solutions` folder (not the ZIP itself) in VS Code. Important files:

```text
sypher-creative-solutions/
  public/                  # Website, admin, CSS, JS, 2 MP4s
  api/index.js             # Vercel serverless API
  db/sypher.sql            # Private database tables
  vercel.json              # API rewrites
  package.json
  scripts/import-existing-data.js
```

## 2. Prepare Supabase

1. Visit https://supabase.com/dashboard and create a new project, for example `sypher-website`. Keeping it separate from unrelated projects is recommended.
2. In **SQL Editor**, open and execute the entire `db/sypher.sql` file.
3. Open your project's **Connect** or **Project Settings → API Keys** and obtain the **Project URL** and backend-only **Secret key** (`sb_secret_...`). Save them securely.
4. **Never** paste the secret key into JavaScript under `public/` or your GitHub repository. The database tables have RLS enabled and no public access policies.

## 3. Push the new version to GitHub

Create an **empty** GitHub repository (example: `sypher-vercel-website`). Open PowerShell in this ZIP's extracted `sypher-creative-solutions` project folder, then run:

```powershell
git init
git add .
git commit -m "Sypher Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sypher-vercel-website.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your own GitHub username. If an origin already exists, run `git remote set-url origin https://github.com/YOUR_USERNAME/sypher-vercel-website.git` instead of `git remote add origin`.

## 4. Deploy to Vercel

1. Sign in to https://vercel.com/new using GitHub.
2. Select your newly created GitHub repository and click **Import**.
3. Enter your project name, for example `sypher-creative-solutions`.
4. Set **Framework Preset = Other**.
5. Set **Root Directory = `./`** if `vercel.json` is in repository root.
6. Leave the **Build Command blank** (skip build). Output Directory should be **`public`**.
7. Add these **Environment Variables** before deploying:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://YOUR_PROJECT_ID.supabase.co` |
| `SUPABASE_SECRET_KEY` | Your `sb_secret_...` key |
| `ADMIN_PASSWORD` | A strong, unique admin password |

Do not include extra quotation marks around the values. Don't use `NEXT_PUBLIC_` or `VITE_` for secrets.

8. Click **Deploy** and wait for the deployment URL (`https://YOUR_SITE.vercel.app`). No custom domain is required.

## 5. Check that *everything* works

Open these URLs (replace `YOUR_SITE`):

- `https://YOUR_SITE.vercel.app/`  -  website and animations
- `https://YOUR_SITE.vercel.app/api/health`  -  should show `status: ok`, `storage: supabase`, `adminConfigured: true`
- `https://YOUR_SITE.vercel.app/admin.html`  -  sign in using the `ADMIN_PASSWORD` configured in Vercel
- Contact form  -  submit a valid test inquiry, then confirm it appears in the admin inbox
- Work / Motion  -  check project interactions and both MP4 videos
- Admin / Reply in Gmail  -  prefilled Gmail draft opens; **click Send in Gmail**, then manually change the inquiry status to Replied

## 6. Optional: move saved inquiries from old local version

If your old website has a `private-data` directory, back it up. After creating Supabase tables, set the environment variables temporarily in your LOCAL PowerShell window and use the included migration script:

```powershell
$env:SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
$env:SUPABASE_SECRET_KEY = "YOUR_SECRET_KEY"
node scripts/import-existing-data.js "C:\path\to\old\sypher-creative-solutions\private-data"
```

This imports `content.json` and `inquiries.json` into Supabase. Do **not** upload the `private-data` directory to GitHub or Vercel.

## 7. Later updates

```powershell
git add .
git commit -m "Update Sypher website"
git push origin main
```

Vercel automatically deploys your changes. Environment variable edits in Vercel Settings require a new deployment to take effect. Your PowerShell `$env:ADMIN_PASSWORD` variable only affects local processes, not Vercel.

## Troubleshooting

- **404 homepage**  -  check framework `Other`, root directory, and output directory `public`.
- **404 API**  -  check `api/index.js`, `vercel.json`, repository root, and Vercel Functions runtime logs.
- **503 API**  -  check your Supabase URL, secret key, SQL tables, and Vercel Runtime Logs.
- **adminConfigured false**  -  set `ADMIN_PASSWORD` in Vercel Project → Settings → Environment Variables, then redeploy.
- **Gmail button doesn't send**  -  it only opens a draft. You must press Send in Gmail.
- **Server shows EADDRINUSE locally**  -  another server is already using port 3000; Vercel does not require running `npm start` locally.

## Boundaries

This ZIP was programmatically tested locally using a mocked Supabase provider. It has **not yet been connected to your real Supabase account or deployed to your Vercel account**; complete the steps above. Before accepting public inquiries at scale, add spam protection (e.g., CAPTCHA), define data retention/consent, and review the privacy notice and applicable laws. A dedicated Vercel Functions backend and database are necessary to keep inquiries and admin data persistent. Use a suitable hosting plan if the site becomes commercial.
