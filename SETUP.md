# Ship it: GitHub + Vercel in ~3 minutes

Your project is fully scaffolded and ready to push. This sandbox can't reach
GitHub or the Vercel CLI directly, so the last mile runs on your machine.

---

## Step 1 — Grab the project locally

Pick **ONE** of these three options.

### Option A (easiest): Download the zip

Download `ea-control-center.zip` from this conversation, then:

```bash
unzip ea-control-center.zip
cd ea
git init -b main
git add -A
git commit -m "Initial commit: EA Control Center portfolio piece"
```

### Option B: Clone the git bundle (preserves the commit I already made)

Download `ea-control-center.bundle`, then:

```bash
git clone ea-control-center.bundle ea-control-center
cd ea-control-center
```

### Option C: Copy the folder

Copy `ea-control-center/` from the outputs folder to wherever you want, then
run `git init -b main && git add -A && git commit -m "Initial commit"`.

---

## Step 2 — Push to a new public GitHub repo

Install `gh` if you don't have it: https://cli.github.com/

```bash
# From inside the project folder:
gh auth login                              # one-time, pick GitHub.com + HTTPS
gh repo create ea-control-center \
    --public \
    --source=. \
    --description "Executive Assistant Control Center — a portfolio piece" \
    --push
```

That single `gh repo create` command creates the repo on GitHub, adds it as
your `origin` remote, and pushes `main`. Your repo is live.

**If you don't want to use `gh`**: create the empty repo on github.com first,
then:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/ea-control-center.git
git push -u origin main
```

---

## Step 3 — Connect to Vercel

Two options — pick whichever you prefer.

### Option A (recommended): Dashboard import

1. Go to https://vercel.com/new
2. Click **Import** next to the `ea-control-center` repo you just created
3. Vercel auto-detects Vite. Leave defaults (`vite build` → `dist`).
4. Click **Deploy**.

You'll get a live URL like `ea-control-center-<hash>.vercel.app` in ~60 seconds.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel                    # first time — links the local folder to a Vercel project
vercel --prod             # ship to production
```

---

## After deploying

- Every `git push` to `main` auto-deploys.
- Embed in your portfolio: `<iframe src="https://your-vercel-url" />`, or
  just `import ExecutiveAssistantControlCenter from "..."` and drop the
  component straight in.

## If something breaks

- **Vercel build fails on install:** confirm `package.json` and
  `package-lock.json` are committed. The lockfile will be generated on your
  first local `npm install`.
- **Blank page on deploy:** open DevTools → Console. If it's a MIME-type
  error on `.jsx`, make sure Vercel detected the Vite framework (Settings →
  General → Framework Preset = Vite).
