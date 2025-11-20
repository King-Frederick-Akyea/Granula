'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            Granula
          </Link>

          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <div className="flex items-center gap-4 ">
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <button
                    onClick={signOut}
                    className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
