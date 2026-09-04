# Deployment Checklist - Do This by Monday

## Friday (Today) - Setup Infrastructure
- [ ] Read SETUP.md (takes 5 min)
- [ ] Create Supabase account (free tier)
- [ ] Create new Supabase project named `nfl-survivor`
- [ ] Copy API keys to .env.local file
- [ ] Run database.sql in Supabase SQL Editor
- [ ] Test locally: `npm install && npm run dev` (open http://localhost:3000)

## Saturday - Deploy to Vercel
- [ ] Push code to GitHub
- [ ] Connect GitHub to Vercel
- [ ] Deploy project (adds environment variables)
- [ ] Get live URL from Vercel
- [ ] Test all pages work on live URL:
  - [ ] Scoreboard loads
  - [ ] Signup page works
  - [ ] Can submit picks
  - [ ] Admin panel loads with password

## Sunday - Add Games & Final Testing
- [ ] Add NFL games to database (via script or manual)
- [ ] Test full flow:
  - [ ] Create test player account
  - [ ] Submit a pick
  - [ ] Check it appears on scoreboard
  - [ ] Admin: sync scores
  - [ ] Verify player status updates
- [ ] Create admin password (change from default if desired)
- [ ] Test deadline enforcement (pick should lock at game time)

## Monday - Ready for Players
- [ ] Verify scoreboard is live and accessible
- [ ] Create list of player emails to send signup link
- [ ] Prepare message for players with:
  - [ ] Signup URL: https://your-app.vercel.app/signup
  - [ ] Scoreboard URL: https://your-app.vercel.app/
  - [ ] Deadline for Week 1 picks
- [ ] Do final end-to-end test with yourself

## Tuesday - Season Launches
- [ ] Send player signup link
- [ ] Monitor signups throughout day
- [ ] After games finish: Admin → Sync Scores
- [ ] Watch scoreboard update with results
- [ ] Answer player questions

---

**Stuck?** Reference these in order:
1. SETUP.md - Step-by-step setup guide
2. README.md - Feature overview and troubleshooting
3. Check browser console (F12 → Console tab) for error messages

**Time estimate:** 2-3 hours total setup + deployment
