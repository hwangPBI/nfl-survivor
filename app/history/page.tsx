'use client'

import { useEffect, useState } from 'react'

interface Pick {
  id: string
  week: number
  team_picked: string
  result: 'pending' | 'win' | 'loss'
  created_at: string
}

export default function PickHistory() {
  const [email, setEmail] = useState('')
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pickedTeams, setPickedTeams] = useState<Set<string>>(new Set())

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/picks/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load history')
        setPicks([])
        setPickedTeams(new Set())
        return
      }

      setPicks(data.picks || [])
      setPickedTeams(new Set(data.picks.map((p: Pick) => p.team_picked)))
    } catch (err) {
      setError('Failed to load history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getResultColor = (result: string) => {
    if (result === 'win') return 'bg-green-50 border-green-200'
    if (result === 'loss') return 'bg-red-50 border-red-200'
    return 'bg-yellow-50 border-yellow-200'
  }

  const getResultText = (result: string) => {
    if (result === 'win') return '✓ WIN'
    if (result === 'loss') return '✗ LOSS'
    return '⏳ PENDING'
  }

  const getResultClass = (result: string) => {
    if (result === 'win') return 'text-green-700 font-semibold'
    if (result === 'loss') return 'text-red-700 font-semibold'
    return 'text-yellow-700'
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Pick History</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {picks.length === 0 && email && !loading && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600">
            No picks found for this email
          </div>
        )}

        {picks.length > 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>Teams already picked:</strong> {Array.from(pickedTeams).join(', ')}
              </p>
            </div>

            <div className="space-y-3">
              {picks.map((pick) => (
                <div
                  key={pick.id}
                  className={`border-2 rounded p-4 ${getResultColor(pick.result)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{pick.team_picked}</p>
                      <p className="text-sm text-gray-600">Week {pick.week}</p>
                    </div>
                    <div className={`text-sm font-semibold ${getResultClass(pick.result)}`}>
                      {getResultText(pick.result)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Stats:</strong>{' '}
                {picks.filter((p) => p.result === 'win').length} wins,{' '}
                {picks.filter((p) => p.result === 'loss').length} losses,{' '}
                {picks.filter((p) => p.result === 'pending').length} pending
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
