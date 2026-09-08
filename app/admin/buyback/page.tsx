'use client'

import { useEffect, useState } from 'react'

interface Player {
  id: number
  name: string
  email: string
  status: string
  buyback_count: number
  total_paid: number
}

export default function BuybackManagement() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [adminPassword, setAdminPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<number | null>(null)

  useEffect(() => {
    fetchEligiblePlayers()
  }, [])

  const fetchEligiblePlayers = async () => {
    try {
      const res = await fetch('/api/admin/data')
      const data = await res.json()
      const eligible = data.players.filter((p: Player) => p.status === 'eligible_for_buyback')
      setPlayers(eligible)
    } catch (err) {
      setError('Failed to load eligible players')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveBuyback = async (playerId: number, player: Player) => {
    if (!adminPassword) {
      setError('Please enter admin password')
      return
    }

    setApproving(playerId)
    setError('')
    setMessage('')

    try {
      const buybackNumber = player.buyback_count + 1
      const res = await fetch('/api/admin/approve-buyback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: adminPassword,
          player_id: playerId,
          buyback_number: buybackNumber,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to approve buyback')
        return
      }

      setMessage(data.message)
      setPlayers(players.filter(p => p.id !== playerId))
      setAdminPassword('')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setApproving(null)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Buyback Management</h1>

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

        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No players eligible for buyback</p>
        ) : (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password to approve buybacks"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Eligible for Buyback ({players.length})
              </h2>

              {players.map((player) => {
                const buybackNumber = player.buyback_count + 1
                const cost = buybackNumber * 10
                const newTotal = player.total_paid + cost

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-yellow-50 border border-yellow-200 p-4 rounded"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-gray-600">{player.email}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Buyback #{buybackNumber} • Cost: ${cost}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total paid: ${player.total_paid} → ${newTotal}
                      </p>
                    </div>

                    <button
                      onClick={() => handleApproveBuyback(player.id, player)}
                      disabled={approving === player.id || !adminPassword}
                      className="ml-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {approving === player.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t">
          <a
            href="/admin"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
