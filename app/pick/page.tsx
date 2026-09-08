'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'

interface Game {
  id: string
  week: number
  team1: string
  team2: string
  start_time: string
  start_timestamp: number
}

interface PlayerPick {
  player_email: string
  week: number
  team_picked: string | null
}

export default function MakePick() {
  const [games, setGames] = useState<Game[]>([])
  const [playerEmail, setPlayerEmail] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentWeek, setCurrentWeek] = useState(1)

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games')
      const data = await res.json()
      setGames(data.games)
      setCurrentWeek(data.current_week)
    } catch (err) {
      setError('Failed to load games')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/picks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_email: playerEmail,
          week: currentWeek,
          team_picked: selectedTeam,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit pick')
        return
      }

      setMessage('Pick submitted successfully!')
      setSelectedTeam('')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  const weekGames = games.filter((g) => g.week === currentWeek)
  const now = Date.now()
  const allGamesPassed = weekGames.every((g) => g.start_timestamp < now)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Make Your Pick</h1>
        <p className="text-gray-600 mb-6">Week {currentWeek}</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            {message}
          </div>
        )}

        {allGamesPassed && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
            All games have started. Picks are closed for this week.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email
            </label>
            <input
              type="email"
              value={playerEmail}
              onChange={(e) => setPlayerEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Team
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {weekGames.length === 0 ? (
                <p className="text-gray-500">No games available</p>
              ) : (
                weekGames.map((game) => (
                  <div key={game.id} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTeam(game.team1)}
                      className={`flex-1 px-4 py-3 border-2 rounded text-left transition ${
                        selectedTeam === game.team1
                          ? 'bg-blue-50 border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={allGamesPassed}
                    >
                      {game.team1} ({new Date(game.start_time).toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTeam(game.team2)}
                      className={`flex-1 px-4 py-3 border-2 rounded text-right transition ${
                        selectedTeam === game.team2
                          ? 'bg-blue-50 border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={allGamesPassed}
                    >
                      {game.team2} ({new Date(game.start_time).toLocaleString()})
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedTeam && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-semibold text-blue-900">
                Your pick: <span className="text-lg">{selectedTeam}</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedTeam || allGamesPassed}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Pick'}
          </button>
        </form>
      </div>
    </div>
  )
}
