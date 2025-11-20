'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Plus, Users, Settings, Share2, LogOut } from 'lucide-react'
import CreateOrganizationModal from './CreateOrganizationModal'
import CreateBoardModal from './CreateBoardModal'
import InviteMemberModal from './InviteMemberModal'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  description?: string
  created_at: string
  role: string
  boards_count: number
}

interface Board {
  id: string
  name: string
  description?: string
  created_at: string
  organization_id: string
}

interface DashboardClientProps {
  user: User
  organizations: Organization[]
  recentBoards?: Board[]
}

export default function DashboardClient({ user, organizations, recentBoards = [] }: DashboardClientProps) {
  const [activeModal, setActiveModal] = useState<'organization' | 'board' | 'invite' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Granula</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveModal('invite')}
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span className="text-gray-700">Invite Members</span>
              </button>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button 
                    onClick={() => setActiveModal('organization')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-t-lg border-b border-gray-100"
                  >
                    New Organization
                  </button>
                  <button 
                    onClick={() => setActiveModal('board')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-lg"
                  >
                    New Board
                  </button>
                </div>
              </div>

              <div className="relative group">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer">
                  <span className="text-sm font-medium text-gray-600">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-lg flex items-center space-x-2 text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Organizations Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
              <p className="text-gray-600 mt-2">Manage your teams and workspaces</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((organization) => (
              <Link
                href={`/organization/${organization.id}`}
                key={organization.id} 
                className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group block"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {organization.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {organization.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {organization.description || 'No description provided'}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {organization.role}
                    </span>
                    <span className="text-sm text-gray-500">
                      {organization.boards_count} board{organization.boards_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {organizations.length === 0 && (
              <div 
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer group"
                onClick={() => setActiveModal('organization')}
              >
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Organization</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Start a new team workspace
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Recent Boards Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Boards</h2>
              <p className="text-gray-600 mt-2">Quick access to your recent projects</p>
            </div>
          </div>

          {recentBoards && recentBoards.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentBoards.map((board) => (
                <Link
                  key={board.id}
                  href={`/board/${board.id}`}
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="h-20 bg-blue-500 rounded-t-lg"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {board.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {board.description || 'No description'}
                    </p>
                  </div>
                </Link>
              ))}

              {/* Create New Board Card */}
              <div 
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer group"
                onClick={() => setActiveModal('board')}
              >
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Board</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Start a new project
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No organizations yet
                  </h3>
                  <p className="text-gray-600">
                    Create your first organization to start organizing tasks and collaborating with your team.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveModal('organization')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Your First Organization
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <CreateOrganizationModal 
        isOpen={activeModal === 'organization'}
        onClose={() => setActiveModal(null)}
      />
      
      <CreateBoardModal 
        isOpen={activeModal === 'board'}
        onClose={() => setActiveModal(null)}
        organizations={organizations}
      />
      
      <InviteMemberModal 
        isOpen={activeModal === 'invite'}
        onClose={() => setActiveModal(null)}
        organizations={organizations}
      />
    </div>
  )
}