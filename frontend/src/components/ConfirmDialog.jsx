// frontend/src/components/ConfirmDialog.jsx
import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onClose}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">⚠️</div>
                <h2 className="confirm-title">{title || 'تأكيد'}</h2>
                <p className="confirm-message">{message || 'هل أنت متأكد؟'}</p>
                <div className="confirm-buttons">
                    <button className="confirm-btn confirm-btn-yes" onClick={onConfirm}>
                        {confirmText || 'نعم'}
                    </button>
                    <button className="confirm-btn confirm-btn-no" onClick={onClose}>
                        {cancelText || 'لا'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;