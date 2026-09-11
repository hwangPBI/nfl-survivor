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
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deletingPlayerId, setDeletingPlayerId] = useState<number | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  const handleUpdatePlayer = async (playerId: number, playerName: string) => {
    if (!editAmount || !editPassword) {
      setError('Please enter amount and password')
      return
    }

    setUpdating(true)
    setError('')

    try {
      const res = await fetch('/api/admin/update-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: editPassword,
          player_id: playerId,
          total_paid: parseInt(editAmount),
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Failed to update player')
        return
      }

      setError('')
      setEditingPlayerId(null)
      setEditAmount('')
      setEditPassword('')
      fetchPlayersStatus()
    } catch (err) {
      setError('Failed to update player')
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeletePlayer = async (playerId: number) => {
    if (!deletePassword) {
      setError('Please enter admin password')
      return
    }

    setDeleting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/delete-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: deletePassword,
          player_id: playerId,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Failed to delete player')
        return
      }

      setError('')
      setDeletingPlayerId(null)
      setDeletePassword('')
      fetchPlayersStatus()
    } catch (err) {
      setError('Failed to delete player')
      console.error(err)
    } finally {
      setDeleting(false)
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

  const handleExportPlayers = async () => {
    try {
      const passwordFromStorage = sessionStorage.getItem('admin_password')
      if (!passwordFromStorage) {
        setError('Admin password not found. Please login again.')
        return
      }

      const res = await fetch(`/api/admin/export-players?password=${encodeURIComponent(passwordFromStorage)}`)

      if (!res.ok) {
        setError('Failed to export players')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export players')
      console.error(err)
    }
  }

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

        {/* Filter Buttons & Export */}
        <div className="flex gap-2 mb-6 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
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
          <button
            onClick={handleExportPlayers}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium whitespace-nowrap"
            title="Export all players to CSV file"
          >
            📥 Export to CSV
          </button>
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
                    <td className="px-4 py-3 border-b">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setEditingPlayerId(player.id)
                            setEditAmount(player.total_paid.toString())
                          }}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          ${player.total_paid}
                        </button>
                        <button
                          onClick={() => setDeletingPlayerId(player.id)}
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                          title="Delete player"
                        >
                          ✕
                        </button>
                      </div>
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

      {/* Delete Modal */}
      {deletingPlayerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Player</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will permanently delete the player and all their picks from the pool. This action cannot be undone.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter admin password to confirm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeletingPlayerId(null)
                  setDeletePassword('')
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePlayer(deletingPlayerId)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPlayerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Edit Player Payment</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Paid Amount ($)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingPlayerId(null)
                  setEditAmount('')
                  setEditPassword('')
                  setError('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdatePlayer(editingPlayerId, data?.players.find((p) => p.id === editingPlayerId)?.name || '')
                }
                disabled={updating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow p-8">
        <a href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Admin Dashboard
        </a>
      </div>
    </div>
  )
}
