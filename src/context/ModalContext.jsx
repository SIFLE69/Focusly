import { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, HelpCircle, Info, Zap } from 'lucide-react';
import '../components/ui/Modal.css';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [modal, setModal] = useState(null);

    const showAlert = useCallback((title, message, iconType = 'info') => {
        return new Promise((resolve) => {
            setModal({
                title,
                message,
                type: 'alert',
                iconType,
                onConfirm: () => {
                    setModal(null);
                    resolve(true);
                }
            });
        });
    }, []);

    const showConfirm = useCallback((title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', isDestructive = false) => {
        return new Promise((resolve) => {
            setModal({
                title,
                message,
                type: 'confirm',
                confirmLabel,
                cancelLabel,
                isDestructive,
                onConfirm: () => {
                    setModal(null);
                    resolve(true);
                },
                onCancel: () => {
                    setModal(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {modal && <ModalComponent {...modal} />}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}

function ModalComponent({ title, message, type, iconType, confirmLabel, cancelLabel, onConfirm, onCancel, isDestructive }) {
    const renderIcon = () => {
        const size = 32;
        switch (iconType) {
            case 'error': return <AlertCircle size={size} className="text-error" />;
            case 'warning': return <AlertCircle size={size} className="text-warning" />;
            case 'success': return <Zap size={size} className="text-success" fill="currentColor" />;
            default: return <Info size={size} className="text-accent" />;
        }
    };

    return (
        <div className="modal-overlay" onClick={type === 'alert' ? onConfirm : undefined}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-icon">
                    {renderIcon()}
                </div>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>

                <div className={`modal-actions ${type === 'confirm' ? 'row' : ''}`}>
                    {type === 'confirm' && (
                        <button className="modal-btn" onClick={onCancel}>
                            {cancelLabel || 'Cancel'}
                        </button>
                    )}
                    <button
                        className={`modal-btn modal-btn-primary ${isDestructive ? 'modal-btn-destructive' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}
