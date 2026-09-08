'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AdminData {
  current_week: number
  total_players: number
  survivors: number
  eliminated: number
  pool_total: number
}

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin_authenticated')
    if (stored === 'true') {
      setAuthenticated(true)
      fetchAdminData()
    }
    setIsInitialized(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        setAuthenticated(true)
        localStorage.setItem('admin_authenticated', 'true')
        sessionStorage.setItem('admin_password', password)
        fetchAdminData()
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('Login failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/data')
      const data = await res.json()
      setAdminData(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSyncScores = async () => {
    setSyncing(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/admin/sync-scores', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(data.message)
        fetchAdminData()
      } else {
        setError(data.error || 'Failed to sync scores')
      }
    } catch (err) {
      setError('Sync failed')
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  if (!isInitialized) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => {
              setAuthenticated(false)
              localStorage.removeItem('admin_authenticated')
              sessionStorage.removeItem('admin_password')
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Logout
          </button>
        </div>

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

        {adminData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Current Week</p>
              <p className="text-2xl font-bold">{adminData.current_week}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Players</p>
              <p className="text-2xl font-bold">{adminData.total_players}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-green-600">Survivors</p>
              <p className="text-2xl font-bold text-green-700">{adminData.survivors}</p>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <p className="text-sm text-red-600">Eliminated</p>
              <p className="text-2xl font-bold text-red-700">{adminData.eliminated}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link href="/admin/players">
            <div className="bg-purple-50 border border-purple-200 p-6 rounded cursor-pointer hover:bg-purple-100 transition">
              <h2 className="text-lg font-bold text-purple-900 mb-4">Players & Picks</h2>
              <p className="text-sm text-purple-800 mb-4">
                View all players, their current week picks, and historical pick data.
              </p>
              <button className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                View Master List →
              </button>
            </div>
          </Link>

          <div className="bg-indigo-50 border border-indigo-200 p-6 rounded">
            <h2 className="text-lg font-bold text-indigo-900 mb-4">Sync NFL Scores</h2>
            <p className="text-sm text-indigo-800 mb-4">
              Fetch latest NFL scores and process eliminations/survivals for the current week.
            </p>
            <button
              onClick={handleSyncScores}
              disabled={syncing}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Scores'}
            </button>
          </div>

          <Link href="/admin/buyback">
            <div className="bg-green-50 border border-green-200 p-6 rounded cursor-pointer hover:bg-green-100 transition">
              <h2 className="text-lg font-bold text-green-900 mb-4">Manage Buybacks</h2>
              <p className="text-sm text-green-800 mb-4">
                View players eligible for buyback and approve their re-entry after payment.
              </p>
              <button className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Go to Buyback Management →
              </button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
