// AI Service - Decision Support Engine
// Provides intelligent actions WITHOUT content generation
// AI enforces constraints and helps with execution planning

import dbService from './database';

class AIService {
    constructor() {
        this.isOnline = navigator.onLine;

        window.addEventListener('online', () => {
            this.isOnline = true;
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // ==========================================
    // CORE AI ACTIONS (CONSTRAINT-BASED)
    // ==========================================

    /**
     * Convert note to task with realistic estimates
     */
    async convertNoteToTask(note, workspace) {
        const analysis = this.analyzeNoteContent(note.content);

        return {
            name: this.extractTaskName(note.content),
            description: note.content,
            estimatedDuration: this.estimateDuration(note.content, workspace.role),
            priority: this.determinePriority(note, workspace),
            category: analysis.category,
            suggestedDate: this.suggestDate(workspace, analysis.urgency),
            tags: analysis.keywords,
            sourceNoteId: note.id
        };
    }

    /**
     * Generate realistic plan from goal/project
     */
    async generatePlan(goal, workspace, constraints) {
        const breakdown = this.breakdownGoal(goal, workspace.role);
        const timeline = await this.calculateTimeline(breakdown, workspace, constraints);

        return {
            name: goal.name,
            description: goal.description,
            tasks: timeline.tasks,
            estimatedTotalDuration: timeline.totalDuration,
            startDate: timeline.startDate,
            endDate: timeline.endDate,
            milestones: timeline.milestones,
            warnings: timeline.warnings
        };
    }

    /**
     * Detect schedule overload and rebalance
     */
    async detectOverload(workspaceId, dateRange) {
        const { start, end } = dateRange;
        const overloadDays = [];

        // Check each day in range
        const currentDate = new Date(start);
        const endDate = new Date(end);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const capacity = await dbService.getTimeCapacity(workspaceId, dateStr);

            if (capacity && capacity.allocated > capacity.limit * 0.8) {
                const tasks = await dbService.getTasksByDate(workspaceId, dateStr);
                overloadDays.push({
                    date: dateStr,
                    capacity,
                    tasks,
                    overloadPercent: (capacity.allocated / capacity.limit) * 100
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return overloadDays;
    }

    /**
     * Rebalance overloaded schedule
     */
    async rebalanceSchedule(workspaceId, overloadDays) {
        const suggestions = [];

        for (const day of overloadDays) {
            const { date, tasks } = day;

            // Sort tasks by priority (lowest priority first for rescheduling)
            const sortedTasks = tasks.sort((a, b) => {
                const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
                return priorityMap[a.priority] - priorityMap[b.priority];
            });

            let freedCapacity = 0;
            const tasksToReschedule = [];

            // Find tasks to reschedule
            for (const task of sortedTasks) {
                if (task.status === 'pending') {
                    tasksToReschedule.push(task);
                    freedCapacity += task.estimatedDuration;

                    // Stop when we've freed enough capacity
                    if (day.capacity.allocated - freedCapacity <= day.capacity.limit) {
                        break;
                    }
                }
            }

            // Find alternative dates
            for (const task of tasksToReschedule) {
                const newDate = await this.findAvailableDate(workspaceId, task, date);
                suggestions.push({
                    task,
                    currentDate: date,
                    suggestedDate: newDate,
                    reason: 'Overload mitigation'
                });
            }
        }

        return suggestions;
    }

    /**
     * Suggest what to work on today
     */
    async suggestDailyFocus(workspaceId) {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = await dbService.getTodayTasks(workspaceId);
        const workspace = await dbService.get('workspaces', workspaceId);

        // Filter pending tasks
        const pendingTasks = todayTasks.filter(t => t.status === 'pending');

        // Calculate capacity
        const capacity = await dbService.getTimeCapacity(workspaceId, today);
        const availableTime = capacity ? (capacity.limit - capacity.allocated) : workspace.dailyTimeLimit;

        // Smart prioritization
        const prioritized = this.prioritizeTasks(pendingTasks, workspace, availableTime);

        return {
            recommendedTasks: prioritized.topTasks,
            totalEstimatedDuration: prioritized.totalDuration,
            availableTime,
            utilizationRate: (prioritized.totalDuration / availableTime) * 100,
            suggestions: prioritized.suggestions
        };
    }

    // ==========================================
    // ANALYSIS & ESTIMATION ALGORITHMS
    // ==========================================

    analyzeNoteContent(content) {
        const lower = content.toLowerCase();

        // Category detection
        let category = 'general';
        const categoryKeywords = {
            study: ['study', 'read', 'learn', 'revise', 'exam', 'chapter', 'homework'],
            work: ['meeting', 'report', 'presentation', 'deadline', 'project', 'client'],
            personal: ['buy', 'call', 'email', 'reminder', 'appointment'],
            planning: ['plan', 'organize', 'schedule', 'prepare']
        };

        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(kw => lower.includes(kw))) {
                category = cat;
                break;
            }
        }

        // Urgency detection
        let urgency = 'normal';
        const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
        const soonKeywords = ['soon', 'today', 'tomorrow', 'this week'];

        if (urgentKeywords.some(kw => lower.includes(kw))) {
            urgency = 'urgent';
        } else if (soonKeywords.some(kw => lower.includes(kw))) {
            urgency = 'soon';
        }

        // Complexity estimation
        const wordCount = content.split(/\s+/).length;
        let complexity = 'simple';

        if (wordCount > 50 || lower.includes('project') || lower.includes('plan')) {
            complexity = 'complex';
        } else if (wordCount > 20) {
            complexity = 'medium';
        }

        // Extract keywords
        const keywords = content
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 4)
            .filter(word => !['about', 'should', 'would', 'could', 'there', 'their'].includes(word))
            .slice(0, 5);

        return { category, urgency, complexity, keywords };
    }

    extractTaskName(content) {
        // Take first sentence or first 50 chars
        const firstSentence = content.split(/[.!?]/)[0];
        return firstSentence.length > 50
            ? firstSentence.substring(0, 47) + '...'
            : firstSentence;
    }

    estimateDuration(content, role) {
        const analysis = this.analyzeNoteContent(content);

        // Base duration by complexity
        const baseDurations = {
            simple: 30,
            medium: 60,
            complex: 120
        };

        let duration = baseDurations[analysis.complexity];

        // Role-specific adjustments
        if (role === 'student') {
            if (analysis.category === 'study') {
                duration *= 1.5; // Students need more study time
            }
        } else if (role === 'professional') {
            if (analysis.category === 'work') {
                duration *= 1.3; // Professional tasks take longer
            }
        }

        return Math.round(duration);
    }

    determinePriority(note, workspace) {
        const analysis = this.analyzeNoteContent(note.content);

        if (analysis.urgency === 'urgent') return 'urgent';
        if (analysis.urgency === 'soon') return 'high';
        if (analysis.complexity === 'complex') return 'medium';

        return 'low';
    }

    suggestDate(workspace, urgency) {
        const today = new Date();

        switch (urgency) {
            case 'urgent':
                return today.toISOString().split('T')[0];
            case 'soon':
                today.setDate(today.getDate() + 1);
                return today.toISOString().split('T')[0];
            default:
                today.setDate(today.getDate() + 3);
                return today.toISOString().split('T')[0];
        }
    }

    breakdownGoal(goal, role) {
        // Simple rule-based breakdown
        // In production, this could use actual AI API

        const tasks = [];
        const content = goal.description.toLowerCase();

        // Detect project phases
        if (content.includes('project') || content.includes('plan')) {
            tasks.push({ phase: 'Planning', weight: 0.2 });
            tasks.push({ phase: 'Execution', weight: 0.6 });
            tasks.push({ phase: 'Review', weight: 0.2 });
        } else if (content.includes('study') || content.includes('learn')) {
            tasks.push({ phase: 'Research', weight: 0.3 });
            tasks.push({ phase: 'Practice', weight: 0.5 });
            tasks.push({ phase: 'Test', weight: 0.2 });
        } else {
            tasks.push({ phase: 'Preparation', weight: 0.3 });
            tasks.push({ phase: 'Execution', weight: 0.7 });
        }

        return tasks;
    }

    async calculateTimeline(breakdown, workspace, constraints) {
        const { totalDuration = 0, deadline } = constraints;
        const tasks = [];
        let warnings = [];

        const startDate = new Date();
        const endDate = deadline ? new Date(deadline) : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

        let accumulatedDuration = 0;

        for (const phase of breakdown) {
            const phaseDuration = Math.round(totalDuration * phase.weight);

            tasks.push({
                name: phase.phase,
                estimatedDuration: phaseDuration,
                priority: 'medium',
                category: 'plan'
            });

            accumulatedDuration += phaseDuration;
        }

        // Check if timeline is realistic
        const availableDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
        const requiredDaysAtCapacity = Math.ceil(accumulatedDuration / workspace.dailyTimeLimit);

        if (requiredDaysAtCapacity > availableDays) {
            warnings.push('Timeline may be too aggressive given daily time capacity');
        }

        return {
            tasks,
            totalDuration: accumulatedDuration,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            milestones: this.generateMilestones(breakdown),
            warnings
        };
    }

    generateMilestones(breakdown) {
        return breakdown.map((phase, idx) => ({
            name: `Complete ${phase.phase}`,
            order: idx + 1
        }));
    }

    async findAvailableDate(workspaceId, task, afterDate) {
        const workspace = await dbService.get('workspaces', workspaceId);
        const searchDate = new Date(afterDate);
        searchDate.setDate(searchDate.getDate() + 1); // Start from next day

        // Search for up to 14 days
        for (let i = 0; i < 14; i++) {
            const dateStr = searchDate.toISOString().split('T')[0];
            const canSchedule = await dbService.checkTimeCapacity(
                workspaceId,
                dateStr,
                task.estimatedDuration
            );

            if (canSchedule) {
                return dateStr;
            }

            searchDate.setDate(searchDate.getDate() + 1);
        }

        // If no date found in 14 days, return 15th day with warning
        return searchDate.toISOString().split('T')[0];
    }

    prioritizeTasks(tasks, workspace, availableTime) {
        // Score each task
        const scoredTasks = tasks.map(task => {
            let score = 0;

            // Priority scoring
            const priorityScores = { urgent: 100, high: 75, medium: 50, low: 25 };
            score += priorityScores[task.priority] || 0;

            // Deadline proximity (if task is overdue or due soon)
            if (task.dueDate) {
                const daysUntilDue = Math.ceil(
                    (new Date(task.dueDate) - new Date()) / (24 * 60 * 60 * 1000)
                );

                if (daysUntilDue < 0) score += 200; // Overdue
                else if (daysUntilDue === 0) score += 150; // Due today
                else if (daysUntilDue <= 2) score += 100; // Due very soon
            }

            // Efficiency (shorter tasks get slight boost to build momentum)
            if (task.estimatedDuration <= 30) score += 10;

            return { task, score };
        });

        // Sort by score
        scoredTasks.sort((a, b) => b.score - a.score);

        // Select tasks that fit in available time
        const topTasks = [];
        let totalDuration = 0;

        for (const { task } of scoredTasks) {
            if (totalDuration + task.estimatedDuration <= availableTime) {
                topTasks.push(task);
                totalDuration += task.estimatedDuration;
            }
        }

        // Generate suggestions
        const suggestions = [];

        if (topTasks.length === 0) {
            suggestions.push('No tasks fit in available time. Consider breaking down large tasks.');
        } else if (totalDuration < availableTime * 0.5) {
            suggestions.push('Light schedule today. Good opportunity for proactive planning.');
        } else if (totalDuration > availableTime * 0.9) {
            suggestions.push('Schedule is packed. Stay focused on these priorities.');
        }

        return { topTasks, totalDuration, suggestions };
    }

    // ==========================================
    // BEHAVIORAL FEEDBACK
    // ==========================================

    async diagnoseMissedTasks(workspaceId) {
        const history = await dbService.getExecutionHistory(workspaceId);
        const tasks = await dbService.getTasksByWorkspace(workspaceId);

        const missedTasks = tasks.filter(t => t.status === 'failed' || (t.status === 'pending' && t.dueDate < new Date().toISOString().split('T')[0]));

        const diagnosis = missedTasks.map(task => {
            let reason = 'unknown';
            if (task.rescheduledCount > 2) reason = 'procrastination';
            else if (task.estimatedDuration > 120) reason = 'complexity';
            else if (task.priority === 'low') reason = 'low_priority_neglect';

            return { taskId: task.id, taskName: task.name, reason };
        });

        return diagnosis;
    }

    async detectPatterns(workspaceId) {
        const stats = await dbService.getWeeklyStats(workspaceId);
        const history = await dbService.getExecutionHistory(workspaceId);

        const patterns = [];

        // Procrastination pattern
        const highRescheduleTasks = history.filter(h => h.rescheduledCount > 3);
        if (highRescheduleTasks.length > 2) {
            patterns.push({
                id: 'procrastination',
                severity: 'high',
                message: 'You tend to reschedule complex tasks multiple times.'
            });
        }

        // Overload pattern
        const overloadDays = stats.dailyBreakdown.filter(d => d.count > stats.velocity * 1.5);
        if (overloadDays.length > 2) {
            patterns.push({
                id: 'overload',
                severity: 'medium',
                message: 'Your schedule is inconsistent, with heavy bursts followed by low activity.'
            });
        }

        return patterns;
    }

    async generateWeeklyInsights(workspaceId) {
        const stats = await dbService.getWeeklyStats(workspaceId);
        const insights = [];

        // Completion rate insight
        if (stats.completionRate >= 80) {
            insights.push({
                type: 'success',
                message: `Excellent execution! ${stats.completionRate.toFixed(0)}% completion rate this week.`,
                action: 'Keep it up!'
            });
        } else if (stats.completionRate < 50) {
            insights.push({
                type: 'warning',
                message: `Low completion rate (${stats.completionRate.toFixed(0)}%). Consider reducing daily task load.`,
                action: 'Reduce planned tasks per day'
            });
        }

        // Time spent insight
        const avgDailyTime = stats.totalTimeSpent / 7;
        if (avgDailyTime < 120) { // Less than 2 hours
            insights.push({
                type: 'info',
                message: 'Low daily engagement detected. Are you tracking all your work?',
                action: 'Record all actionable items'
            });
        }

        // Task duration accuracy
        if (stats.avgTaskDuration > 90) {
            insights.push({
                type: 'warning',
                message: 'Tasks are taking longer than expected. Improve time estimates.',
                action: 'Break down large tasks further'
            });
        }

        // Default insight if none generated
        if (insights.length === 0) {
            insights.push({
                type: 'info',
                message: 'Good start to your tracking. Keep completing tasks to get deeper insights.',
                action: 'Continue your daily routine'
            });
        }

        return { insights };
    }
}

// Singleton instance
const aiService = new AIService();

export default aiService;
