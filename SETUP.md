# Quick Start Guide - NFL Survivor App

Deploy by **Monday** to test before Tuesday! Follow these 5 steps.

## Step 1: Create Supabase Database (5 min)

1. Go to https://supabase.com (free tier is fine for 15-20 players)
2. Click "New Project"
3. Set Project Name: `nfl-survivor`
4. Set Password: something secure
5. Click "Create new project" and wait ~2 min for it to initialize

## Step 2: Set Up Database Tables (2 min)

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy ALL the SQL from `database.sql` in this project
4. Paste it into the SQL editor
5. Click "Run"
6. You should see ✓ success messages

## Step 3: Get Your API Keys (2 min)

1. In Supabase, click **Settings** (left sidebar)
2. Click **API** 
3. Copy these three values:
   - `Project URL` → save as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` (under "Project API keys") → save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → save as `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Configure Environment Variables (2 min)

1. In your project, rename `.env.local.example` to `.env.local`
2. Open `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=<paste your Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste anon public key>
SUPABASE_SERVICE_ROLE_KEY=<paste service_role secret>
ADMIN_PASSWORD=hui123
```

## Step 5: Deploy to Vercel (5 min)

### Option A: Deploy via GitHub (Easiest)

1. Create new GitHub repo: https://github.com/new
   - Name: `nfl-survivor`
   - Add .gitignore (choose Node.js)
   - Create repo

2. Push this code:
```bash
cd "c:\Users\hwang\OneDrive - Promega Corporation\# H drive\AI\VS code\Survivor game"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nfl-survivor.git
git push -u origin main
```

3. Go to https://vercel.com/new
   - Connect your GitHub account
   - Select `nfl-survivor` repo
   - Click "Import"
   - In "Environment Variables" section, add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `ADMIN_PASSWORD`
   - Click "Deploy"
   - Wait 2-3 min for deployment ✓

Your app is now LIVE! Vercel will give you a URL like: `https://nfl-survivor-xxxxx.vercel.app`

### Option B: Run Locally First (for testing)

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Step 6: Add NFL Games

You have two options:

### Option A: Auto-fetch (Recommended)
1. Go to Admin dashboard: `/admin`
2. Enter password: `hui123`
3. Click "Sync Scores" (app will fetch current week's games from ESPN)

### Option B: Manual (if auto-fetch doesn't work)
1. Edit `scripts/seed-games.js` and add 2026 NFL schedule
2. Run: `node scripts/seed-games.js`

## Step 7: Test Everything

Open these in a new browser:

1. **Scoreboard** - https://your-app.vercel.app/
   - Should show Week 1, but empty (no players yet)

2. **Signup** - https://your-app.vercel.app/signup
   - Test signup: Name: "Test Player", Email: "test@example.com"
   - Should say "Successfully registered!"

3. **Make Pick** - https://your-app.vercel.app/pick
   - Enter email from signup
   - Should see this week's games
   - Pick a team and submit
   - Should see "Pick submitted successfully!"

4. **Scoreboard** - https://your-app.vercel.app/
   - Should now show "Test Player" as a survivor

5. **Admin** - https://your-app.vercel.app/admin
   - Enter password: `hui123`
   - Should see dashboard with player counts
   - Click "Sync Scores" (will process pick after games finish)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid password" in Supabase | Verify you ran database.sql completely |
| 404 on /admin | Make sure ADMIN_PASSWORD is set in environment |
| Blank scoreboard | Check Supabase connection in Network tab of browser dev tools |
| Games not showing | Admin → Sync Scores (or manually add via seed-games.js) |

## Important for Monday Testing

- [ ] Supabase database created
- [ ] All SQL tables created (database.sql)
- [ ] Environment variables configured
- [ ] Deployed to Vercel (or running locally)
- [ ] Tested signup flow
- [ ] Tested pick submission
- [ ] Tested admin panel
- [ ] Shared scoreboard URL with a few players

## URLs You'll Need

After deployment, bookmark these:

- **Scoreboard** (public): https://your-app.vercel.app/
- **Admin** (your password): https://your-app.vercel.app/admin
- **Share with players**: https://your-app.vercel.app/signup (they can signup here)

---

**Need help?** Check the main README.md for detailed docs.
