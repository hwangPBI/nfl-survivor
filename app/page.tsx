'use client'

import { useEffect, useState } from 'react'

interface Player {
  id: string
  name: string
  email: string
  status: 'alive' | 'eliminated' | 'eligible_for_buyback'
  current_week: number
  buyback_count: number
  total_paid: number
}

interface Scoreboard {
  week: number
  survivors: Player[]
  eliminated: Player[]
  pool_total: number
}

export default function Scoreboard() {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchScoreboard()
  }, [])

  const fetchScoreboard = async () => {
    try {
      const res = await fetch('/api/scoreboard')
      if (!res.ok) {
        setError(`Failed to load scoreboard (${res.status})`)
        setLoading(false)
        return
      }
      const data = await res.json()
      setScoreboard(data)
    } catch (err) {
      setError('Failed to load scoreboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>
  if (!scoreboard) return <div className="text-center py-8">No data</div>

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">NFL Survivor Game</h1>
        <div className="grid grid-cols-2 gap-4 text-gray-600">
          <p><strong>Week:</strong> {scoreboard.week}</p>
          <p><strong>Pool Total:</strong> ${scoreboard.pool_total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Survivors */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <h2 className="text-xl font-bold text-green-900">
              Survivors ({scoreboard.survivors.length})
            </h2>
          </div>
          <div className="divide-y">
            {scoreboard.survivors.length === 0 ? (
              <p className="px-6 py-4 text-gray-500">No survivors yet</p>
            ) : (
              scoreboard.survivors.map((player) => (
                <div key={player.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-sm text-gray-500">Week {player.current_week}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Eliminated */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-red-50 border-b border-red-200 px-6 py-4">
            <h2 className="text-xl font-bold text-red-900">
              Eliminated ({scoreboard.eliminated.length})
            </h2>
          </div>
          <div className="divide-y">
            {scoreboard.eliminated.length === 0 ? (
              <p className="px-6 py-4 text-gray-500">No eliminations yet</p>
            ) : (
              scoreboard.eliminated.map((player) => (
                <div key={player.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-sm text-gray-500">
                      {player.status === 'eligible_for_buyback'
                        ? `Eligible for buyback (${player.buyback_count + 1} buyback - $${(player.buyback_count + 1) * 10})`
                        : 'Eliminated'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={fetchScoreboard}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
