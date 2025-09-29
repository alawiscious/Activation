import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  User,
  Calendar,
  Tag,
  Lock,
  Globe,
  Loader2
} from 'lucide-react'
import { 
  enhancedGenomeApiService, 
  type GenomeNote, 
  type CreateNoteParams, 
  type UpdateNoteParams 
} from '@/lib/enhancedGenomeApi'

interface GenomeNoteManagerProps {
  clientId: number
  clientName: string
  className?: string
}

export function GenomeNoteManager({ clientId, clientName, className }: GenomeNoteManagerProps) {
  const [notes, setNotes] = useState<GenomeNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<number | null>(null)
  const [newNote, setNewNote] = useState('')
  const [newNoteTags, setNewNoteTags] = useState<string[]>([])
  const [newNotePrivate, setNewNotePrivate] = useState(false)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [editingNoteTags, setEditingNoteTags] = useState<string[]>([])
  const [editingNotePrivate, setEditingNotePrivate] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [clientId])

  const loadNotes = async () => {
    setLoading(true)
    setError(null)

    try {
      const clientNotes = await enhancedGenomeApiService.getClientNotes(clientId)
      setNotes(clientNotes)
    } catch (err) {
      setError('Failed to load notes')
      console.error('Load notes error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newNote.trim()) return

    setLoading(true)
    setError(null)

    try {
      const noteParams: CreateNoteParams = {
        note: newNote.trim(),
        explicit_tag: newNoteTags.length > 0 ? newNoteTags : undefined,
        is_private: newNotePrivate
      }

      const createdNote = await enhancedGenomeApiService.createClientNote(clientId, noteParams)
      setNotes(prev => [createdNote, ...prev])
      setNewNote('')
      setNewNoteTags([])
      setNewNotePrivate(false)
    } catch (err) {
      setError('Failed to create note')
      console.error('Create note error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNote = async (noteId: number) => {
    if (!editingNoteText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const noteParams: UpdateNoteParams = {
        note: editingNoteText.trim(),
        explicit_tag: editingNoteTags.length > 0 ? editingNoteTags : undefined,
        is_private: editingNotePrivate
      }

      const updatedNote = await enhancedGenomeApiService.updateClientNote(clientId, noteId, noteParams)
      setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note))
      setEditingNote(null)
      setEditingNoteText('')
      setEditingNoteTags([])
      setEditingNotePrivate(false)
    } catch (err) {
      setError('Failed to update note')
      console.error('Update note error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    setLoading(true)
    setError(null)

    try {
      await enhancedGenomeApiService.deleteClientNote(clientId, noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (err) {
      setError('Failed to delete note')
      console.error('Delete note error:', err)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (note: GenomeNote) => {
    setEditingNote(note.id)
    setEditingNoteText(note.note)
    setEditingNoteTags(note.explicit_tags.map(tag => tag.name))
    setEditingNotePrivate(note.is_private)
  }

  const cancelEditing = () => {
    setEditingNote(null)
    setEditingNoteText('')
    setEditingNoteTags([])
    setEditingNotePrivate(false)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const addTag = (tags: string[], setTags: (tags: string[]) => void, newTag: string) => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
    }
  }

  const removeTag = (tags: string[], setTags: (tags: string[]) => void, tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes for {clientName}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Manage notes, tags, and private/public settings for this client
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Create New Note */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">Create New Note</h4>
            
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
              />
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTag(newNoteTags, setNewNoteTags, e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add tag..."]') as HTMLInputElement
                    if (input?.value) {
                      addTag(newNoteTags, setNewNoteTags, input.value)
                      input.value = ''
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {newNoteTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {newNoteTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                      <button
                        onClick={() => removeTag(newNoteTags, setNewNoteTags, tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newNotePrivate}
                    onChange={(e) => setNewNotePrivate(e.target.checked)}
                    className="rounded"
                  />
                  Private note
                </label>
                
                <Button
                  onClick={handleCreateNote}
                  disabled={loading || !newNote.trim()}
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Create Note
                </Button>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Existing Notes ({notes.length})</h4>
            
            {loading && notes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No notes found for this client
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg">
                    {editingNote === note.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full p-2 border rounded resize-none"
                          rows={3}
                        />
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add tag..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTag(editingNoteTags, setEditingNoteTags, e.currentTarget.value)
                                e.currentTarget.value = ''
                              }
                            }}
                            className="flex-1"
                          />
                        </div>
                        
                        {editingNoteTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {editingNoteTags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                                <button
                                  onClick={() => removeTag(editingNoteTags, setEditingNoteTags, tag)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editingNotePrivate}
                              onChange={(e) => setEditingNotePrivate(e.target.checked)}
                              className="rounded"
                            />
                            Private note
                          </label>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={loading}
                              size="sm"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              onClick={cancelEditing}
                              disabled={loading}
                              size="sm"
                              variant="outline"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-sm flex-1">{note.note}</p>
                          <div className="flex gap-1 ml-2">
                            <Button
                              onClick={() => startEditing(note)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteNote(note.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {note.user_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(note.creation_datetime)}
                          </div>
                          <div className="flex items-center gap-1">
                            {note.is_private ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Globe className="h-3 w-3" />
                            )}
                            {note.is_private ? 'Private' : 'Public'}
                          </div>
                        </div>
                        
                        {note.explicit_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {note.explicit_tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
