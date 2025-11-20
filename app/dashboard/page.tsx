import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

interface OrganizationWithCount {
  id: string
  name: string
  description?: string
  created_at: string
  role: string
  boards_count: number
}

export default async function Dashboard() {
  const supabase = await createClient()
  // Authenticate user server-side using getUser()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/auth/login')
  }

  try {
    // First get organization memberships
    const { data: memberships, error: membersError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)

    if (membersError) throw membersError

    if (!memberships || memberships.length === 0) {
      return (
        <DashboardClient 
          user={user}
          organizations={[]}
          recentBoards={[]}
        />
      )
    }

    // Then get the actual organizations
    const organizationIds = memberships.map(m => m.organization_id)
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, description, created_at')
      .in('id', organizationIds)

    if (orgsError) throw orgsError

    // Combine the data and get board counts
    const organizationsWithCounts: OrganizationWithCount[] = await Promise.all(
      organizations.map(async (org) => {
        const membership = memberships.find(m => m.organization_id === org.id)
        const { count } = await supabase
          .from('boards')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)

        return {
          id: org.id,
          name: org.name,
          description: org.description,
          created_at: org.created_at,
          role: membership?.role || 'member',
          boards_count: count || 0
        }
      })
    )

    // Fetch recent boards across user's organizations
    const { data: recentBoards } = await supabase
      .from('boards')
      .select('*')
      .in('organization_id', organizationIds)
      .order('created_at', { ascending: false })
      .limit(8)

    return (
      <DashboardClient 
        user={user}
        organizations={organizationsWithCounts}
        recentBoards={recentBoards || []}
      />
    )
  } catch (error) {
    console.error('Error loading dashboard:', error)
    return (
      <DashboardClient 
        user={user}
        organizations={[]}
      />
    )
  }
}