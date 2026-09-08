'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Pick {
  id: string
  week: number
  team_picked: string
  result: 'pending' | 'win' | 'loss'
}

interface Player {
  id: number
  name: string
  email: string
  status: string
  buyback_count: number
  total_paid: number
  current_pick: Pick | null
  has_picked: boolean
  all_picks: Pick[]
}

interface PlayersStatus {
  current_week: number
  players: Player[]
  total_players: number
  picked_count: number
}

export default function PlayersStatus() {
  const [data, setData] = useState<PlayersStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [filter, setFilter] = useState<'all' | 'picked' | 'not-picked' | 'alive' | 'eliminated'>('all')

  useEffect(() => {
    const stored = localStorage.getItem('admin_authenticated')
    if (stored === 'true') {
      setIsAuthenticated(true)
      fetchPlayersStatus()
    } else {
      setError('Not authenticated. Please login first.')
      setLoading(false)
    }
  }, [])

  const fetchPlayersStatus = async () => {
    try {
      const res = await fetch('/api/admin/players-status')
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to load players')
        return
      }
      setData(result)
    } catch (err) {
      setError('Failed to load players')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600 mb-6">Not authenticated. Please login first.</p>
          <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Go to Admin Login
          </a>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-red-600 mb-4">{error}</div>
          <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Admin Dashboard
          </a>
        </div>
      </div>
    )
  }

  if (!data) return <div className="text-center py-8">No data</div>

  const filteredPlayers = data.players.filter((player) => {
    switch (filter) {
      case 'picked':
        return player.has_picked
      case 'not-picked':
        return !player.has_picked
      case 'alive':
        return player.status === 'alive'
      case 'eliminated':
        return player.status !== 'alive'
      default:
        return true
    }
  })

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Players & Picks Status</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Week</p>
            <p className="text-2xl font-bold">{data.current_week}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Total Players</p>
            <p className="text-2xl font-bold">{data.total_players}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-600">Picked</p>
            <p className="text-2xl font-bold text-blue-700">{data.picked_count}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <p className="text-sm text-orange-600">Not Picked Yet</p>
            <p className="text-2xl font-bold text-orange-700">{data.total_players - data.picked_count}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'picked', 'not-picked', 'alive', 'eliminated'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'all' && 'All'}
              {f === 'picked' && 'Picked'}
              {f === 'not-picked' && 'Not Picked'}
              {f === 'alive' && 'Alive'}
              {f === 'eliminated' && 'Eliminated'}
            </button>
          ))}
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-semibold">Player</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Week {data.current_week} Pick</th>
                <th className="px-4 py-3 text-center font-semibold">Buybacks</th>
                <th className="px-4 py-3 text-right font-semibold">Paid</th>
                <th className="px-4 py-3 text-left font-semibold">Recent Picks</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No players match this filter
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player, idx) => (
                  <tr key={player.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b">
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-gray-600">{player.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b">
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          player.status === 'alive'
                            ? 'bg-green-100 text-green-800'
                            : player.status === 'eligible_for_buyback'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {player.status === 'eligible_for_buyback' ? 'Eligible Buyback' : player.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b text-center">
                      {player.has_picked ? (
                        <div>
                          <p className="font-semibold text-blue-600">{player.current_pick?.team_picked}</p>
                          <p className="text-xs text-gray-500">Picked ✓</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-orange-600 font-semibold">—</p>
                          <p className="text-xs text-orange-500">Not Picked</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b text-center">
                      <span className="font-semibold">{player.buyback_count}</span>
                    </td>
                    <td className="px-4 py-3 border-b text-right">
                      <span className="font-semibold">${player.total_paid}</span>
                    </td>
                    <td className="px-4 py-3 border-b text-sm">
                      {player.all_picks.slice(0, 3).length === 0 ? (
                        <span className="text-gray-500">No picks yet</span>
                      ) : (
                        <div className="space-y-1">
                          {player.all_picks.slice(0, 3).map((pick) => (
                            <div key={pick.id} className="flex items-center gap-2">
                              <span className="text-gray-600">W{pick.week}:</span>
                              <span className="font-medium">{pick.team_picked}</span>
                              <span
                                className={
                                  pick.result === 'win'
                                    ? 'text-green-600 font-bold'
                                    : pick.result === 'loss'
                                    ? 'text-red-600 font-bold'
                                    : 'text-gray-400'
                                }
                              >
                                {pick.result === 'win' && '✓'}
                                {pick.result === 'loss' && '✗'}
                                {pick.result === 'pending' && '⏳'}
                              </span>
                            </div>
                          ))}
                          {player.all_picks.length > 3 && (
                            <p className="text-xs text-gray-500">+{player.all_picks.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow p-8">
        <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Admin Dashboard
        </a>
      </div>
    </div>
  )
}
