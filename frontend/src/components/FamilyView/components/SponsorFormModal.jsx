// frontend/src/components/FamilyView/components/SponsorFormModal.jsx
import React, { useState } from 'react';
import api from '../../../services/api';
import './SponsorFormModal.css';

const SponsorFormModal = ({ title, onClose, onSuccess, mode, sponsorData }) => {
    const [formData, setFormData] = useState({
        full_name: sponsorData?.full_name || '',
        date_of_birth: sponsorData?.date_of_birth || '',
        subscription_start: sponsorData?.subscription_start || ''
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
                response = await api.post('/sponsors', formData);
            } else {
                response = await api.put(`/sponsors/${sponsorData.id}`, formData);
            }
            
            const data = response.data;
            if (data.success) {
                alert(mode === 'add' ? '✅ تم إضافة الكافل بنجاح' : '✅ تم تحديث الكافل بنجاح');
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">{title}</h2>
                {error && <div className="modal-error">❌ {error}</div>}
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">الاسم الكامل *</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="أدخل الاسم الكامل"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">تاريخ الميلاد *</label>
                        <input
                            type="date"
                            required
                            className="form-input"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">تاريخ بدء الاشتراك *</label>
                        <input
                            type="date"
                            required
                            className="form-input"
                            value={formData.subscription_start}
                            onChange={(e) => setFormData({...formData, subscription_start: e.target.value})}
                        />
                    </div>
                    <div className="modal-buttons">
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? '⏳ جاري...' : mode === 'add' ? '✅ إضافة' : '✅ تحديث'}
                        </button>
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SponsorFormModal;