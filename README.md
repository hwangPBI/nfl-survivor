# NFL Survivor Game Tracker

A web app for organizing and tracking an NFL Survivor pool game automatically.

## Features

- **Player Signup** - Simple registration for players
- **Pick Submission** - Players submit one team pick per week (auto-deadline enforcement)
- **Public Scoreboard** - Live standings showing survivors and eliminated players
- **Admin Dashboard** - Sync NFL scores and manage the game
- **Automatic Score Processing** - Fetches NFL scores and processes picks
- **Buyback System** - Handle re-entry with escalating costs
- **Pool Tracking** - Automatic pool total calculation

## Setup (3 Steps)

### 1. Create Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the SQL from `database.sql` to create all tables
4. Copy your credentials:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configure Environment Variables

1. Rename `.env.local.example` to `.env.local`
2. Paste your Supabase credentials
3. Set `ADMIN_PASSWORD` to a secure password

Example `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ADMIN_PASSWORD=your_secure_password_here
```

### 3. Deploy to Vercel

1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com) and connect your repo
3. Add the same environment variables in Vercel settings
4. Deploy!

## Manual Setup (if not using Vercel)

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm build
npm start
```

Then open http://localhost:3000

## How It Works

### Players
1. Sign up with name and email
2. Each week before games start, submit a pick
3. Check the public scoreboard to see standings

### Admin (You)
1. Log into `/admin` with your password
2. Each week after NFL games finish, click "Sync Scores"
3. App automatically processes:
   - Wins/losses for picks
   - Player eliminations
   - Buyback eligibility (before week 9)
   - Pool calculations

## Rules Enforced by App

- ✅ Picks locked at game start time
- ✅ Missing pick = automatic loss
- ✅ Buyback costs escalate: $10, $20, $30, etc.
- ✅ Unlimited buybacks before week 9, none after
- ✅ Can't re-pick same team after buyback
- ✅ Pool splits if all survivors lose same week
- ✅ Last survivor wins entire pool

## Troubleshooting

**"Failed to sync scores"**
- Make sure Supabase tables are created (run database.sql)
- Check that NFL games have finished

**"Player not found"**
- Player must sign up first before making picks

**"Email already registered"**
- Each player can only have one account

## Support

For issues, check:
1. Supabase table structure (run database.sql)
2. Environment variables (.env.local)
3. Browser console for error messages

## Next Steps

- Set admin password via environment variable
- Test with a few players before season starts
- Add NFL games to database via admin panel (or they auto-import via ESPN API)
- Share scoreboard URL with players
