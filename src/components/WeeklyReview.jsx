import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, AlertCircle, Zap, Calendar, Clock } from 'lucide-react';
import dbService from '../services/database';
import aiService from '../services/ai';
import { cn } from '../lib/utils';
import './WeeklyReview.css';
import { LoaderOne } from './ui/loader';

function WeeklyReview({ workspaceId, workspace, onRefresh }) {
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviewData();
    }, [workspaceId]);

    const loadReviewData = async () => {
        try {
            const weeklyStats = await dbService.getWeeklyStats(workspaceId);
            setStats(weeklyStats);

            const aiInsights = await aiService.generateWeeklyInsights(workspaceId);
            setInsights(aiInsights);

            setLoading(false);
        } catch (error) {
            console.error('Failed to load review data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <LoaderOne />;
    }

    const metrics = [
        {
            label: 'Completion',
            value: `${Math.round(stats?.completionRate || 0)}%`,
            icon: CheckCircle2,
            color: 'text-success'
        },
        {
            label: 'Total Tasks',
            value: stats?.totalCompleted || 0,
            icon: Zap,
            color: 'text-accent'
        },
        {
            label: 'Velocity',
            value: stats?.velocity || 0,
            icon: TrendingUp,
            color: 'text-warning'
        },
        {
            label: 'Time Spent',
            value: `${Math.round((stats?.totalTimeSpent || 0) / 60)}h`,
            icon: Clock,
            color: 'text-primary'
        }
    ];

    return (
        <div className="weekly-review animate-spring">
            <header className="view-header flex justify-between items-center">
                <div>
                    <h1>Weekly Review</h1>
                    <p>Performance analysis and AI-driven insights.</p>
                </div>
            </header>

            {/* Metrics Grid - Apple Health Style */}
            <div className="metrics-grid">
                {metrics.map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                        <div key={idx} className="metric-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="metric-icon-container">
                                <Icon size={18} className={metric.color} />
                            </div>
                            <div className="metric-value">{metric.value}</div>
                            <div className="metric-label">{metric.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Daily Breakdown - macOS Style Chart */}
            <section className="daily-breakdown-section">
                <div className="section-header">
                    <Calendar size={20} className="text-accent" />
                    <h2>Daily Activity</h2>
                </div>
                <div className="daily-chart-container">
                    <div className="daily-chart">
                        {stats?.dailyBreakdown.map((day, idx) => {
                            const height = day.count > 0 ? (day.count / stats.maxDailyCount) * 100 : 5;
                            return (
                                <div key={idx} className="day-bar-group">
                                    <div className="bar-container">
                                        <div
                                            className="bar-fill"
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                    <span className="bar-label">{day.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* AI Insights - iOS Card Style */}
            {insights && (
                <section className="insights-section">
                    <div className="section-header">
                        <Zap size={20} className="text-accent" fill="currentColor" />
                        <h2>AI Insights</h2>
                    </div>
                    <div className="insights-list">
                        {insights.insights.map((insight, idx) => (
                            <div key={idx} className="insight-card">
                                <div className="insight-type">
                                    <TrendingUp size={12} />
                                    <span>{insight.type}</span>
                                </div>
                                <div className="insight-message">{insight.message}</div>
                                <div className="insight-action">
                                    <strong>Action:</strong> {insight.action}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Review Actions */}
            <div className="review-actions">
                <h3>Ready for next week?</h3>
                <p>Based on your performance, we've adjusted your suggested daily limits.</p>
                <div className="action-buttons">
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        Complete Review
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WeeklyReview;
