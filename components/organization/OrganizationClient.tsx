'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Users, 
  Settings, 
  Share2, 
  ArrowLeft,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react'
import CreateBoardModal from './CreateBoardModal'
import InviteMemberModal from './InviteMemberModal'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Organization {
  id: string
  name: string
  description?: string
  created_at: string
}

interface Board {
  id: string
  name: string
  description?: string
  created_at: string
}

// Updated Member interface to match your database structure
interface Member {
  id: string
  email: string
  role: string
  user_id?: string
  created_at?: string
}

interface OrganizationClientProps {
  organization: Organization
  boards: Board[]
  members: Member[]
  userRole: string
  currentUserId: string
}

export default function OrganizationClient({ 
  organization, 
  boards, 
  members, 
  userRole,
  currentUserId 
}: OrganizationClientProps) {
  const [activeModal, setActiveModal] = useState<'board' | 'invite' | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDeleteOrganization = async () => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('Failed to delete organization')
    } finally {
      setLoading(false)
    }
  }

  const canManage = userRole === 'owner' || userRole === 'admin'

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {organization.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                  {organization.description && (
                    <p className="text-gray-600 text-sm">{organization.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {canManage && (
                <button 
                  onClick={() => setActiveModal('invite')}
                  className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-gray-700">Invite Members</span>
                </button>
              )}
              
              <button 
                onClick={() => setActiveModal('board')}
                className="flex items-center space-x-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Board</span>
              </button>

              {canManage && (
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button 
                      onClick={handleDeleteOrganization}
                      disabled={loading}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-lg flex items-center space-x-2 text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{loading ? 'Deleting...' : 'Delete Organization'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Boards */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Boards</h2>
                <p className="text-gray-600 mt-2">Manage your project boards</p>
              </div>
              
              <div className="text-sm text-gray-500">
                {boards.length} board{boards.length !== 1 ? 's' : ''}
              </div>
            </div>

            {boards.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="h-24 bg-blue-500 rounded-t-lg"></div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        {board.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {board.description || 'No description'}
                      </p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {new Date(board.created_at).toLocaleDateString()}
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Plus className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No boards yet
                    </h3>
                    <p className="text-gray-600">
                      Create your first board to start organizing tasks and projects for {organization.name}.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveModal('board')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Board
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Members & Info */}
          <div className="space-y-6">
            {/* Organization Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Organization Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-600 text-sm">
                    {new Date(organization.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Your Role</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userRole === 'owner' 
                      ? 'bg-purple-100 text-purple-800'
                      : userRole === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Members</h3>
                <span className="text-sm text-gray-500">{members.length} members</span>
              </div>
              
              <div className="space-y-3">
                {members && members.length > 0 ? (
                  members.map((member) => {
                    const email = member.email || 'Unknown'
                    const memberId = member.id || member.user_id || 'unknown'
                    const isCurrentUser = memberId === currentUserId
                    
                    return (
                      <div key={memberId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {email}
                              {isCurrentUser && ' (You)'}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                              member.role === 'owner' 
                                ? 'bg-purple-100 text-purple-800'
                                : member.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                        
                        {canManage && !isCurrentUser && (
                          <button className="text-gray-400 hover:text-red-600 transition-colors">
                            {/* <Trash2 className="w-4 h-4" /> */}
                          </button>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No members yet</p>
                    {canManage && (
                      <p className="text-gray-400 text-xs mt-1">
                        Invite members to get started
                      </p>
                    )}
                  </div>
                )}
              </div>

              {canManage && (
                <button 
                  onClick={() => setActiveModal('invite')}
                  className="w-full mt-4 flex items-center justify-center space-x-2 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-gray-700">Invite Members</span>
                </button>
              )}
            </div>

            {/* Quick Actions */}
            {canManage && (
              <div>
              {/* <div className="bg-white border border-gray-200 rounded-lg p-6"> */}
                {/* <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm">
                    <Settings className="w-4 h-4 inline mr-2" />
                    Organization Settings
                  </button>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateBoardModal 
        isOpen={activeModal === 'board'}
        onClose={() => setActiveModal(null)}
        organizationId={organization.id}
      />
      
      <InviteMemberModal 
        isOpen={activeModal === 'invite'}
        onClose={() => setActiveModal(null)}
        organizationId={organization.id}
        organizationName={organization.name}
      />
    </div>
  )
}