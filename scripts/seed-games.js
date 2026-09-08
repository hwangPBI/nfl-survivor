// Script to seed 2026 NFL regular season games
// Run with: node scripts/seed-games.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// NFL 2026 Schedule - Week 1
const gamesList = [
  // Wednesday, September 9, 2026 - 5:20 PM PT (12:20 AM UTC)
  {
    week: 1,
    team1: 'Seattle Seahawks',
    team2: 'New England Patriots',
    start_time: '2026-09-10T00:20:00Z',
  },
  // Thursday, September 10, 2026 - 3:35 PM PT (10:35 PM UTC)
  {
    week: 1,
    team1: 'Los Angeles Rams',
    team2: 'San Francisco 49ers',
    start_time: '2026-09-11T02:35:00Z',
  },
  // Sunday, September 13, 2026 - 10:00 AM PT (5:00 PM UTC)
  {
    week: 1,
    team1: 'Cincinnati Bengals',
    team2: 'Tampa Bay Buccaneers',
    start_time: '2026-09-13T17:00:00Z',
  },
  {
    week: 1,
    team1: 'Detroit Lions',
    team2: 'New Orleans Saints',
    start_time: '2026-09-13T17:00:00Z',
  },
  {
    week: 1,
    team1: 'Tennessee Titans',
    team2: 'New York Giants',
    start_time: '2026-09-13T17:00:00Z',
  },
  {
    week: 1,
    team1: 'Indianapolis Colts',
    team2: 'Baltimore Ravens',
    start_time: '2026-09-13T17:00:00Z',
  },
  {
    week: 1,
    team1: 'Pittsburgh Steelers',
    team2: 'Atlanta Falcons',
    start_time: '2026-09-13T17:00:00Z',
  },
  {
    week: 1,
    team1: 'Carolina Panthers',
    team2: 'Chicago Bears',
    start_time: '2026-09-13T17:00:00Z',
  },
  {
    week: 1,
    team1: 'Jacksonville Jaguars',
    team2: 'Cleveland Browns',
    start_time: '2026-09-13T17:00:00Z',
  },
  {
    week: 1,
    team1: 'Houston Texans',
    team2: 'Buffalo Bills',
    start_time: '2026-09-13T17:00:00Z',
  },
  // Sunday, September 13, 2026 - 1:25 PM PT (8:25 PM UTC)
  {
    week: 1,
    team1: 'Las Vegas Raiders',
    team2: 'Miami Dolphins',
    start_time: '2026-09-14T01:25:00Z',
  },
  {
    week: 1,
    team1: 'Minnesota Vikings',
    team2: 'Green Bay Packers',
    start_time: '2026-09-14T01:25:00Z',
  },
  {
    week: 1,
    team1: 'Philadelphia Eagles',
    team2: 'Washington Commanders',
    start_time: '2026-09-14T01:25:00Z',
  },
  {
    week: 1,
    team1: 'Los Angeles Chargers',
    team2: 'Arizona Cardinals',
    start_time: '2026-09-14T01:25:00Z',
  },
  // Sunday, September 13, 2026 - 5:20 PM PT (12:20 AM UTC)
  {
    week: 1,
    team1: 'New York Giants',
    team2: 'Dallas Cowboys',
    start_time: '2026-09-14T04:20:00Z',
  },
  // Monday, September 14, 2026 - 5:15 PM PT (12:15 AM UTC)
  {
    week: 1,
    team1: 'Kansas City Chiefs',
    team2: 'Denver Broncos',
    start_time: '2026-09-15T00:15:00Z',
  },
]

async function seedGames() {
  console.log('Starting to seed games...')

  try {
    for (const game of gamesList) {
      // start_time is already in ISO 8601 format
      const startTimestamp = new Date(game.start_time).getTime()

      const { data, error } = await supabase
        .from('games')
        .insert({
          week: game.week,
          team1: game.team1,
          team2: game.team2,
          start_time: game.start_time,
          start_timestamp: startTimestamp,
        })
        .select()

      if (error) {
        console.error(`Error adding game ${game.team1} vs ${game.team2}:`, error)
      } else {
        console.log(`✓ Added: Week ${game.week} - ${game.team1} vs ${game.team2} at ${game.start_time}`)
      }
    }

    console.log('✓ Done seeding games!')
  } catch (error) {
    console.error('Error seeding games:', error)
  }
}

seedGames()
