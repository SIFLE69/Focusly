import { useState, useEffect } from 'react';
import { FileText, ArrowRight, Trash2, Loader, Clock, AlertTriangle, Plus } from 'lucide-react';
import dbService from '../services/database';
import aiService from '../services/ai';
import { CardSpotlight } from './ui/card-spotlight';
import { useModal } from '../context/ModalContext';
import { cn } from '../lib/utils';
import './NotesView.css';
import { LoaderOne } from './ui/loader';

function NotesView({ workspaceId, workspace, onRefresh }) {
    const [notes, setNotes] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [convertingNote, setConvertingNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showAlert, showConfirm } = useModal();

    useEffect(() => {
        loadNotes();
    }, [workspaceId]);

    const loadNotes = async () => {
        try {
            const allNotes = await dbService.getNotesByWorkspace(workspaceId);
            const activeNotes = allNotes.filter(n => n.status === 'active');
            setNotes(activeNotes);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load notes:', error);
            setLoading(false);
        }
    };

    const handleCreateNote = async () => {
        if (!newNoteContent.trim()) return;

        try {
            await dbService.createNote({
                workspaceId,
                content: newNoteContent,
                area: workspace.areas[0]?.id || 'general'
            });

            setNewNoteContent('');
            loadNotes();
            onRefresh();
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };

    const handleConvertToTask = async (note) => {
        setConvertingNote(note.id);

        try {
            const taskSuggestion = await aiService.convertNoteToTask(note, workspace);

            await dbService.createTask({
                ...taskSuggestion,
                workspaceId,
                dueDate: taskSuggestion.suggestedDate
            });

            await dbService.resolveNote(note.id, {
                type: 'converted_to_task',
                taskName: taskSuggestion.name
            });

            loadNotes();
            onRefresh();
        } catch (error) {
            console.error('Failed to convert note:', error);

            if (error.message === 'TIME_CAPACITY_EXCEEDED') {
                showAlert('Capacity Exceeded', 'Cannot schedule task - daily time capacity exceeded. Please choose a different date.', 'warning');
            }
        } finally {
            setConvertingNote(null);
        }
    };

    const handleDiscardNote = async (note) => {
        const confirmed = await showConfirm(
            'Discard Note?',
            'Are you sure you want to discard this note? This action cannot be undone.',
            'warning'
        );

        if (!confirmed) return;

        try {
            await dbService.resolveNote(note.id, {
                type: 'discarded',
                reason: 'Not actionable'
            });

            loadNotes();
            onRefresh();
        } catch (error) {
            console.error('Failed to discard note:', error);
        }
    };

    if (loading) {
        return <LoaderOne />;
    }

    return (
        <div className="notes-view animate-spring">
            <header className="view-header flex justify-between items-center">
                <div>
                    <h1>Notes</h1>
                    <p>Capture thoughts and convert to action.</p>
                </div>
            </header>

            {/* Note Creation - iOS Style */}
            <section className="note-create-section">
                <div className="flex flex-col gap-4">
                    <textarea
                        className="note-input w-full"
                        placeholder="New Note..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end">
                        <button
                            className="btn btn-primary btn-sm px-6"
                            onClick={handleCreateNote}
                            disabled={!newNoteContent.trim()}
                        >
                            <Plus size={14} />
                            Save Note
                        </button>
                    </div>
                </div>
            </section>

            {/* Active Notes - Apple Notes Grid */}
            <section className="notes-list-section">
                <h2>All Notes</h2>

                {notes.length === 0 ? (
                    <div className="empty-state card">
                        <FileText size={40} className="text-accent opacity-20" />
                        <p className="font-bold text-lg">No Notes</p>
                        <p className="text-secondary">Your inbox is clear.</p>
                    </div>
                ) : (
                    <div className="notes-grid">
                        {notes.map(note => {
                            const daysUntilExpiry = Math.ceil(
                                (new Date(note.expiresAt) - new Date()) / (24 * 60 * 60 * 1000)
                            );

                            return (
                                <CardSpotlight key={note.id} className="p-0 border-none bg-transparent">
                                    <div className="note-card">
                                        <div className="note-header">
                                            <span className={cn(
                                                "expiry-badge",
                                                daysUntilExpiry <= 2 ? 'text-error' :
                                                    daysUntilExpiry <= 4 ? 'text-warning' :
                                                        'text-success'
                                            )}>
                                                {daysUntilExpiry}d left
                                            </span>
                                            <span className="note-meta">
                                                {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="note-content">
                                            <p>{note.content}</p>
                                        </div>

                                        <div className="note-actions">
                                            <button
                                                className="btn btn-ghost btn-sm bg-white bg-opacity-5"
                                                onClick={() => handleConvertToTask(note)}
                                                disabled={convertingNote === note.id}
                                            >
                                                {convertingNote === note.id ? (
                                                    <Loader size={14} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <ArrowRight size={14} />
                                                        Task
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm text-error hover:bg-error hover:bg-opacity-10"
                                                onClick={() => handleDiscardNote(note)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </CardSpotlight>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

export default NotesView;
