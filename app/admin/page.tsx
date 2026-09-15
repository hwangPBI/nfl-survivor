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

  const handleDeleteWeekGames = async (e: React.FormEvent) => {
    e.preventDefault()
    const weekInput = (e.target as any).delete_week_input.value
    const weekNum = parseInt(weekInput)

    if (!weekNum || weekNum < 1 || weekNum > 17) {
      setError('Enter a week number between 1-17')
      return
    }

    if (!confirm(`Delete ALL games for Week ${weekNum}? This cannot be undone.`)) {
      return
    }

    setSyncing(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/admin/delete-week-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: weekNum }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ ${data.message}`)
      } else {
        setError(data.error || 'Failed to delete games')
      }
    } catch (err) {
      setError('Delete failed')
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  const handleSeedWeek = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as any
    const weekNum = parseInt(form.week_input.value)
    const startDate = form.start_date_input.value
    const endDate = form.end_date_input.value

    if (!weekNum || weekNum < 1 || weekNum > 17) {
      setError('Enter a week number between 1-17')
      return
    }

    if (!startDate || !endDate) {
      setError('Enter both start and end dates')
      return
    }

    setSyncing(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/admin/seed-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: weekNum, start_date: startDate, end_date: endDate }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ ${data.message} (${data.gamesCount} games) for ${data.dateRange}`)
      } else {
        setError(data.error || 'Failed to seed week')
      }
    } catch (err) {
      setError('Seed failed')
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateCurrentWeek = async (e: React.FormEvent) => {
    e.preventDefault()
    const weekInput = (e.target as any).current_week_input.value
    const weekNum = parseInt(weekInput)

    if (!weekNum || weekNum < 1 || weekNum > 17) {
      setError('Enter a week number between 1-17')
      return
    }

    setSyncing(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/admin/update-current-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: weekNum }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ ${data.message}`)
        fetchAdminData()
      } else {
        setError(data.error || 'Failed to update current week')
      }
    } catch (err) {
      setError('Update failed')
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  const handleSeedManual = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as any
    const weekNum = parseInt(form.manual_week_input.value)
    const gamesText = form.manual_games_input.value

    if (!weekNum || weekNum < 1 || weekNum > 17) {
      setError('Enter a week number between 1-17')
      return
    }

    if (!gamesText.trim()) {
      setError('Enter at least one game')
      return
    }

    setSyncing(true)
    setError('')
    setMessage('')

    try {
      const games = gamesText
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const parts = line.split(',').map((p: string) => p.trim())
          if (parts.length !== 3) {
            throw new Error(`Invalid format: "${line}". Use: Team1, Team2, YYYY-MM-DD HH:MM`)
          }
          return {
            team1: parts[0],
            team2: parts[1],
            start_time: parts[2],
          }
        })

      const res = await fetch('/api/admin/seed-week-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: weekNum, games }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ ${data.message} (${data.gamesCount} games)`)
      } else {
        setError(data.error || 'Failed to seed week')
      }
    } catch (err: any) {
      setError(err.message || 'Seed failed')
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  const handleSeedFromImage = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as any
    const weekNum = parseInt(form.image_week_input.value)
    const imageFile = form.image_input.files[0]

    if (!weekNum || weekNum < 1 || weekNum > 17) {
      setError('Enter a week number between 1-17')
      return
    }

    if (!imageFile) {
      setError('Select an image file')
      return
    }

    setSyncing(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('week', weekNum.toString())
      formData.append('image', imageFile)

      const res = await fetch('/api/admin/seed-week-from-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ ${data.message} (${data.gamesCount} games)`)
      } else {
        setError(data.error || 'Failed to seed from image')
      }
    } catch (err: any) {
      setError(err.message || 'Image upload failed')
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-cyan-50 border border-cyan-200 p-6 rounded">
            <h2 className="text-lg font-bold text-cyan-900 mb-4">Week Management</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-cyan-700 mb-2">🗑️ Delete Week Games</p>
                <form onSubmit={handleDeleteWeekGames} className="space-y-2">
                  <input
                    type="number"
                    name="delete_week_input"
                    placeholder="Week #"
                    min="1"
                    max="17"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <button
                    type="submit"
                    disabled={syncing}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    {syncing ? 'Deleting...' : 'Delete Games'}
                  </button>
                </form>
              </div>
              <div className="border-t border-cyan-200 pt-3">
                <p className="text-xs font-semibold text-cyan-700 mb-2">📅 Seed Week Games</p>
                <form onSubmit={handleSeedWeek} className="space-y-2">
                  <input
                    type="number"
                    name="week_input"
                    placeholder="Week #"
                    min="1"
                    max="17"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <input
                    type="date"
                    name="start_date_input"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <input
                    type="date"
                    name="end_date_input"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <button
                    type="submit"
                    disabled={syncing}
                    className="w-full px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 text-sm"
                  >
                    {syncing ? 'Seeding...' : 'Seed Week'}
                  </button>
                </form>
              </div>
              <div className="border-t border-cyan-200 pt-3">
                <p className="text-xs font-semibold text-cyan-700 mb-2">✏️ Manual Seed Games</p>
                <form onSubmit={handleSeedManual} className="space-y-2">
                  <input
                    type="number"
                    name="manual_week_input"
                    placeholder="Week #"
                    min="1"
                    max="17"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <textarea
                    name="manual_games_input"
                    placeholder="Team1, Team2, YYYY-MM-DD HH:MM&#10;Detroit Lions, Buffalo Bills, 2026-09-17 17:15&#10;Carolina Panthers, Atlanta Falcons, 2026-09-20 10:00"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                    rows={4}
                    disabled={syncing}
                  />
                  <button
                    type="submit"
                    disabled={syncing}
                    className="w-full px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 text-sm"
                  >
                    {syncing ? 'Seeding...' : 'Seed Games'}
                  </button>
                </form>
              </div>
              <div className="border-t border-cyan-200 pt-3">
                <p className="text-xs font-semibold text-cyan-700 mb-2">📸 Seed from Schedule Image</p>
                <form onSubmit={handleSeedFromImage} className="space-y-2">
                  <input
                    type="number"
                    name="image_week_input"
                    placeholder="Week #"
                    min="1"
                    max="17"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <input
                    type="file"
                    name="image_input"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <button
                    type="submit"
                    disabled={syncing}
                    className="w-full px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 text-sm"
                  >
                    {syncing ? 'Processing...' : 'Upload & Parse'}
                  </button>
                </form>
              </div>
              <div className="border-t border-cyan-200 pt-3">
                <p className="text-xs font-semibold text-cyan-700 mb-2">Update Current Week</p>
                <form onSubmit={handleUpdateCurrentWeek} className="space-y-2">
                  <input
                    type="number"
                    name="current_week_input"
                    placeholder="Week #"
                    min="1"
                    max="17"
                    className="w-full px-3 py-2 border border-cyan-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={syncing}
                  />
                  <button
                    type="submit"
                    disabled={syncing}
                    className="w-full px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 text-sm"
                  >
                    {syncing ? 'Updating...' : 'Set Current Week'}
                  </button>
                </form>
              </div>
            </div>
          </div>

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
