'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Home, Clock, Package, PenLine } from 'lucide-react'
import SignaturePad from './SignaturePad'

export default function Navbar({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [showSignature, setShowSignature] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/history', label: 'History', icon: Clock },
    { href: '/items', label: 'Items', icon: Package },
  ]

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image src="/bristeen-logo.png" alt="Bristeen" fill className="object-contain" />
            </div>
            <span className="font-bold text-gray-800 text-sm hidden sm:block">Bristeen Catering</span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === href || (href === '/dashboard' && pathname === '/')
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            ))}

            <button
              onClick={() => setShowSignature(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition"
              title="Manage signature"
            >
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:block">Signature</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition ml-1"
              title={userEmail}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {showSignature && <SignaturePad onClose={() => setShowSignature(false)} />}
    </>
  )
}
