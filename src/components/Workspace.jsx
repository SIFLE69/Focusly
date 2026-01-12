import { useState, useEffect } from 'react';
import {
    Target, FileText, CheckSquare, Zap, BarChart3,
    Clock, TrendingUp, CheckCircle2, AlertCircle,
    Moon, Sun, Search, Plus, Settings
} from 'lucide-react';
import dbService from '../services/database';
import aiService from '../services/ai';
import NotesView from './NotesView';
import TasksView from './TasksView';
import FocusMode from './FocusMode';
import WeeklyReview from './WeeklyReview';
import DailySummary from './DailySummary';
import SettingsView from './SettingsView';
import { CardSpotlight } from './ui/card-spotlight';
import { FloatingDock } from './ui/floating-dock';
import { LoaderOne } from './ui/loader';
import { cn } from '../lib/utils';
import './Workspace.css';

function Workspace({ workspaceId }) {
    const [workspace, setWorkspace] = useState(null);
    const [allWorkspaces, setAllWorkspaces] = useState([]);
    const [currentView, setCurrentView] = useState('today');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ tasks: [], notes: [] });

    useEffect(() => {
        loadWorkspace();
    }, [workspaceId]);

    const loadWorkspace = async () => {
        try {
            const ws = await dbService.get('workspaces', workspaceId);
            setWorkspace(ws);

            const allWs = await dbService.getAll('workspaces');
            setAllWorkspaces(allWs);

            const weeklyStats = await dbService.getWeeklyStats(workspaceId);
            setStats(weeklyStats);

            setLoading(false);
        } catch (error) {
            console.error('Failed to load workspace:', error);
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults({ tasks: [], notes: [] });
            return;
        }

        const tasks = await dbService.getTasksByWorkspace(workspaceId);
        const notes = await dbService.getNotesByWorkspace(workspaceId);

        const filteredTasks = tasks.filter(t =>
            t.name.toLowerCase().includes(query.toLowerCase()) ||
            t.description?.toLowerCase().includes(query.toLowerCase())
        );

        const filteredNotes = notes.filter(n =>
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            n.content.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults({ tasks: filteredTasks, notes: filteredNotes });
    };

    const refreshData = () => {
        loadWorkspace();
    };

    if (loading) {
        return <LoaderOne />;
    }

    if (!workspace) {
        return (
            <div className="workspace-error">
                <AlertCircle size={48} className="text-error" />
                <p>Workspace not found</p>
            </div>
        );
    }

    const navItems = [
        { id: 'today', label: 'Today', icon: Target },
        { id: 'notes', label: 'Notes', icon: FileText, badge: 'Action Required' },
        { id: 'tasks', label: 'Execution Plan', icon: CheckSquare },
        { id: 'focus', label: 'Focus Mode', icon: Zap },
        { id: 'review', label: 'Weekly Review', icon: BarChart3 },
        { id: 'summary', label: 'Daily Summary', icon: CheckCircle2 },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div className="workspace">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-small">
                        <div className="logo-icon-small">
                            <Zap size={16} fill="white" />
                        </div>
                        <span>Focusly</span>
                    </div>
                    <button className="search-trigger" onClick={() => setShowSearch(true)}>
                        <Search size={16} />
                    </button>
                </div>

                <div className="workspace-switcher">
                    <select
                        value={workspaceId}
                        onChange={(e) => window.location.href = `?workspace=${e.target.value}`}
                        className="ws-select"
                    >
                        {allWorkspaces.map(ws => (
                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                        ))}
                    </select>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={cn(
                                    'nav-item',
                                    currentView === item.id && 'nav-item-active'
                                )}
                                onClick={() => setCurrentView(item.id)}
                            >
                                <Icon size={18} strokeWidth={currentView === item.id ? 2.5 : 2} />
                                <span>{item.label}</span>
                                {item.badge && currentView !== item.id && (
                                    <span className="nav-badge badge">
                                        {item.badge === 'Action Required' ? '!' : item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-stats">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">Velocity</span>
                        </div>
                        <div className="stat-value">
                            {stats?.totalCompleted || 0}
                            <span className="text-xs text-secondary font-normal ml-2">tasks done</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${stats?.completionRate || 0}%` }}
                            />
                        </div>
                    </div>

                    {stats?.streak > 0 && (
                        <div className="streak-card mt-4">
                            <div className="streak-icon">🔥</div>
                            <div className="streak-info">
                                <div className="streak-value">{stats.streak} Day Streak</div>
                                <div className="streak-label">Keep it going!</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <div className="workspace-info">
                        <div className="workspace-role">
                            <TrendingUp size={12} />
                            <span>{workspace.role}</span>
                        </div>
                        <div className="workspace-name">
                            {workspace.name}
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                {currentView === 'today' && (
                    <TodayView workspaceId={workspaceId} workspace={workspace} onRefresh={refreshData} />
                )}
                {currentView === 'notes' && (
                    <NotesView workspaceId={workspaceId} workspace={workspace} onRefresh={refreshData} />
                )}
                {currentView === 'tasks' && (
                    <TasksView workspaceId={workspaceId} workspace={workspace} onRefresh={refreshData} />
                )}
                {currentView === 'focus' && (
                    <FocusMode workspaceId={workspaceId} workspace={workspace} onRefresh={refreshData} />
                )}
                {currentView === 'review' && (
                    <WeeklyReview workspaceId={workspaceId} workspace={workspace} onRefresh={refreshData} />
                )}
                {currentView === 'summary' && (
                    <DailySummary workspaceId={workspaceId} onComplete={() => setCurrentView('today')} />
                )}
                {currentView === 'settings' && (
                    <SettingsView workspaceId={workspaceId} workspace={workspace} onRefresh={refreshData} />
                )}
            </main>

            {/* Global Search Overlay */}
            {showSearch && (
                <div className="search-overlay" onClick={() => setShowSearch(false)}>
                    <div className="search-modal" onClick={e => e.stopPropagation()}>
                        <div className="search-input-container">
                            <Search size={20} className="text-secondary" />
                            <input
                                type="text"
                                placeholder="Search tasks, notes, or plans..."
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <button className="close-search" onClick={() => setShowSearch(false)}>ESC</button>
                        </div>

                        <div className="search-results">
                            {searchQuery && (
                                <>
                                    {searchResults.tasks.length > 0 && (
                                        <div className="result-group">
                                            <h4>Tasks</h4>
                                            {searchResults.tasks.map(task => (
                                                <div key={task.id} className="result-item" onClick={() => { setCurrentView('tasks'); setShowSearch(false); }}>
                                                    <CheckSquare size={14} />
                                                    <span>{task.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchResults.notes.length > 0 && (
                                        <div className="result-group">
                                            <h4>Notes</h4>
                                            {searchResults.notes.map(note => (
                                                <div key={note.id} className="result-item" onClick={() => { setCurrentView('notes'); setShowSearch(false); }}>
                                                    <FileText size={14} />
                                                    <span>{note.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchResults.tasks.length === 0 && searchResults.notes.length === 0 && (
                                        <div className="search-empty">No results found for "{searchQuery}"</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mobile-nav-dock">
                <FloatingDock
                    items={navItems.map(item => ({
                        title: item.label,
                        icon: <item.icon className="h-full w-full text-neutral-300" />,
                        onClick: () => setCurrentView(item.id)
                    }))}
                />
            </div>
        </div>
    );
}

// Today View Component
function TodayView({ workspaceId, workspace, onRefresh }) {
    const [todayTasks, setTodayTasks] = useState([]);
    const [capacity, setCapacity] = useState(null);
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTodayData();
    }, [workspaceId]);

    const loadTodayData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            const tasks = await dbService.getTodayTasks(workspaceId);
            setTodayTasks(tasks);

            const cap = await dbService.getTimeCapacity(workspaceId, today);
            setCapacity(cap || {
                allocated: 0,
                limit: workspace.dailyTimeLimit
            });

            const aiSuggestions = await aiService.suggestDailyFocus(workspaceId);
            setSuggestions(aiSuggestions);

            setLoading(false);
        } catch (error) {
            console.error('Failed to load today data:', error);
            setLoading(false);
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await dbService.completeTask(taskId);
            loadTodayData();
            onRefresh();
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    if (loading) {
        return <LoaderOne />;
    }

    const pendingTasks = todayTasks.filter(t => t.status === 'pending');
    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    const utilizationPercent = (capacity.allocated / capacity.limit) * 100;

    return (
        <div className="today-view animate-spring">
            <header className="view-header">
                <div>
                    <h1>Today</h1>
                    <p>
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </header>

            {/* First Day Checklist */}
            {todayTasks.length === 0 && (
                <div className="first-day-checklist card mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-accent mb-4">First Day Checklist</h3>
                    <div className="checklist-items">
                        <div className="checklist-item">
                            <CheckCircle2 size={16} className="text-secondary opacity-30" />
                            <span>Capture your first thought in <b>Notes</b></span>
                        </div>
                        <div className="checklist-item">
                            <CheckCircle2 size={16} className="text-secondary opacity-30" />
                            <span>Convert a note into an <b>Execution Task</b></span>
                        </div>
                        <div className="checklist-item">
                            <CheckCircle2 size={16} className="text-secondary opacity-30" />
                            <span>Complete a 25-min <b>Focus Session</b></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Capacity Indicator - Subtle Widget Style */}
            <div className="capacity-card">
                <div className="capacity-header">
                    <div className="capacity-title">
                        <Clock size={16} className="text-accent" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary">Time Capacity</h3>
                    </div>
                    <span className={cn(
                        "text-lg font-bold",
                        utilizationPercent > 100 ? 'text-error' :
                            utilizationPercent > 80 ? 'text-warning' :
                                'text-success'
                    )}>
                        {Math.round(capacity.allocated)} / {capacity.limit} min
                    </span>
                </div>
                <div className="progress-bar" style={{ marginTop: '12px', height: '4px' }}>
                    <div
                        className="progress-fill"
                        style={{
                            width: `${Math.min(utilizationPercent, 100)}%`,
                            background: utilizationPercent > 100 ? 'var(--color-error)' : 'var(--color-accent)'
                        }}
                    />
                </div>
            </div>

            {/* AI Suggestions - Subtle Card */}
            {suggestions && suggestions.suggestions.length > 0 && (
                <div className="card mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                        <Zap size={14} fill="currentColor" />
                        AI Insights
                    </h3>
                    <div className="flex flex-col gap-3">
                        {suggestions.suggestions.map((suggestion, idx) => (
                            <p key={idx} className="text-sm text-secondary m-0 leading-relaxed">
                                {suggestion}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Tasks - iOS List Style */}
            <section className="tasks-section">
                <h2>Tasks</h2>
                {pendingTasks.length === 0 ? (
                    <div className="empty-state card">
                        <CheckCircle2 size={40} className="text-success opacity-30" />
                        <p className="font-bold text-lg">All caught up</p>
                        <p className="text-secondary">Your execution plan for today is complete.</p>
                    </div>
                ) : (
                    <div className="tasks-list">
                        {pendingTasks.map(task => (
                            <CardSpotlight key={task.id} className="p-0 border-none bg-transparent">
                                <div className="task-card">
                                    <div className="task-main">
                                        <button
                                            className="task-checkbox"
                                            onClick={() => handleCompleteTask(task.id)}
                                        >
                                            <CircleIcon size={22} />
                                        </button>
                                        <div className="task-content">
                                            <h4>{task.name}</h4>
                                            {task.description && (
                                                <p className="text-secondary text-sm m-0">{task.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="task-footer">
                                        <div className="task-meta">
                                            <span className={cn("text-xs font-bold uppercase tracking-tighter", `text-${task.priority}`)}>
                                                {task.priority}
                                            </span>
                                            <span className="task-duration text-xs text-secondary">
                                                <Clock size={10} />
                                                {task.estimatedDuration}m
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardSpotlight>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <section className="completed-section">
                    <h3 className="text-secondary text-sm font-bold uppercase tracking-widest">Completed</h3>
                    <div className="tasks-list opacity-60">
                        {completedTasks.map(task => (
                            <div key={task.id} className="task-card">
                                <div className="task-main">
                                    <CheckCircle2 size={22} className="text-success" />
                                    <div className="task-content">
                                        <h4 className="line-through text-secondary">{task.name}</h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// Custom Circle Icon for Apple-style checkboxes
function CircleIcon({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
}

export default Workspace;
