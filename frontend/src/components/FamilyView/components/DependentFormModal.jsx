// frontend/src/components/FamilyView/components/DependentFormModal.jsx
import React, { useState } from 'react';
import api from '../../../services/api';
import './DependentFormModal.css';

const DependentFormModal = ({ title, onClose, onSuccess, sponsorId, mode, dependentData }) => {
    const [formData, setFormData] = useState({
        full_name: dependentData?.full_name || '',
        date_of_birth: dependentData?.date_of_birth || '',
        relationship: dependentData?.relationship || 'ابن'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let response;
            if (mode === 'add') {
                response = await api.post('/dependents', {
                    sponsor_id: sponsorId,
                    ...formData
                });
            } else {
                response = await api.put(`/dependents/${dependentData.id}`, formData);
            }
            
            const data = response.data;
            if (data.success) {
                alert(data.message || (mode === 'add' ? '✅ تم إضافة المكفول بنجاح' : '✅ تم تحديث المكفول بنجاح'));
                onSuccess();
            } else {
                setError(data.message || 'حدث خطأ');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const isFirstOnly = ['ابن', 'ابنة'].includes(formData.relationship);
    const getNamePlaceholder = (rel) => {
        const placeholders = {
            'ابن': 'مثال: خالد (الاسم الأول فقط)',
            'ابنة': 'مثال: نورا (الاسم الأول فقط)',
            'زوج': 'مثال: أحمد محمد (الاسم الكامل)',
            'زوجة': 'مثال: مريم علي (الاسم الكامل)',
            'أب': 'مثال: محمد أحمد (الاسم الكامل)',
            'أم': 'مثال: فاطمة علي (الاسم الكامل)'
        };
        return placeholders[rel] || 'أدخل الاسم';
    };

    return (
        <div className="dependent-modal-overlay" onClick={onClose}>
            <div className="dependent-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="dependent-modal-title">{title}</h2>
                
                <div className={`dependent-hint-box ${isFirstOnly ? 'hint-first' : 'hint-full'}`}>
                    <p className="dependent-hint-text">
                        💡 {isFirstOnly 
                            ? 'الاسم الأول فقط (سيتم إكماله تلقائياً باسم الأب)' 
                            : 'الاسم الكامل (الاسم + اسم الأب)'}
                    </p>
                </div>

                {error && <div className="dependent-modal-error">❌ {error}</div>}
                
                <form onSubmit={handleSubmit} className="dependent-modal-form">
                    <div className="dependent-form-group">
                        <label className="dependent-form-label">الاسم *</label>
                        <input
                            type="text"
                            required
                            className="dependent-form-input"
                            placeholder={getNamePlaceholder(formData.relationship)}
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        />
                        <small className="dependent-hint-small">
                            {isFirstOnly 
                                ? '✏️ أدخل الاسم الأول فقط (مثال: خالد)' 
                                : '✏️ أدخل الاسم الكامل (مثال: أحمد محمد)'}
                        </small>
                    </div>

                    <div className="dependent-form-group">
                        <label className="dependent-form-label">تاريخ الميلاد *</label>
                        <input
                            type="date"
                            required
                            className="dependent-form-input"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        />
                    </div>

                    <div className="dependent-form-group">
                        <label className="dependent-form-label">الصلة *</label>
                        <select
                            className="dependent-form-select"
                            value={formData.relationship}
                            onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                        >
                            <option value="أب">أب (اسم كامل)</option>
                            <option value="أم">أم (اسم كامل)</option>
                            <option value="زوج">زوج (اسم كامل)</option>
                            <option value="زوجة">زوجة (اسم كامل)</option>
                            <option value="ابن">ابن (اسم أول + إكمال تلقائي)</option>
                            <option value="ابنة">ابنة (اسم أول + إكمال تلقائي)</option>
                        </select>
                    </div>

                    <div className="dependent-modal-buttons">
                        <button type="submit" className="dependent-btn-submit" disabled={loading}>
                            {loading ? '⏳ جاري...' : mode === 'add' ? '✅ إضافة' : '✅ تحديث'}
                        </button>
                        <button type="button" className="dependent-btn-cancel" onClick={onClose}>
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DependentFormModal;