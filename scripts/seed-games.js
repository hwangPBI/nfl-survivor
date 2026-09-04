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

// NFL 2026 Schedule (example - you'll need to update with actual dates)
// This is a placeholder structure
const gamesList = [
  // Week 1 - Sep 4-7, 2026
  {
    week: 1,
    team1: 'Kansas City Chiefs',
    team2: 'Houston Texans',
    start_time: '2026-09-10T20:20:00Z',
  },
  {
    week: 1,
    team1: 'Dallas Cowboys',
    team2: 'Green Bay Packers',
    start_time: '2026-09-12T18:30:00Z',
  },
  // Add more games here...
  // Total: 16 games per week x 18 weeks = 288 games
]

async function seedGames() {
  console.log('Starting to seed games...')

  try {
    for (const game of gamesList) {
      const startTime = new Date(game.start_time)
      const startTimestamp = startTime.getTime()

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
        console.log(`✓ Added: Week ${game.week} - ${game.team1} vs ${game.team2}`)
      }
    }

    console.log('✓ Done seeding games!')
  } catch (error) {
    console.error('Error seeding games:', error)
  }
}

seedGames()
