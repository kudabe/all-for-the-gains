# All For the Gains — setup

A shared workout log for two, installable on iPhone as a web app.

## 1. Supabase (the shared database) — ~5 min
1. Go to supabase.com → Sign up (easiest with your GitHub account).
2. New project → name it `all-for-the-gains`, set any database password
   (you won't need it again), region: Southeast Asia (Singapore).
3. Left sidebar → SQL Editor → New query → paste everything from
   `setup.sql` (in this folder) → Run.
4. Left sidebar → Project Settings → API Keys:
   - copy the **Project URL**
   - copy the **Publishable key** (starts with `sb_publishable_...`).
     If you only see a "Legacy API Keys" tab, the **anon public** key
     works the same.

## 2. Connect the app
Open `config.js` in any text editor and paste the two values between
the quotes. Save.

## 3. Put it online — GitHub Pages
1. github.com → New repository → name `all-for-the-gains` → Public → Create.
2. Click the "uploading an existing file" link → drag ALL files from
   this folder in → Commit changes.
3. Repo → Settings → Pages → Source: "Deploy from a branch" →
   Branch: main, folder: / (root) → Save.
4. Wait a minute or two. Your app is live at:
   https://YOUR-USERNAME.github.io/all-for-the-gains/

## 4. Install on both iPhones
Open that link in Safari → Share button → "Add to Home Screen" → Add.
Done — full-screen app, own icon, both phones writing to the same log.
