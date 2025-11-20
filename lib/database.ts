import { createClient } from '@/lib/supabase-server'

export async function createOrganization(name: string, description: string, userId: string) {
  const supabase = await createClient()
  
  const { data: organization, error } = await supabase
    .from('organizations')
    .insert([
      {
        name,
        description,
        created_by: userId
      }
    ])
    .select()
    .single()

  if (error) throw error

  // Add creator as organization owner
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert([
      {
        organization_id: organization.id,
        user_id: userId,
        role: 'owner'
      }
    ])

  if (memberError) throw memberError

  return organization
}

export async function createBoard(name: string, description: string, organizationId: string, userId: string) {
  const supabase = await createClient()
  
  const { data: board, error } = await supabase
    .from('boards')
    .insert([
      {
        name,
        description,
        organization_id: organizationId,
        created_by: userId
      }
    ])
    .select()
    .single()

  if (error) throw error

  return board
}

export async function createInvite(organizationId: string, email: string, userId: string) {
  const supabase = await createClient()
  
  const token = Math.random().toString(36).substring(2, 15)
  
  const { data: invite, error } = await supabase
    .from('organization_invites')
    .insert([
      {
        organization_id: organizationId,
        email,
        token,
        invited_by: userId
      }
    ])
    .select()
    .single()

  if (error) throw error

  return invite
}

export async function acceptInvite(token: string, userId: string) {
  const supabase = await createClient()
  
  // Get invite
  const { data: invite, error: inviteError } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError) throw new Error('Invalid or expired invite')

  // Add user to organization
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert([
      {
        organization_id: invite.organization_id,
        user_id: userId,
        role: 'member'
      }
    ])

  if (memberError) throw memberError

  // Update invite status
  await supabase
    .from('organization_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  return invite.organization_id
}