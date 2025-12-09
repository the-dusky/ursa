'use client'

import { GodModePanel } from '@/components/admin/GodModePanel'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <Link
            href="/"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Game
          </Link>
        </div>

        <GodModePanel />

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>Warning:</strong> Changes made in God Mode affect the game immediately.
          Use &quot;Save to Config&quot; to make changes permanent (persisted to file).
        </div>
      </div>
    </div>
  )
}
