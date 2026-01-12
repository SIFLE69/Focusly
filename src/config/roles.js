// Role Definitions and Workspace Templates
// Each role has specific defaults, constraints, and workspace structure

export const ROLES = {
    STUDENT: 'student',
    PROFESSIONAL: 'professional',
    BUSINESS: 'business'
};

export const ROLE_CONFIG = {
    [ROLES.STUDENT]: {
        name: 'Student',
        description: 'Optimize your academic execution with subject-based planning and exam preparation',
        color: '#06b6d4',

        // Default constraints
        defaults: {
            dailyTimeLimit: 360, // 6 hours (realistic for focused study)
            weeklyReviewDay: 0, // Sunday
            taskExpiryDays: 7,
            maxTasksPerDay: 8
        },

        // Workspace structure
        workspaceAreas: [
            { id: 'subjects', name: 'Subjects', type: 'container' },
            { id: 'assignments', name: 'Assignments', type: 'tasks' },
            { id: 'exams', name: 'Exam Prep', type: 'plans' },
            { id: 'revision', name: 'Revision', type: 'recurring' },
            { id: 'projects', name: 'Projects', type: 'plans' }
        ],

        // Context questions for onboarding
        onboardingQuestions: [
            {
                id: 'level',
                question: 'What is your current education level?',
                type: 'select',
                options: [
                    { value: 'high_school', label: 'High School' },
                    { value: 'undergraduate', label: 'Undergraduate' },
                    { value: 'graduate', label: 'Graduate/Postgraduate' }
                ],
                required: true
            },
            {
                id: 'subjects',
                question: 'What subjects are you currently studying?',
                type: 'multi-text',
                placeholder: 'e.g., Mathematics, Physics, Computer Science',
                required: true
            },
            {
                id: 'studyHours',
                question: 'How many hours per day can you dedicate to focused study?',
                type: 'number',
                min: 1,
                max: 12,
                default: 6,
                required: true
            },
            {
                id: 'examDates',
                question: 'Do you have any upcoming exams?',
                type: 'date-list',
                required: false
            }
        ],

        // Analytics metrics specific to students
        metrics: [
            { id: 'completion_rate', name: 'Assignment Completion Rate', format: 'percentage' },
            { id: 'study_hours', name: 'Weekly Study Hours', format: 'hours' },
            { id: 'subject_distribution', name: 'Time per Subject', format: 'breakdown' },
            { id: 'exam_readiness', name: 'Exam Preparation Progress', format: 'percentage' }
        ]
    },

    [ROLES.PROFESSIONAL]: {
        name: 'Working Professional',
        description: 'Manage projects and deadlines with realistic time allocation for work tasks',
        color: '#8b5cf6',

        defaults: {
            dailyTimeLimit: 480, // 8 hours (work day)
            weeklyReviewDay: 5, // Friday
            taskExpiryDays: 5,
            maxTasksPerDay: 10
        },

        workspaceAreas: [
            { id: 'projects', name: 'Projects', type: 'container' },
            { id: 'meetings', name: 'Meetings', type: 'calendar' },
            { id: 'deadlines', name: 'Deadlines', type: 'tasks' },
            { id: 'follow_ups', name: 'Follow-ups', type: 'tasks' },
            { id: 'development', name: 'Professional Development', type: 'plans' }
        ],

        onboardingQuestions: [
            {
                id: 'role',
                question: 'What is your professional role?',
                type: 'text',
                placeholder: 'e.g., Software Engineer, Project Manager',
                required: true
            },
            {
                id: 'projects',
                question: 'What are your current active projects?',
                type: 'multi-text',
                placeholder: 'List your main projects',
                required: true
            },
            {
                id: 'workHours',
                question: 'Your typical work hours per day?',
                type: 'number',
                min: 4,
                max: 12,
                default: 8,
                required: true
            },
            {
                id: 'meetingLoad',
                question: 'Average hours in meetings per day?',
                type: 'number',
                min: 0,
                max: 8,
                default: 2,
                required: true
            }
        ],

        metrics: [
            { id: 'project_progress', name: 'Project Completion Rate', format: 'percentage' },
            { id: 'deadline_met', name: 'Deadlines Met', format: 'percentage' },
            { id: 'meeting_efficiency', name: 'Meeting Time vs Execution Time', format: 'ratio' },
            { id: 'focus_time', name: 'Deep Work Hours', format: 'hours' }
        ]
    },

    [ROLES.BUSINESS]: {
        name: 'Business / Organizer',
        description: 'Manage business operations with area-based organization and recurring tasks',
        color: '#f59e0b',

        defaults: {
            dailyTimeLimit: 540, // 9 hours (extended business operations)
            weeklyReviewDay: 6, // Saturday
            taskExpiryDays: 3,
            maxTasksPerDay: 12
        },

        workspaceAreas: [
            { id: 'operations', name: 'Operations', type: 'container' },
            { id: 'marketing', name: 'Marketing', type: 'plans' },
            { id: 'sales', name: 'Sales', type: 'tasks' },
            { id: 'finance', name: 'Finance', type: 'recurring' },
            { id: 'growth', name: 'Growth Initiatives', type: 'plans' }
        ],

        onboardingQuestions: [
            {
                id: 'businessType',
                question: 'What type of business are you running?',
                type: 'text',
                placeholder: 'e.g., E-commerce, Consulting, SaaS',
                required: true
            },
            {
                id: 'areas',
                question: 'What are your key business areas?',
                type: 'multi-text',
                placeholder: 'e.g., Marketing, Sales, Operations',
                required: true
            },
            {
                id: 'workHours',
                question: 'Hours dedicated to business per day?',
                type: 'number',
                min: 4,
                max: 16,
                default: 9,
                required: true
            },
            {
                id: 'goals',
                question: 'Current quarter objectives?',
                type: 'text',
                placeholder: 'What are you working towards?',
                required: false
            }
        ],

        metrics: [
            { id: 'area_balance', name: 'Time Distribution by Area', format: 'breakdown' },
            { id: 'execution_velocity', name: 'Weekly Task Completion', format: 'number' },
            { id: 'bottleneck_areas', name: 'Neglected Areas', format: 'list' },
            { id: 'goal_progress', name: 'Quarterly Goal Progress', format: 'percentage' }
        ]
    }
};

/**
 * Generate initial workspace for a role
 */
export function generateWorkspaceTemplate(role, onboardingData) {
    const config = ROLE_CONFIG[role];

    if (!config) {
        throw new Error(`Invalid role: ${role}`);
    }

    const workspace = {
        role,
        name: `${config.name} Workspace`,
        dailyTimeLimit: onboardingData.workHours * 60 ||
            onboardingData.studyHours * 60 ||
            config.defaults.dailyTimeLimit,
        weeklyReviewDay: config.defaults.weeklyReviewDay,
        taskExpiryDays: config.defaults.taskExpiryDays,
        maxTasksPerDay: config.defaults.maxTasksPerDay,
        areas: config.workspaceAreas,
        onboardingData,
        settings: {
            enableNotifications: true,
            enableWeeklyReview: true,
            focusModeDefault: false,
            theme: 'dark'
        }
    };

    return workspace;
}

/**
 * Generate starter content for new workspace
 */
export function generateStarterContent(workspace) {
    const config = ROLE_CONFIG[workspace.role];
    const content = {
        notes: [],
        tasks: [],
        plans: []
    };

    // Role-specific starter notes
    if (workspace.role === ROLES.STUDENT) {
        if (workspace.onboardingData.subjects) {
            workspace.onboardingData.subjects.forEach((subject, idx) => {
                content.notes.push({
                    title: `${subject} - Getting Started`,
                    content: `Set up your study plan for ${subject}. Define key topics and exam preparation strategy.`,
                    area: 'subjects',
                    priority: idx === 0 ? 'high' : 'medium'
                });
            });
        }

        content.tasks.push({
            name: 'Create weekly study schedule',
            description: 'Plan your study hours for the week ahead',
            priority: 'high',
            estimatedDuration: 30,
            category: 'planning'
        });
    }

    else if (workspace.role === ROLES.PROFESSIONAL) {
        if (workspace.onboardingData.projects) {
            workspace.onboardingData.projects.forEach((project, idx) => {
                content.notes.push({
                    title: `${project} - Project Breakdown`,
                    content: `Define milestones and deliverables for ${project}`,
                    area: 'projects',
                    priority: idx === 0 ? 'high' : 'medium'
                });
            });
        }

        content.tasks.push({
            name: 'Review project priorities',
            description: 'Align on current project priorities and deadlines',
            priority: 'high',
            estimatedDuration: 45,
            category: 'planning'
        });
    }

    else if (workspace.role === ROLES.BUSINESS) {
        if (workspace.onboardingData.areas) {
            workspace.onboardingData.areas.forEach((area, idx) => {
                content.notes.push({
                    title: `${area} - Action Items`,
                    content: `Identify key actions needed in ${area}`,
                    area: 'operations',
                    priority: 'medium'
                });
            });
        }

        content.tasks.push({
            name: 'Define quarterly OKRs',
            description: 'Set measurable objectives and key results',
            priority: 'urgent',
            estimatedDuration: 90,
            category: 'planning'
        });
    }

    // Common welcome tasks for all roles
    content.tasks.push({
        name: 'Complete Focusly orientation',
        description: 'Learn how to use Focusly effectively for execution',
        priority: 'medium',
        estimatedDuration: 15,
        category: 'onboarding'
    });

    return content;
}

/**
 * Get role-specific analytics configuration
 */
export function getRoleMetrics(role) {
    const config = ROLE_CONFIG[role];
    return config ? config.metrics : [];
}

/**
 * Validate workspace configuration
 */
export function validateWorkspaceConfig(workspace) {
    const errors = [];

    if (!workspace.role || !ROLE_CONFIG[workspace.role]) {
        errors.push('Invalid role specified');
    }

    if (!workspace.dailyTimeLimit || workspace.dailyTimeLimit < 60 || workspace.dailyTimeLimit > 960) {
        errors.push('Daily time limit must be between 1-16 hours');
    }

    if (!workspace.areas || workspace.areas.length === 0) {
        errors.push('Workspace must have at least one area');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export default {
    ROLES,
    ROLE_CONFIG,
    generateWorkspaceTemplate,
    generateStarterContent,
    getRoleMetrics,
    validateWorkspaceConfig
};
