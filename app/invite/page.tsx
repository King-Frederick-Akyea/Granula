'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function InviteContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const acceptInvite = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Invalid invite link')
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Redirect to login with invite token
          router.push(`/auth/login?invite=${token}`)
          return
        }

        // Get invite
        const { data: invite, error: inviteError } = await supabase
          .from('organization_invites')
          .select(`
            *,
            organization:organizations (name)
          `)
          .eq('token', token)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single()

        if (inviteError || !invite) {
          setStatus('error')
          setMessage('Invalid or expired invite')
          return
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', invite.organization_id)
          .eq('user_id', user.id)
          .single()

        if (existingMember) {
          setStatus('success')
          setMessage(`You're already a member of ${invite.organization.name}`)
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }

        // Add user to organization
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert([
            {
              organization_id: invite.organization_id,
              user_id: user.id,
              role: 'member'
            }
          ])

        if (memberError) {
          setStatus('error')
          setMessage('Failed to join organization')
          return
        }

        // Update invite status
        await supabase
          .from('organization_invites')
          .update({ status: 'accepted' })
          .eq('id', invite.id)

        setStatus('success')
        setMessage(`Successfully joined ${invite.organization.name}!`)
        setTimeout(() => router.push('/dashboard'), 2000)

      } catch (error) {
        console.error('Error accepting invite:', error)
        setStatus('error')
        setMessage('An error occurred while processing the invite')
      }
    }

    acceptInvite()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Processing invite...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Error</h2>
              <p className="text-gray-600">{message}</p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}