// Database Service - IndexedDB for Offline-First Architecture
// Handles all data persistence for Focusly

const DB_NAME = 'focusly_db';
const DB_VERSION = 1;

class DatabaseService {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Workspace Store
                if (!db.objectStoreNames.contains('workspaces')) {
                    const workspaceStore = db.createObjectStore('workspaces', { keyPath: 'id' });
                    workspaceStore.createIndex('userId', 'userId', { unique: false });
                    workspaceStore.createIndex('role', 'role', { unique: false });
                }

                // Notes Store
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('workspaceId', 'workspaceId', { unique: false });
                    notesStore.createIndex('status', 'status', { unique: false });
                    notesStore.createIndex('expiresAt', 'expiresAt', { unique: false });
                }

                // Tasks Store
                if (!db.objectStoreNames.contains('tasks')) {
                    const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
                    tasksStore.createIndex('workspaceId', 'workspaceId', { unique: false });
                    tasksStore.createIndex('status', 'status', { unique: false });
                    tasksStore.createIndex('dueDate', 'dueDate', { unique: false });
                    tasksStore.createIndex('priority', 'priority', { unique: false });
                    tasksStore.createIndex('recurrence', 'recurrence', { unique: false });
                    tasksStore.createIndex('parentId', 'parentId', { unique: false });
                }

                // Plans Store
                if (!db.objectStoreNames.contains('plans')) {
                    const plansStore = db.createObjectStore('plans', { keyPath: 'id' });
                    plansStore.createIndex('workspaceId', 'workspaceId', { unique: false });
                    plansStore.createIndex('status', 'status', { unique: false });
                }

                // Time Capacity Store
                if (!db.objectStoreNames.contains('timeCapacity')) {
                    const capacityStore = db.createObjectStore('timeCapacity', { keyPath: 'id' });
                    capacityStore.createIndex('workspaceId', 'workspaceId', { unique: false });
                    capacityStore.createIndex('date', 'date', { unique: false });
                }

                // User Settings Store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'userId' });
                }

                // Execution History Store
                if (!db.objectStoreNames.contains('executionHistory')) {
                    const historyStore = db.createObjectStore('executionHistory', { keyPath: 'id' });
                    historyStore.createIndex('workspaceId', 'workspaceId', { unique: false });
                    historyStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    // Generic CRUD Operations
    async add(storeName, data) {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async query(storeName, filterFn) {
        const allData = await this.getAll(storeName);
        return allData.filter(filterFn);
    }

    // Workspace Operations
    async createWorkspace(workspace) {
        return this.add('workspaces', {
            ...workspace,
            id: workspace.id || this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    async getWorkspacesByRole(role) {
        return this.getByIndex('workspaces', 'role', role);
    }

    // Note Operations
    async createNote(note) {
        const noteData = {
            ...note,
            id: note.id || this.generateId(),
            status: 'active',
            expiresAt: note.expiresAt || this.getExpiryDate(7), // 7 days default
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return this.add('notes', noteData);
    }

    async getExpiredNotes() {
        const now = new Date().toISOString();
        const allNotes = await this.getAll('notes');
        return allNotes.filter(note =>
            note.status === 'active' && note.expiresAt < now
        );
    }

    async getNotesByWorkspace(workspaceId) {
        return this.getByIndex('notes', 'workspaceId', workspaceId);
    }

    async resolveNote(noteId, resolution) {
        const note = await this.get('notes', noteId);
        return this.update('notes', {
            ...note,
            status: 'resolved',
            resolution,
            resolvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    // Task Operations
    async createTask(task) {
        // Validate time capacity before creating task
        const canSchedule = await this.checkTimeCapacity(
            task.workspaceId,
            task.dueDate,
            task.estimatedDuration
        );

        if (!canSchedule) {
            throw new Error('TIME_CAPACITY_EXCEEDED');
        }

        const taskData = {
            ...task,
            id: task.id || this.generateId(),
            status: 'pending',
            dependencies: task.dependencies || [],
            recurrence: task.recurrence || null,
            failureReason: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.add('tasks', taskData);
        await this.updateTimeCapacity(task.workspaceId, task.dueDate, task.estimatedDuration);

        return taskData;
    }

    async getBlockedTasks(workspaceId) {
        const tasks = await this.getTasksByWorkspace(workspaceId);
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        const completedTaskIds = new Set(tasks.filter(t => t.status === 'completed').map(t => t.id));

        return pendingTasks.filter(task => {
            if (!task.dependencies || task.dependencies.length === 0) return false;
            return task.dependencies.some(depId => !completedTaskIds.has(depId));
        });
    }

    async getTasksByWorkspace(workspaceId) {
        return this.getByIndex('tasks', 'workspaceId', workspaceId);
    }

    async getTasksByDate(workspaceId, date) {
        const tasks = await this.getTasksByWorkspace(workspaceId);
        return tasks.filter(task =>
            task.dueDate && task.dueDate.startsWith(date)
        );
    }

    async getTodayTasks(workspaceId) {
        const today = new Date().toISOString().split('T')[0];
        return this.getTasksByDate(workspaceId, today);
    }

    async completeTask(taskId) {
        const task = await this.get('tasks', taskId);
        const completedTask = {
            ...task,
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.update('tasks', completedTask);

        if (task.recurrence) {
            await this.handleTaskRecurrence(task);
        }

        await this.recordExecution(task.workspaceId, {
            taskId: task.id,
            taskName: task.name,
            estimatedDuration: task.estimatedDuration,
            actualDuration: task.actualDuration || task.estimatedDuration,
            completedAt: completedTask.completedAt
        });

        return completedTask;
    }

    async failTask(taskId, reason) {
        const task = await this.get('tasks', taskId);
        const failedTask = {
            ...task,
            status: 'failed',
            failureReason: reason,
            failedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.update('tasks', failedTask);

        await this.recordExecution(task.workspaceId, {
            taskId: task.id,
            taskName: task.name,
            status: 'failed',
            failureReason: reason,
            failedAt: failedTask.failedAt
        });

        return failedTask;
    }

    async handleTaskRecurrence(task) {
        const nextDate = new Date(task.dueDate);
        const { frequency, interval = 1 } = task.recurrence;

        switch (frequency) {
            case 'daily': nextDate.setDate(nextDate.getDate() + interval); break;
            case 'weekly': nextDate.setDate(nextDate.getDate() + (7 * interval)); break;
            case 'monthly': nextDate.setMonth(nextDate.getMonth() + interval); break;
        }

        const nextDateStr = nextDate.toISOString().split('T')[0];
        const nextTask = {
            ...task,
            id: this.generateId(),
            dueDate: nextDateStr,
            status: 'pending',
            parentId: task.parentId || task.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        delete nextTask.completedAt;
        delete nextTask.actualDuration;

        return this.createTask(nextTask);
    }

    async rescheduleTask(taskId, newDate) {
        const task = await this.get('tasks', taskId);
        const canSchedule = await this.checkTimeCapacity(task.workspaceId, newDate, task.estimatedDuration);

        if (!canSchedule) throw new Error('TIME_CAPACITY_EXCEEDED');

        await this.updateTimeCapacity(task.workspaceId, task.dueDate, -task.estimatedDuration);

        const rescheduledTask = {
            ...task,
            dueDate: newDate,
            rescheduledCount: (task.rescheduledCount || 0) + 1,
            updatedAt: new Date().toISOString()
        };

        await this.update('tasks', rescheduledTask);
        await this.updateTimeCapacity(task.workspaceId, newDate, task.estimatedDuration);

        return rescheduledTask;
    }

    // Time Capacity Operations
    async checkTimeCapacity(workspaceId, date, duration) {
        const workspace = await this.get('workspaces', workspaceId);
        const dailyLimit = workspace.dailyTimeLimit || 480;

        const capacityId = `${workspaceId}_${date}`;
        let capacity = await this.get('timeCapacity', capacityId);

        if (!capacity) {
            capacity = { id: capacityId, workspaceId, date, allocated: 0, limit: dailyLimit };
            await this.add('timeCapacity', capacity);
        }

        return (capacity.allocated + duration) <= capacity.limit;
    }

    async updateTimeCapacity(workspaceId, date, duration) {
        const capacityId = `${workspaceId}_${date}`;
        let capacity = await this.get('timeCapacity', capacityId);

        if (!capacity) {
            const workspace = await this.get('workspaces', workspaceId);
            capacity = { id: capacityId, workspaceId, date, allocated: 0, limit: workspace.dailyTimeLimit || 480 };
        }

        capacity.allocated += duration;
        await this.update('timeCapacity', capacity);
        return capacity;
    }

    async getTimeCapacity(workspaceId, date) {
        const capacityId = `${workspaceId}_${date}`;
        return this.get('timeCapacity', capacityId);
    }

    // Plan Operations
    async createPlan(plan) {
        return this.add('plans', {
            ...plan,
            id: plan.id || this.generateId(),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    async getPlansByWorkspace(workspaceId) {
        return this.getByIndex('plans', 'workspaceId', workspaceId);
    }

    async processCarryOver(workspaceId) {
        const today = new Date().toISOString().split('T')[0];
        const tasks = await this.getTasksByWorkspace(workspaceId);
        const overdueTasks = tasks.filter(t => t.status === 'pending' && t.dueDate && t.dueDate < today);

        const results = [];
        for (const task of overdueTasks) {
            try {
                await this.rescheduleTask(task.id, today);
                results.push({ id: task.id, status: 'carried_over' });
            } catch (error) {
                if (error.message === 'TIME_CAPACITY_EXCEEDED') {
                    results.push({ id: task.id, status: 'blocked_by_capacity' });
                }
            }
        }
        return results;
    }

    // Execution History
    async recordExecution(workspaceId, executionData) {
        return this.add('executionHistory', {
            id: this.generateId(),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            ...executionData,
            recordedAt: new Date().toISOString()
        });
    }

    async getExecutionHistory(workspaceId, startDate, endDate) {
        const history = await this.getByIndex('executionHistory', 'workspaceId', workspaceId);
        if (!startDate && !endDate) return history;

        return history.filter(record => {
            const recordDate = record.date;
            if (startDate && recordDate < startDate) return false;
            if (endDate && recordDate > endDate) return false;
            return true;
        });
    }

    async getWeeklyStats(workspaceId) {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        weekAgo.setHours(0, 0, 0, 0);

        const startDate = weekAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        const history = await this.getExecutionHistory(workspaceId, startDate, endDate);
        const tasks = await this.getTasksByWorkspace(workspaceId);

        // Calculate Streak
        let streak = 0;
        const allHistory = await this.getByIndex('executionHistory', 'workspaceId', workspaceId);
        const completedDates = new Set(allHistory.map(h => h.date));

        let checkDate = new Date();
        while (completedDates.has(checkDate.toISOString().split('T')[0])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Daily breakdown
        const dailyBreakdown = [];
        let maxDailyCount = 0;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(weekAgo);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const count = history.filter(h => h.date === dateStr).length;
            dailyBreakdown.push({ day: days[d.getDay()], count });
            if (count > maxDailyCount) maxDailyCount = count;
        }

        const totalCompleted = history.length;
        const velocity = Math.round((totalCompleted / 7) * 10) / 10;

        return {
            totalCompleted,
            totalPlanned: tasks.filter(t => t.dueDate >= startDate && t.dueDate <= endDate).length,
            completionRate: (totalCompleted / tasks.length) * 100 || 0,
            totalTimeSpent: history.reduce((sum, h) => sum + (h.actualDuration || 0), 0),
            avgTaskDuration: totalCompleted > 0 ? history.reduce((sum, h) => sum + (h.actualDuration || 0), 0) / totalCompleted : 0,
            dailyBreakdown,
            maxDailyCount: maxDailyCount || 1,
            velocity,
            streak
        };
    }

    // Utility Methods
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getExpiryDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    async clearAll() {
        const storeNames = ['workspaces', 'notes', 'tasks', 'plans', 'timeCapacity', 'settings', 'executionHistory'];
        for (const storeName of storeNames) {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }
}

const dbService = new DatabaseService();
export default dbService;
