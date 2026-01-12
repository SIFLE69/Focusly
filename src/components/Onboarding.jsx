import { useState, useRef } from 'react';
import { GraduationCap, Briefcase, TrendingUp, ChevronRight, Zap, ArrowLeft, Check, X, Plus } from 'lucide-react';
import { ROLE_CONFIG, ROLES, generateWorkspaceTemplate, generateStarterContent } from '../config/roles';
import dbService from '../services/database';
import { useModal } from '../context/ModalContext';
import { cn } from '../lib/utils';
import './Onboarding.css';
import { LoaderOne } from './ui/loader';

const ROLE_ICONS = {
    [ROLES.STUDENT]: GraduationCap,
    [ROLES.PROFESSIONAL]: Briefcase,
    [ROLES.BUSINESS]: TrendingUp
};

function Onboarding({ onComplete }) {
    const [step, setStep] = useState('role-selection');
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({});
    const [isCreating, setIsCreating] = useState(false);
    const { showAlert } = useModal();
    const multiTextRefs = useRef({});

    const handleRoleSelect = (role) => {
        setSelectedRole(role);

        // Initialize formData with defaults
        const config = ROLE_CONFIG[role];
        const defaults = {};
        config.onboardingQuestions.forEach(q => {
            if (q.type === 'multi-text' || q.type === 'date-list') {
                defaults[q.id] = [];
            } else if (q.type === 'number') {
                defaults[q.id] = q.default || '';
            } else if (q.type === 'select') {
                defaults[q.id] = '';
            } else {
                defaults[q.id] = q.default || '';
            }
        });
        setFormData(defaults);
        console.log('Form initialized with:', defaults);

        setStep('context-collection');
    };

    const handleInputChange = (questionId, value) => {
        setFormData(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleMultiTextAdd = (questionId, value) => {
        if (!value.trim()) return;

        setFormData(prev => {
            const updated = {
                ...prev,
                [questionId]: [...(prev[questionId] || []), value.trim()]
            };
            console.log(`Added "${value.trim()}" to ${questionId}. New value:`, updated[questionId]);
            return updated;
        });
    };

    const handleMultiTextRemove = (questionId, index) => {
        setFormData(prev => ({
            ...prev,
            [questionId]: prev[questionId].filter((_, i) => i !== index)
        }));
    };

    const handleDateAdd = (questionId, value) => {
        if (!value) return;

        setFormData(prev => ({
            ...prev,
            [questionId]: [...(prev[questionId] || []), value]
        }));
    };

    const handleDateRemove = (questionId, index) => {
        setFormData(prev => ({
            ...prev,
            [questionId]: prev[questionId].filter((_, i) => i !== index)
        }));
    };

    const canProceed = () => {
        if (!selectedRole) {
            console.log('Cannot proceed: No role selected');
            return false;
        }

        const config = ROLE_CONFIG[selectedRole];
        const requiredQuestions = config.onboardingQuestions.filter(q => q.required);

        const result = requiredQuestions.every(q => {
            const value = formData[q.id];
            let passes = false;
            
            if (q.type === 'multi-text' || q.type === 'date-list') {
                passes = Array.isArray(value) && value.length > 0;
            } else {
                passes = value !== undefined && value !== '' && value !== null;
            }
            
            if (!passes) {
                console.log(`Question "${q.id}" failed validation. Value:`, value, 'Type:', q.type);
            }
            
            return passes;
        });

        if (!result) {
            console.log('Cannot proceed: Form validation failed');
        }
        
        return result;
    };

    const getIncompleteFields = () => {
        if (!selectedRole) return ['No role selected'];

        const config = ROLE_CONFIG[selectedRole];
        const requiredQuestions = config.onboardingQuestions.filter(q => q.required);
        const incomplete = [];

        requiredQuestions.forEach(q => {
            const value = formData[q.id];
            let passes = false;
            
            if (q.type === 'multi-text' || q.type === 'date-list') {
                passes = Array.isArray(value) && value.length > 0;
            } else {
                passes = value !== undefined && value !== '' && value !== null;
            }
            
            if (!passes) {
                incomplete.push(q.question);
            }
        });

        return incomplete;
    };

    const handleComplete = async () => {
        const incompleteFields = getIncompleteFields();
        
        if (incompleteFields.length > 0) {
            const fieldList = incompleteFields.join('\n• ');
            showAlert('Incomplete Form', `Please fill in the following required fields:\n\n• ${fieldList}`, 'warning');
            console.log('Incomplete fields:', incompleteFields);
            console.log('Current form data:', formData);
            return;
        }

        setIsCreating(true);

        try {
            const workspace = generateWorkspaceTemplate(selectedRole, formData);
            const workspaceId = await dbService.createWorkspace(workspace);

            const starterContent = generateStarterContent({ ...workspace, id: workspaceId });

            for (const note of starterContent.notes) {
                await dbService.createNote({
                    ...note,
                    workspaceId
                });
            }

            for (const task of starterContent.tasks) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);

                await dbService.createTask({
                    ...task,
                    workspaceId,
                    dueDate: tomorrow.toISOString().split('T')[0]
                });
            }

            onComplete(workspaceId);
        } catch (error) {
            console.error('Failed to create workspace:', error);
            showAlert('Creation Failed', 'Failed to create workspace. Please try again.', 'error');
            setIsCreating(false);
        }
    };

    if (isCreating) {
        return <LoaderOne />;
    }

    if (step === 'role-selection') {
        return (
            <div className="onboarding">
                <div className="onboarding-container">
                    <div className="onboarding-header">
                        <div className="logo-container">
                            <div className="logo-icon">
                                <img src="/Gemini_Generated_Image_k7yesqk7yesqk7ye.png" alt="Focusly Logo" />
                            </div>
                            <h1 className="logo-text">Focusly</h1>
                        </div>
                        <p className="tagline">Execution-first workspace</p>
                    </div>

                    <div className="onboarding-content">
                        <div className="content-header">
                            <h2>Choose Workspace</h2>
                            <p>Select a role to get a tailored environment</p>
                        </div>

                        <div className="role-grid">
                            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                                const RoleIcon = ROLE_ICONS[roleKey];
                                return (
                                    <button
                                        key={roleKey}
                                        className="role-card"
                                        onClick={() => handleRoleSelect(roleKey)}
                                    >
                                        <div className="role-card-icon">
                                            <RoleIcon size={24} />
                                        </div>
                                        <div className="role-card-content">
                                            <h3>{config.name}</h3>
                                            <p>{config.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'context-collection') {
        const config = ROLE_CONFIG[selectedRole];
        const RoleIcon = ROLE_ICONS[selectedRole];

        return (
            <div className="onboarding">
                <div className="onboarding-container">
                    <div className="onboarding-header-nav">
                        <button
                            className="btn btn-ghost btn-sm p-0 hover:bg-transparent"
                            onClick={() => setStep('role-selection')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="role-badge-nav">
                            <RoleIcon size={14} />
                            <span>{config.name}</span>
                        </div>
                    </div>

                    <div className="onboarding-content">
                        <div className="content-header">
                            <h2>Customize</h2>
                            <p>Tailor your workspace to your needs</p>
                        </div>

                        <form className="onboarding-form">
                            {config.onboardingQuestions.map(question => (
                                <div key={question.id} className="form-group">
                                    <label htmlFor={question.id} className="form-label">
                                        {question.question}
                                        {question.required && <span className="text-error"> *</span>}
                                    </label>

                                    {question.type === 'text' && (
                                        <input
                                            type="text"
                                            id={question.id}
                                            className="input"
                                            placeholder={question.placeholder}
                                            value={formData[question.id] || ''}
                                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                                        />
                                    )}

                                    {question.type === 'number' && (
                                        <input
                                            type="number"
                                            id={question.id}
                                            className="input"
                                            min={question.min}
                                            max={question.max}
                                            value={formData[question.id] || question.default || ''}
                                            onChange={(e) => handleInputChange(question.id, parseInt(e.target.value))}
                                        />
                                    )}

                                    {question.type === 'select' && (
                                        <select
                                            id={question.id}
                                            className="select"
                                            value={formData[question.id] || ''}
                                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {question.options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {question.type === 'multi-text' && (
                                        <div className="multi-text-input">
                                            <div className="multi-text-list">
                                                {(formData[question.id] || []).map((item, index) => (
                                                    <div key={index} className="multi-text-item">
                                                        <span>{item}</span>
                                                        <X
                                                            size={14}
                                                            className="multi-text-remove"
                                                            onClick={() => handleMultiTextRemove(question.id, index)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="multi-text-input-wrapper">
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder={question.placeholder}
                                                    ref={(el) => { multiTextRefs.current[question.id] = el; }}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleMultiTextAdd(question.id, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="multi-text-add-btn"
                                                    onClick={() => {
                                                        const input = multiTextRefs.current[question.id];
                                                        if (input && input.value) {
                                                            handleMultiTextAdd(question.id, input.value);
                                                            input.value = '';
                                                            input.focus();
                                                        }
                                                    }}
                                                    title="Add item"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {question.type === 'date-list' && (
                                        <div className="date-list-input">
                                            <div className="date-list">
                                                {(formData[question.id] || []).map((item, index) => (
                                                    <div key={index} className="date-list-item">
                                                        <span>{item}</span>
                                                        <X
                                                            size={14}
                                                            className="date-list-remove"
                                                            onClick={() => handleDateRemove(question.id, index)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <input
                                                type="date"
                                                className="input"
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleDateAdd(question.id, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </form>

                        <div className="onboarding-actions">
                            <button
                                className="btn btn-primary"
                                disabled={isCreating}
                                onClick={handleComplete}
                            >
                                {isCreating ? 'Creating...' : 'Get Started'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default Onboarding;
