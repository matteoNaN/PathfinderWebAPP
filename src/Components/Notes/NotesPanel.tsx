import React, { useState, useEffect } from 'react';
import './NotesPanel.css';

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  color: string;
  isPinned: boolean;
}

const NotesPanel: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#ffd93d' });

  const noteColors = [
    '#ffd93d', // Yellow
    '#6bcf7f', // Green  
    '#4d9de0', // Blue
    '#e15554', // Red
    '#f28482', // Pink
    '#c77dff', // Purple
    '#ffa726', // Orange
    '#81c784'  // Light Green
  ];

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('dnd-combat-notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.warn('Failed to load notes:', error);
      }
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('dnd-combat-notes', JSON.stringify(notes));
  }, [notes]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddNote = () => {
    if (!newNote.title.trim()) return;

    const note: Note = {
      id: generateId(),
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      timestamp: Date.now(),
      color: newNote.color,
      isPinned: false
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: '', content: '', color: '#ffd93d' });
    setShowAddForm(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote({ ...note });
  };

  const handleSaveEdit = () => {
    if (!editingNote || !editingNote.title.trim()) return;

    setNotes(prev => prev.map(note => 
      note.id === editingNote.id ? editingNote : note
    ));
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa nota?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

  const handleTogglePin = (noteId: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    ));
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  });

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('it-IT', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className={`notes-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Toggle Button */}
      <button 
        className="notes-toggle" 
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Chiudi note' : 'Apri note'}
      >
        📝 {notes.length > 0 && <span className="note-count">{notes.length}</span>}
      </button>

      {/* Notes Content */}
      {isExpanded && (
        <div className="notes-content">
          <div className="notes-header">
            <h3>📝 Note di Sessione</h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-small btn-primary"
            >
              ➕ Nuova Nota
            </button>
          </div>

          {/* Add Note Form */}
          {showAddForm && (
            <div className="note-form">
              <input
                type="text"
                placeholder="Titolo della nota..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="note-title-input"
                autoFocus
              />
              <textarea
                placeholder="Contenuto della nota..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                className="note-content-input"
                rows={3}
              />
              <div className="note-form-controls">
                <div className="color-picker">
                  {noteColors.map(color => (
                    <button
                      key={color}
                      className={`color-option ${newNote.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewNote(prev => ({ ...prev, color }))}
                      title={`Seleziona colore`}
                    />
                  ))}
                </div>
                <div className="form-actions">
                  <button onClick={handleAddNote} className="btn btn-small btn-primary">
                    Salva
                  </button>
                  <button 
                    onClick={() => setShowAddForm(false)} 
                    className="btn btn-small btn-secondary"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="notes-list">
            {sortedNotes.length === 0 ? (
              <div className="no-notes">
                <p>📋 Nessuna nota ancora...</p>
                <small>Clicca "Nuova Nota" per iniziare!</small>
              </div>
            ) : (
              sortedNotes.map(note => (
                <div key={note.id} className={`note-item ${note.isPinned ? 'pinned' : ''}`} style={{ backgroundColor: note.color }}>
                  {editingNote && editingNote.id === note.id ? (
                    // Edit Mode
                    <div className="note-edit">
                      <input
                        type="text"
                        value={editingNote.title}
                        onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                        className="note-title-input"
                      />
                      <textarea
                        value={editingNote.content}
                        onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                        className="note-content-input"
                        rows={3}
                      />
                      <div className="note-edit-actions">
                        <button onClick={handleSaveEdit} className="btn btn-tiny btn-primary">Salva</button>
                        <button onClick={() => setEditingNote(null)} className="btn btn-tiny btn-secondary">Annulla</button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="note-header">
                        <h4 className="note-title">
                          {note.isPinned && <span className="pin-icon">📌</span>}
                          {note.title}
                        </h4>
                        <div className="note-actions">
                          <button 
                            onClick={() => handleTogglePin(note.id)}
                            className="btn btn-tiny"
                            title={note.isPinned ? 'Rimuovi pin' : 'Aggiungi pin'}
                          >
                            {note.isPinned ? '📌' : '📍'}
                          </button>
                          <button 
                            onClick={() => handleEditNote(note)}
                            className="btn btn-tiny"
                            title="Modifica nota"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteNote(note.id)}
                            className="btn btn-tiny btn-danger"
                            title="Elimina nota"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {note.content && (
                        <div className="note-content">
                          {note.content.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      )}
                      <div className="note-timestamp">
                        {formatDate(note.timestamp)}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;