import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import OrganizationClient from '@/components/organization/OrganizationClient'

interface OrganizationPageProps {
  params: {
    id: string
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const supabase = await createClient()

  // Ensure params is resolved (Next can pass params as a Promise)
  const resolvedParams = await params as { id: string }

  // Use getUser() to authenticate server-side user data
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Check if user has access to this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization:organizations (*)
    `)
    .eq('organization_id', resolvedParams.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    notFound()
  }

  // Fetch organization boards
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('organization_id', resolvedParams.id)
    .order('created_at', { ascending: false })

  // Fetch organization members
  const { data: membersData, error: membersError } = await supabase
    .from('organization_members')
    .select('role, user_id, created_at')
    .eq('organization_id', resolvedParams.id)

  if (membersError) {
    console.error('Failed to fetch organization_members:', membersError)
  }

  const members = membersData || []

  // Normalize results to match OrganizationClient types
  const org = (membership as any)?.organization
  const normalizedOrg = org && !Array.isArray(org)
    ? {
        id: org.id,
        name: org.name,
        description: org.description ?? undefined,
        created_at: org.created_at
      }
    : { id: '', name: '', created_at: '' }

  const memberEmailMap = new Map<string, { email: string | null }>()
  const uniqueMemberIds = Array.from(new Set(members.map((m: any) => m.user_id).filter(Boolean))) as string[]

  if (uniqueMemberIds.length) {
    const { data: memberEmails, error: memberEmailsError } = await supabase.rpc('get_member_emails', {
      user_ids: uniqueMemberIds
    })

    if (memberEmailsError) {
      console.error('Failed to resolve member emails via RPC:', memberEmailsError)
    } else {
      memberEmails?.forEach((entry: { user_id: string, email: string | null }) => {
        memberEmailMap.set(entry.user_id, { email: entry.email ?? null })
      })
    }
  }

  const normalizedMembers = (members || []).map((m: any) => {
    const userId = m.user_id ?? ''
    const email = memberEmailMap.get(userId)?.email ?? userId
    return {
      id: userId,
      user_id: userId,
      email,
      created_at: m.created_at ?? '',
      role: m.role
    }
  })

  return (
    <OrganizationClient 
      organization={normalizedOrg}
      boards={boards || []}
      members={normalizedMembers}
      userRole={membership.role}
      currentUserId={user.id}
    />
  )
}