import { useState, useEffect } from 'react';
import {
    Settings, User, Shield, Bell, Zap,
    Trash2, Download, LogOut, ChevronRight,
    Clock, Calendar, Target
} from 'lucide-react';
import dbService from '../services/database';
import { useModal } from '../context/ModalContext';
import { cn } from '../lib/utils';
import { LoaderOne } from './ui/loader';
import './SettingsView.css';

function SettingsView({ workspaceId, workspace, onRefresh }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useModal();

    useEffect(() => {
        if (workspace) {
            setSettings(workspace);
            setLoading(false);
        }
    }, [workspace]);

    const handleUpdateSetting = async (key, value) => {
        try {
            const updated = { ...settings, [key]: value };
            await dbService.update('workspaces', updated);
            setSettings(updated);
            onRefresh();
        } catch (error) {
            console.error('Failed to update setting:', error);
            showAlert('Error', 'Failed to update setting.', 'error');
        }
    };

    const handleResetWorkspace = async () => {
        const confirmed = window.confirm('Are you sure you want to reset this workspace? All data will be permanently deleted.');
        if (!confirmed) return;

        try {
            await dbService.clearAll();
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset workspace:', error);
            showAlert('Error', 'Failed to reset workspace.', 'error');
        }
    };

    if (loading) return <LoaderOne />;

    return (
        <div className="settings-view animate-spring">
            <header className="view-header">
                <h1>Settings</h1>
                <p>Manage your workspace and execution preferences.</p>
            </header>

            <div className="settings-container">
                {/* Workspace Section */}
                <section className="settings-section">
                    <div className="section-header">
                        <Target size={18} />
                        <h3>Workspace</h3>
                    </div>
                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-title">Daily Time Capacity</div>
                                <div className="setting-desc">Maximum focused minutes per day</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="number"
                                    className="input input-sm w-24"
                                    value={settings.dailyTimeLimit}
                                    onChange={(e) => handleUpdateSetting('dailyTimeLimit', parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-title">Weekly Review Day</div>
                                <div className="setting-desc">Day to perform deep execution audit</div>
                            </div>
                            <div className="setting-control">
                                <select
                                    className="select select-sm"
                                    value={settings.weeklyReviewDay}
                                    onChange={(e) => handleUpdateSetting('weeklyReviewDay', parseInt(e.target.value))}
                                >
                                    <option value={0}>Sunday</option>
                                    <option value={1}>Monday</option>
                                    <option value={2}>Tuesday</option>
                                    <option value={3}>Wednesday</option>
                                    <option value={4}>Thursday</option>
                                    <option value={5}>Friday</option>
                                    <option value={6}>Saturday</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Section */}
                <section className="settings-section">
                    <div className="section-header">
                        <Zap size={18} />
                        <h3>AI & Automation</h3>
                    </div>
                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-title">AI Aggressiveness</div>
                                <div className="setting-desc">How strictly AI enforces time constraints</div>
                            </div>
                            <div className="setting-control">
                                <select
                                    className="select select-sm"
                                    value={settings.settings?.aiAggressiveness || 'balanced'}
                                    onChange={(e) => handleUpdateSetting('settings', { ...settings.settings, aiAggressiveness: e.target.value })}
                                >
                                    <option value="relaxed">Relaxed</option>
                                    <option value="balanced">Balanced</option>
                                    <option value="strict">Strict (Execution-First)</option>
                                </select>
                            </div>
                        </div>

                        <div className="setting-item toggle-item">
                            <div className="setting-info">
                                <div className="setting-title">Auto-Reschedule Overdue</div>
                                <div className="setting-desc">Automatically carry over missed tasks to today</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="checkbox"
                                    className="toggle"
                                    checked={settings.settings?.autoCarryOver || false}
                                    onChange={(e) => handleUpdateSetting('settings', { ...settings.settings, autoCarryOver: e.target.checked })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Section */}
                <section className="settings-section">
                    <div className="section-header">
                        <Shield size={18} />
                        <h3>Data & Privacy</h3>
                    </div>
                    <div className="settings-list">
                        <button className="setting-item action-item" onClick={() => showAlert('Coming Soon', 'Data export will be available in the next update.', 'info')}>
                            <div className="setting-info">
                                <div className="setting-title">Export Data</div>
                                <div className="setting-desc">Download all your workspace data as JSON</div>
                            </div>
                            <Download size={18} className="text-secondary" />
                        </button>

                        <button className="setting-item action-item danger" onClick={handleResetWorkspace}>
                            <div className="setting-info">
                                <div className="setting-title">Reset All Data</div>
                                <div className="setting-desc">Permanently delete all workspaces and history</div>
                            </div>
                            <Trash2 size={18} />
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SettingsView;
