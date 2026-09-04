import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NFL Survivor',
  description: 'NFL Survivor Game Tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex gap-6">
            <a href="/" className="font-bold text-lg">NFL Survivor</a>
            <a href="/" className="text-gray-600 hover:text-gray-900">Scoreboard</a>
            <a href="/signup" className="text-gray-600 hover:text-gray-900">Sign Up</a>
            <a href="/pick" className="text-gray-600 hover:text-gray-900">Make Pick</a>
            <a href="/admin" className="text-gray-600 hover:text-gray-900">Admin</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
