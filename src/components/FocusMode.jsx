import { useState, useEffect, useRef } from 'react';
import { Zap, Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import dbService from '../services/database';
import { cn } from '../lib/utils';
import './FocusMode.css';
import { LoaderOne } from './ui/loader';

function FocusMode({ workspaceId, workspace, onRefresh }) {
    const [activeTask, setActiveTask] = useState(null);
    const [queue, setQueue] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('task'); // 'task' or 'pomodoro'
    const [sessionType, setSessionType] = useState('work'); // 'work' or 'break'
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        loadFocusData();
        return () => clearInterval(timerRef.current);
    }, [workspaceId]);

    const loadFocusData = async () => {
        try {
            const tasks = await dbService.getTodayTasks(workspaceId);
            const pending = tasks.filter(t => t.status === 'pending');

            if (pending.length > 0) {
                setActiveTask(pending[0]);
                setQueue(pending.slice(1));
                setTimeLeft(pending[0].estimatedDuration * 60);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to load focus data:', error);
            setLoading(false);
        }
    };

    const toggleTimer = () => {
        if (isActive) {
            clearInterval(timerRef.current);
        } else {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsActive(false);
                        handleSessionEnd();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        setIsActive(!isActive);
    };

    const handleSessionEnd = () => {
        if (mode === 'task') {
            handleTaskComplete();
        } else {
            if (sessionType === 'work') {
                const count = pomodoroCount + 1;
                setPomodoroCount(count);
                setSessionType('break');
                setTimeLeft(count % 4 === 0 ? 15 * 60 : 5 * 60); // Long break every 4 poms
            } else {
                setSessionType('work');
                setTimeLeft(25 * 60);
            }
        }
    };

    const resetTimer = () => {
        clearInterval(timerRef.current);
        setIsActive(false);
        if (activeTask) {
            setTimeLeft(activeTask.estimatedDuration * 60);
        }
    };

    const handleTaskComplete = async () => {
        if (!activeTask) return;

        try {
            await dbService.completeTask(activeTask.id);
            onRefresh();

            if (queue.length > 0) {
                const next = queue[0];
                setActiveTask(next);
                setQueue(queue.slice(1));
                setTimeLeft(next.estimatedDuration * 60);
            } else {
                setActiveTask(null);
            }
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <LoaderOne />;
    }

    const progress = mode === 'task'
        ? (timeLeft / (activeTask.estimatedDuration * 60)) * 100
        : (timeLeft / (sessionType === 'work' ? 25 * 60 : (pomodoroCount % 4 === 0 ? 15 * 60 : 5 * 60))) * 100;

    const strokeDashoffset = 880 - (880 * progress) / 100;

    return (
        <div className="focus-mode">
            <div className="focus-container">
                {/* Mode Switcher */}
                <div className="focus-mode-switcher">
                    <button
                        className={cn("mode-btn", mode === 'task' && "active")}
                        onClick={() => { setMode('task'); setTimeLeft(activeTask.estimatedDuration * 60); }}
                    >
                        Task Timer
                    </button>
                    <button
                        className={cn("mode-btn", mode === 'pomodoro' && "active")}
                        onClick={() => { setMode('pomodoro'); setSessionType('work'); setTimeLeft(25 * 60); }}
                    >
                        Pomodoro
                    </button>
                </div>

                {/* Timer Section */}
                <div className="focus-timer-section">
                    <div className="progress-ring-container">
                        <svg className="progress-ring" width="300" height="300">
                            <circle
                                className="progress-ring-bg"
                                cx="150"
                                cy="150"
                                r="140"
                            />
                            <circle
                                className={cn(
                                    "progress-ring-fill",
                                    sessionType === 'break' && "break-mode"
                                )}
                                cx="150"
                                cy="150"
                                r="140"
                                style={{
                                    strokeDasharray: 880,
                                    strokeDashoffset: strokeDashoffset
                                }}
                            />
                        </svg>
                        <div className="timer-content">
                            <div className="timer-value">{formatTime(timeLeft)}</div>
                            <div className="timer-target">
                                {mode === 'pomodoro' ? (sessionType === 'work' ? 'Focus Session' : 'Break Time') : 'Time Remaining'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Details */}
                <div className="focus-task-details">
                    <div className="task-header">
                        <span className={cn("text-xs font-bold uppercase tracking-widest", `text-${activeTask.priority}`)}>
                            {activeTask.priority}
                        </span>
                    </div>
                    <h2>{activeTask.name}</h2>
                    <p>{activeTask.description || 'No description provided'}</p>
                </div>

                {/* Controls */}
                <div className="focus-controls-section">
                    <div className="main-controls">
                        <button className="focus-main-btn" onClick={toggleTimer}>
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                    </div>
                    <div className="secondary-controls">
                        <button className="btn" onClick={resetTimer}>
                            Reset
                        </button>
                        <button className="btn" onClick={handleTaskComplete}>
                            Skip
                        </button>
                    </div>
                </div>

                {/* Queue */}
                {queue.length > 0 && (
                    <div className="focus-queue-section">
                        <div className="queue-header">
                            <h4>Up Next</h4>
                        </div>
                        <div className="queue-list">
                            {queue.map(task => (
                                <div key={task.id} className="queue-item">
                                    <span className="queue-name">{task.name}</span>
                                    <span className="text-xs text-secondary">{task.estimatedDuration}m</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FocusMode;
