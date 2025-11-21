'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { X } from 'lucide-react'

interface List {
  id: string
  title: string
  board_id: string
  position: number
}

interface Card {
  id: string
  title: string
  description?: string
  list_id: string
  board_id: string
  position: number
  is_complete?: boolean | null
  user_id?: string
}

interface CardActivity {
  id: string
  card_id: string
  action_type?: string | null
  description?: string | null
  details?: string | null
  metadata?: Record<string, any> | null
  created_at: string
  created_by?: string | null
  user_id?: string | null
  user_email?: string | null
}

interface Board {
  id: string
  name: string
  description?: string
  organization_id?: string
}

interface BoardClientProps {
  board: Board
  lists: List[]
  cards: Card[]
  currentUserId: string
}

export default function BoardClient({ board, lists: initialLists, cards: initialCards, currentUserId }: BoardClientProps) {
  const [lists, setLists] = useState<List[]>(initialLists)
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [newListName, setNewListName] = useState('')
  const [creatingList, setCreatingList] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [activeListForCard, setActiveListForCard] = useState<string | null>(null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [cardActivities, setCardActivities] = useState<CardActivity[]>([])
  const [cardActivitiesLoading, setCardActivitiesLoading] = useState(false)
  const [cardActivitiesError, setCardActivitiesError] = useState<string | null>(null)
  const [cardCompletionLoading, setCardCompletionLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const createList = async () => {
    if (!newListName.trim()) {
      setIsAddingList(false)
      return
    }
    
    setCreatingList(true)
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('lists')
        .select('position')
        .eq('board_id', board.id)

      if (fetchErr) throw fetchErr

      const nextPos = (existing && existing.length) ? Math.max(...existing.map((r: any) => r.position ?? 0)) + 1 : 0

      const { data: list, error } = await supabase
        .from('lists')
        .insert([{ title: newListName.trim(), board_id: board.id, position: nextPos }])
        .select()
        .single()
      if (error) throw error
      setLists(prev => [...prev, list])
      setNewListName('')
      setIsAddingList(false)
    } catch (err) {
      console.error('Error creating list', err)
      alert('Failed to create list')
    } finally {
      setCreatingList(false)
    }
  }

  const recordCardActivity = async (
    cardId: string, 
    actionType: string, 
    description: string, 
    details?: string
  ) => {
    try {
      const { error } = await supabase
        .from('card_activities')
        .insert([{
          card_id: cardId,
          action_type: actionType,
          description,
          details,
          created_by: currentUserId,
          user_id: currentUserId
        }])

      if (error) throw error
    } catch (err) {
      console.error('Error recording card activity', err)
    }
  }

  const createCard = async (listId: string) => {
    if (!newCardTitle.trim()) {
      setActiveListForCard(null)
      return
    }
    
    try {
      const { data: existingCards, error: fetchErr } = await supabase
        .from('cards')
        .select('position')
        .eq('list_id', listId)

      if (fetchErr) throw fetchErr

      const nextPos = (existingCards && existingCards.length) ? Math.max(...existingCards.map((c: any) => c.position ?? 0)) + 1 : 0
      const listTitle = lists.find(list => list.id === listId)?.title || 'Unknown List'

      const { data: card, error } = await supabase
        .from('cards')
        .insert([{
          title: newCardTitle.trim(),
          list_id: listId,
          board_id: board.id,
          position: nextPos,
          is_complete: false,
          user_id: currentUserId
        }])
        .select()
        .single()
      if (error) throw error
      
      setCards(prev => [...prev, card])
      setNewCardTitle('')
      setActiveListForCard(null)

      // Record card creation activity
      await recordCardActivity(
        card.id,
        'card_created',
        `Card created in list "${listTitle}"`,
        `Card "${newCardTitle.trim()}" was created in list "${listTitle}" at position ${nextPos + 1}.`
      )

    } catch (err) {
      console.error('Error creating card', err)
      alert('Failed to create card')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    if (type === 'list') {
      const reorderedLists = Array.from(lists)
      const [movedList] = reorderedLists.splice(source.index, 1)
      reorderedLists.splice(destination.index, 0, movedList)

      // Update positions
      const updatedLists = reorderedLists.map((list, index) => ({
        ...list,
        position: index
      }))

      setLists(updatedLists)

      // Update in database
      try {
        for (const list of updatedLists) {
          await supabase
            .from('lists')
            .update({ position: list.position })
            .eq('id', list.id)
        }
      } catch (err) {
        console.error('Error updating list positions', err)
      }
    }

    if (type === 'card') {
      const sourceListId = source.droppableId
      const destListId = destination.droppableId
      const sourceListTitle = lists.find(list => list.id === sourceListId)?.title || 'Unknown List'
      const destListTitle = lists.find(list => list.id === destListId)?.title || 'Unknown List'

      if (sourceListId === destListId) {
        // Same list reordering
        const listCards = cards.filter(card => card.list_id === sourceListId)
          .sort((a, b) => a.position - b.position)
        
        const reorderedCards = Array.from(listCards)
        const [movedCard] = reorderedCards.splice(source.index, 1)
        reorderedCards.splice(destination.index, 0, movedCard)

        // Update positions
        const updatedCards = reorderedCards.map((card, index) => ({
          ...card,
          position: index
        }))

        // Replace the cards for this list
        const otherCards = cards.filter(card => card.list_id !== sourceListId)
        setCards([...otherCards, ...updatedCards])

        // Update in database
        try {
          for (const card of updatedCards) {
            await supabase
              .from('cards')
              .update({ position: card.position })
              .eq('id', card.id)
          }

          // Record movement activity for same list
          await recordCardActivity(
            movedCard.id,
            'card_moved',
            `Card moved within list "${sourceListTitle}"`,
            `Card was moved from position ${source.index + 1} to position ${destination.index + 1} in list "${sourceListTitle}".`
          )

        } catch (err) {
          console.error('Error updating card positions', err)
        }
      } else {
        // Moving between lists
        const sourceCards = cards.filter(card => card.list_id === sourceListId)
          .sort((a, b) => a.position - b.position)
        const destCards = cards.filter(card => card.list_id === destListId)
          .sort((a, b) => a.position - b.position)

        const [movedCard] = sourceCards.splice(source.index, 1)
        movedCard.list_id = destListId
        destCards.splice(destination.index, 0, movedCard)

        // Update positions for both lists
        const updatedSourceCards = sourceCards.map((card, index) => ({
          ...card,
          position: index
        }))
        const updatedDestCards = destCards.map((card, index) => ({
          ...card,
          position: index
        }))

        const otherCards = cards.filter(
          card => card.list_id !== sourceListId && card.list_id !== destListId
        )
        setCards([...otherCards, ...updatedSourceCards, ...updatedDestCards])

        // Update in database
        try {
          for (const card of [...updatedSourceCards, ...updatedDestCards]) {
            await supabase
              .from('cards')
              .update({ 
                position: card.position,
                list_id: card.list_id
              })
              .eq('id', card.id)
          }

          // Record movement activity for between lists
          await recordCardActivity(
            movedCard.id,
            'card_moved',
            `Card moved from list "${sourceListTitle}" to list "${destListTitle}"`,
            `Card was moved from position ${source.index + 1} in list "${sourceListTitle}" to position ${destination.index + 1} in list "${destListTitle}".`
          )

        } catch (err) {
          console.error('Error updating card positions', err)
        }
      }
    }
  }

  const fetchCardActivities = async (cardId: string) => {
    setCardActivitiesLoading(true)
    setCardActivitiesError(null)
    try {
      const { data, error } = await supabase
        .from('card_activities')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Filter out old generic activities when we have new detailed ones
      const activities = (data || []).filter((activity, index, array) => {
        const activityTime = new Date(activity.created_at).getTime()
        
        // If this is an old generic activity (created, moved without details)
        if ((activity.action_type === 'created' || activity.action_type === 'moved') && 
            (!activity.details || activity.details === 'No additional details were provided.')) {
          
          // Check if there's a corresponding new detailed activity around the same time (±2 seconds)
          const hasDetailedVersion = array.some(a => {
            const otherTime = new Date(a.created_at).getTime()
            const timeDiff = Math.abs(activityTime - otherTime)
            
            return (
              timeDiff < 2000 && // Within 2 seconds
              ((activity.action_type === 'created' && a.action_type === 'card_created') ||
               (activity.action_type === 'moved' && a.action_type === 'card_moved'))
            )
          })
          
          // If there's a detailed version, filter out this generic one
          return !hasDetailedVersion
        }
        
        return true
      })

      const userIds = Array.from(
        new Set(
          activities
            .map((activity: CardActivity) => activity.created_by || activity.user_id || null)
            .filter((id): id is string => Boolean(id))
        )
      )

      let emailMap = new Map<string, string | null>()

      if (userIds.length) {
        const { data: emailData, error: emailError } = await supabase.rpc('get_member_emails', {
          user_ids: userIds
        })

        if (emailError) {
          console.error('Failed to fetch emails for activities', emailError)
        } else {
          emailData?.forEach((entry: { user_id: string; email: string | null }) => {
            emailMap.set(entry.user_id, entry.email)
          })
        }
      }

      const enrichedActivities = activities.map((activity) => ({
        ...activity,
        user_email: emailMap.get(activity.created_by || activity.user_id || '') || null
      }))

      setCardActivities(enrichedActivities)
    } catch (err) {
      console.error('Error loading card activities', err)
      setCardActivitiesError('Unable to load activities right now.')
    } finally {
      setCardActivitiesLoading(false)
    }
  }

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
    setIsCardModalOpen(true)
    setCardActivities([])
    fetchCardActivities(card.id)
  }

  const closeCardModal = () => {
    setIsCardModalOpen(false)
    setSelectedCard(null)
    setCardActivities([])
    setCardActivitiesError(null)
  }

  const toggleCardCompletion = async (card: Card) => {
    const nextStatus = !card.is_complete
    setCardCompletionLoading(true)
    try {
      // Update card completion status
      const { error: cardError } = await supabase
        .from('cards')
        .update({ is_complete: nextStatus })
        .eq('id', card.id)

      if (cardError) throw cardError

      // Update local state
      setCards(prev =>
        prev.map(c =>
          c.id === card.id ? { ...c, is_complete: nextStatus } : c
        )
      )

      if (selectedCard && selectedCard.id === card.id) {
        setSelectedCard(prev => prev ? { ...prev, is_complete: nextStatus } : prev)
      }

      // Add card activity
      const actionType = nextStatus ? 'marked_complete' : 'marked_incomplete'
      const { error: activityError } = await supabase
        .from('card_activities')
        .insert([{
          card_id: card.id,
          action_type: actionType,
          description: `Card ${nextStatus ? 'marked as complete' : 'marked as incomplete'}`,
          details: `Card was ${nextStatus ? 'completed' : 'marked as incomplete'} by user.`,
          created_by: currentUserId,
          user_id: currentUserId
        }])

      if (activityError) throw activityError

      if (selectedCard && selectedCard.id === card.id) {
        fetchCardActivities(card.id)
      }

    } catch (err) {
      console.error('Failed to update card completion status', err)
      alert('Unable to update card status. Please try again.')
    } finally {
      setCardCompletionLoading(false)
    }
  }

  const renderActivityHeadline = (activity: CardActivity) => {
    if (activity.action_type) {
      return activity.action_type.replace(/[_-]/g, ' ')
    }
    return 'Activity'
  }

  const renderActivityDetails = (activity: CardActivity) => {
    if (activity.details) return activity.details
    if (activity.description) return activity.description
    return 'No additional details were provided.'
  }

  const formatActivityTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return timestamp
    return date.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{board.name}</h1>
            {board.description && (
              <p className="text-sm text-gray-600 mt-1">{board.description}</p>
            )}
          </div>
          <button 
            onClick={() => router.push(`/organization/${board.organization_id}`)}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Back to Organization
          </button>
        </div>

        {/* Lists Container */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="list" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex items-start gap-4 overflow-x-auto pb-4"
              >
                {lists.map((list, index) => {
                  const listCards = cards
                    .filter(card => card.list_id === list.id)
                    .sort((a, b) => a.position - b.position)
                  
                  return (
                    <Draggable key={list.id} draggableId={list.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`min-w-[272px] bg-gray-100 rounded-lg shadow-sm ${
                            snapshot.isDragging ? 'rotate-6 shadow-lg' : ''
                          } transition-all duration-200`}
                        >
                          {/* List Header */}
                          <div
                            {...provided.dragHandleProps}
                            className="p-3 cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-800 text-sm px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                                {list.title}
                              </h3>
                              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                {listCards.length}
                              </span>
                            </div>
                          </div>

                          {/* Cards Container */}
                          <Droppable droppableId={list.id} type="card">
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="p-2 min-h-[10px] space-y-2"
                              >
                                {listCards.map((card, index) => (
                                  <Draggable
                                    key={card.id}
                                    draggableId={card.id}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white rounded shadow-sm p-3 cursor-pointer border border-transparent hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
                                          snapshot.isDragging ? 'shadow-lg rotate-3' : ''
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {/* Circular Checkbox */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleCardCompletion(card)
                                            }}
                                            disabled={cardCompletionLoading}
                                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-colors ${
                                              card.is_complete 
                                                ? 'bg-green-500 border-green-500' 
                                                : 'border-gray-400 hover:border-gray-600'
                                            } ${cardCompletionLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            aria-label={card.is_complete ? 'Mark incomplete' : 'Mark complete'}
                                          />
                                          <div 
                                            className="flex-1"
                                            onClick={() => handleCardClick(card)}
                                          >
                                            <div className="font-medium text-gray-800 text-sm mb-1">
                                              {card.title}
                                            </div>
                                            {card.description && (
                                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {card.description}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}

                                {/* Add Card Section */}
                                {activeListForCard === list.id ? (
                                  <div className="p-2 bg-white rounded shadow-sm">
                                    <textarea
                                      value={newCardTitle}
                                      onChange={(e) => setNewCardTitle(e.target.value)}
                                      placeholder="Enter a title for this card..."
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:border-blue-500"
                                      rows={3}
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        onClick={() => createCard(list.id)}
                                        className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 transition-colors"
                                      >
                                        Add Card
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveListForCard(null)
                                          setNewCardTitle('')
                                        }}
                                        className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setActiveListForCard(list.id)}
                                    className="w-full text-left text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded p-2 text-sm transition-colors flex items-center gap-2"
                                  >
                                    <span>+</span>
                                    Add a card
                                  </button>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}

                {/* Add List Button */}
                <div className="min-w-[272px]">
                  {isAddingList ? (
                    <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                      <input
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter list title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={createList}
                          disabled={creatingList}
                          className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {creatingList ? 'Adding...' : 'Add List'}
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingList(false)
                            setNewListName('')
                          }}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingList(true)}
                      className="min-w-[272px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-4 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <span>+</span>
                      Add another list
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {isCardModalOpen && selectedCard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex items-start gap-3">
                {/* Circular Checkbox in Modal */}
                <button
                  onClick={toggleCardCompletion.bind(null, selectedCard)}
                  disabled={cardCompletionLoading}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mt-1 transition-colors ${
                    selectedCard.is_complete 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-400 hover:border-gray-600'
                  } ${cardCompletionLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  aria-label={selectedCard.is_complete ? 'Mark incomplete' : 'Mark complete'}
                />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Card</p>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedCard.title}</h2>
                  {selectedCard.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedCard.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={closeCardModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close card details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 pt-4 flex-1 flex flex-col gap-6 overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedCard.is_complete ? 'Complete' : 'In Progress'}
                  </p>
                </div>
                <button
                  onClick={toggleCardCompletion.bind(null, selectedCard)}
                  disabled={cardCompletionLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedCard.is_complete
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } disabled:opacity-60`}
                >
                  {cardCompletionLoading
                    ? 'Updating...'
                    : selectedCard.is_complete
                      ? 'Mark Incomplete'
                      : 'Mark Complete'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800">Activity</h3>
                <button
                  onClick={() => selectedCard && fetchCardActivities(selectedCard.id)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={cardActivitiesLoading}
                >
                  {cardActivitiesLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {cardActivitiesLoading && cardActivities.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-6">Loading activity...</div>
                ) : cardActivitiesError ? (
                  <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg p-4">
                    {cardActivitiesError}
                  </div>
                ) : cardActivities.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-6">
                    No activity recorded for this card yet.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {cardActivities.map((activity) => (
                      <li
                        key={activity.id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {renderActivityHeadline(activity)}
                          </p>
                          <p className="text-sm text-gray-800">
                            {renderActivityDetails(activity)}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100">
                          <span>
                            {activity.user_email
                              ? `By ${activity.user_email}`
                              : 'By Unknown'}
                          </span>
                          <span>{formatActivityTimestamp(activity.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={closeCardModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}