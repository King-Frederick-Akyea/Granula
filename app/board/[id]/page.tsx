import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BoardClient from '@/components/board/BoardClient'

interface BoardPageProps {
  params: {
    id: string | Promise<string>
  }
}

export default async function BoardPage({ params }: BoardPageProps) {
  const supabase = await createClient()

  const resolved = await params as { id: string }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  // fetch board
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', resolved.id)
    .single()

  if (!board) redirect('/dashboard')

  // ensure user has access by checking organization membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', board.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  // fetch lists and cards
  const { data: lists } = await supabase
    .from('lists')
    .select('*')
    .eq('board_id', resolved.id)
    .order('position', { ascending: true })

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('board_id', resolved.id)
    .order('position', { ascending: true })

  return (
    <BoardClient
      board={board}
      lists={lists || []}
      cards={cards || []}
      currentUserId={user.id}
    />
  )
}
