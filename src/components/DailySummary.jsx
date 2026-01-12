import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Zap, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import dbService from '../services/database';
import aiService from '../services/ai';
import { cn } from '../lib/utils';
import { LoaderOne } from './ui/loader';
import './DailySummary.css';

function DailySummary({ workspaceId, onComplete }) {
    const [stats, setStats] = useState(null);
    const [diagnosis, setDiagnosis] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDailyData();
    }, [workspaceId]);

    const loadDailyData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const history = await dbService.getExecutionHistory(workspaceId, today, today);
            const tasks = await dbService.getTasksByDate(workspaceId, today);

            const completed = history.length;
            const total = tasks.length;
            const timeSpent = history.reduce((sum, h) => sum + (h.actualDuration || 0), 0);

            setStats({
                completed,
                total,
                timeSpent,
                rate: total > 0 ? (completed / total) * 100 : 0
            });

            const missedDiagnosis = await aiService.diagnoseMissedTasks(workspaceId);
            setDiagnosis(missedDiagnosis);

            setLoading(false);
        } catch (error) {
            console.error('Failed to load daily summary:', error);
            setLoading(false);
        }
    };

    if (loading) return <LoaderOne />;

    return (
        <div className="daily-summary animate-spring">
            <header className="summary-header">
                <div className="logo-icon-small">
                    <img src="/Gemini_Generated_Image_k7yesqk7yesqk7ye.png" alt="Focusly Logo" />
                </div>
                <h1>Daily Summary</h1>
                <p>Execution audit for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            </header>

            <div className="summary-grid">
                <div className="summary-card main-stat">
                    <div className="stat-value">{Math.round(stats.rate)}%</div>
                    <div className="stat-label">Execution Rate</div>
                    <div className="stat-sub">{stats.completed} of {stats.total} tasks completed</div>
                </div>

                <div className="summary-card">
                    <Clock className="text-primary" size={20} />
                    <div className="stat-value-small">{Math.round(stats.timeSpent / 60)}h {stats.timeSpent % 60}m</div>
                    <div className="stat-label">Focus Time</div>
                </div>

                <div className="summary-card">
                    <TrendingUp className="text-success" size={20} />
                    <div className="stat-value-small">+{stats.completed * 10}</div>
                    <div className="stat-label">Focus Points</div>
                </div>
            </div>

            {diagnosis.length > 0 && (
                <section className="diagnosis-section">
                    <h3>Missed Task Analysis</h3>
                    <div className="diagnosis-list">
                        {diagnosis.map((item, idx) => (
                            <div key={idx} className="diagnosis-item">
                                <AlertCircle size={16} className="text-warning" />
                                <div className="diagnosis-content">
                                    <div className="diagnosis-task">{item.taskName}</div>
                                    <div className="diagnosis-reason">Reason: {item.reason.replace('_', ' ')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="summary-actions">
                <button className="btn btn-primary w-full" onClick={onComplete}>
                    Complete Day
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

export default DailySummary;
