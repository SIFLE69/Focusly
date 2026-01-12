import { useState, useEffect } from 'react';
import {
    Plus, Filter, Calendar, Clock, CheckCircle2,
    Circle, AlertCircle, RefreshCw, ChevronDown,
    MoreHorizontal
} from 'lucide-react';
import dbService from '../services/database';
import { CardSpotlight } from './ui/card-spotlight';
import { useModal } from '../context/ModalContext';
import { cn } from '../lib/utils';
import './TasksView.css';

import { LoaderOne } from './ui/loader';

function TasksView({ workspaceId, workspace, onRefresh }) {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
        name: '',
        description: '',
        estimatedDuration: 60,
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        recurrence: null,
        dependencies: []
    });
    const [loading, setLoading] = useState(true);
    const { showAlert } = useModal();

    useEffect(() => {
        loadTasks();
    }, [workspaceId]);

    const loadTasks = async () => {
        try {
            const allTasks = await dbService.getTasksByWorkspace(workspaceId);
            setTasks(allTasks);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load tasks:', error);
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.name.trim()) {
            showAlert('Input Required', 'Please enter a task name to continue.', 'warning');
            return;
        }

        try {
            await dbService.createTask({
                ...newTask,
                workspaceId
            });

            setNewTask({
                name: '',
                description: '',
                estimatedDuration: 60,
                priority: 'medium',
                dueDate: new Date().toISOString().split('T')[0],
                recurrence: null,
                dependencies: []
            });

            setShowAddTask(false);
            loadTasks();
            onRefresh();
        } catch (error) {
            console.error('Failed to create task:', error);

            if (error.message === 'TIME_CAPACITY_EXCEEDED') {
                showAlert('Capacity Exceeded', 'Cannot schedule task - daily time capacity exceeded on this date. Please choose another date or reduce task duration.', 'warning');
            } else {
                showAlert('Error', 'Failed to create task. Please try again.', 'error');
            }
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await dbService.completeTask(taskId);
            loadTasks();
            onRefresh();
        } catch (error) {
            console.error('Failed to complete task:', error);
            showAlert('Error', 'Failed to complete task.', 'error');
        }
    };

    const handleRescheduleTask = async (task) => {
        const newDate = prompt('Enter new date (YYYY-MM-DD):', task.dueDate);
        if (!newDate) return;

        try {
            await dbService.rescheduleTask(task.id, newDate);
            loadTasks();
            onRefresh();
        } catch (error) {
            console.error('Failed to reschedule task:', error);
            showAlert('Reschedule Failed', error.message, 'error');
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'pending') return task.status === 'pending';
        if (filter === 'completed') return task.status === 'completed';
        return true;
    });

    const groupedTasks = filteredTasks.reduce((acc, task) => {
        const date = task.dueDate || 'No date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedTasks).sort();

    if (loading) {
        return <LoaderOne />;
    }

    return (
        <div className="tasks-view animate-spring">
            <header className="view-header flex justify-between items-center">
                <div className="header-content">
                    <h1>Execution</h1>
                    <p>Manage your time-bound commitments.</p>
                </div>
                <button
                    className={cn("btn btn-primary", showAddTask && "bg-opacity-20 text-white")}
                    onClick={() => setShowAddTask(!showAddTask)}
                >
                    {showAddTask ? 'Cancel' : (
                        <>
                            <Plus size={18} />
                            New Task
                        </>
                    )}
                </button>
            </header>

            {/* Add Task Form - iOS Style */}
            {showAddTask && (
                <section className="add-task-section">
                    <div className="task-form">
                        <div className="form-group">
                            <label className="form-label">Task Name</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="What needs to be done?"
                                value={newTask.name}
                                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="input"
                                placeholder="Details..."
                                rows={2}
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Duration</label>
                                <div className="input-with-icon">
                                    <Clock size={14} className="input-icon" />
                                    <input
                                        type="number"
                                        className="input"
                                        value={newTask.estimatedDuration}
                                        onChange={(e) => setNewTask({ ...newTask, estimatedDuration: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    className="select"
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <div className="input-with-icon">
                                    <Calendar size={14} className="input-icon" />
                                    <input
                                        type="date"
                                        className="input"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Recurrence</label>
                                <select
                                    className="select"
                                    value={newTask.recurrence?.frequency || 'none'}
                                    onChange={(e) => {
                                        const freq = e.target.value;
                                        setNewTask({
                                            ...newTask,
                                            recurrence: freq === 'none' ? null : { frequency: freq, interval: 1 }
                                        });
                                    }}
                                >
                                    <option value="none">None</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Dependencies</label>
                                <select
                                    className="select"
                                    multiple
                                    value={newTask.dependencies}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions, option => option.value);
                                        setNewTask({ ...newTask, dependencies: values });
                                    }}
                                >
                                    {tasks.filter(t => t.status === 'pending').map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-secondary mt-1">Hold Ctrl/Cmd to select multiple</p>
                            </div>
                        </div>

                        <div className="flex justify-end mt-2">
                            <button className="btn btn-primary px-8" onClick={handleCreateTask}>
                                Create
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Filter Bar - Segmented Control */}
            <div className="filter-bar">
                <div className="filter-group">
                    <button
                        className={cn("filter-btn", filter === 'all' && "active")}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={cn("filter-btn", filter === 'pending' && "active")}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={cn("filter-btn", filter === 'completed' && "active")}
                        onClick={() => setFilter('completed')}
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Tasks List - Grouped List Style */}
            <section className="tasks-timeline">
                {sortedDates.length === 0 ? (
                    <div className="empty-state card">
                        <CheckCircle2 size={40} className="text-accent opacity-20" />
                        <p className="font-bold text-lg">No Tasks</p>
                        <p className="text-secondary">Your execution plan is empty.</p>
                    </div>
                ) : (
                    sortedDates.map(date => (
                        <div key={date} className="timeline-group">
                            <div className="timeline-date">
                                <h3>{formatDate(date)}</h3>
                            </div>

                            <div className="tasks-list">
                                {groupedTasks[date].map(task => (
                                    <CardSpotlight key={task.id} className="p-0 border-none bg-transparent">
                                        <div className={cn(
                                            "task-card",
                                            task.status === 'completed' && "task-completed"
                                        )}>
                                            <div className="task-main">
                                                <button
                                                    className="task-checkbox"
                                                    onClick={() => task.status === 'pending' && handleCompleteTask(task.id)}
                                                    disabled={task.status === 'completed'}
                                                >
                                                    {task.status === 'completed' ? (
                                                        <CheckCircle2 size={22} className="text-success" />
                                                    ) : (
                                                        <CircleIcon size={22} />
                                                    )}
                                                </button>
                                                <div className="task-content">
                                                    <h4>{task.name}</h4>
                                                    {task.description && (
                                                        <p className="text-secondary text-sm m-0">{task.description}</p>
                                                    )}
                                                </div>
                                                <div className="task-actions">
                                                    {task.status === 'pending' && (
                                                        <button
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            onClick={() => handleRescheduleTask(task)}
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="task-footer">
                                                <div className="task-meta">
                                                    <span className={cn("text-xs font-bold uppercase tracking-tighter", `text-${task.priority}`)}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="task-duration">
                                                        <Clock size={10} />
                                                        {task.estimatedDuration}m
                                                    </span>
                                                    {task.recurrence && (
                                                        <span className="task-recurrence">
                                                            <RefreshCw size={10} />
                                                            {task.recurrence.frequency}
                                                        </span>
                                                    )}
                                                    {task.dependencies?.length > 0 && (
                                                        <span className="task-dependencies">
                                                            <AlertCircle size={10} />
                                                            {task.dependencies.length} deps
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardSpotlight>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}

function CircleIcon({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
}

function formatDate(dateStr) {
    if (dateStr === 'No date') return dateStr;

    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
}

export default TasksView;
