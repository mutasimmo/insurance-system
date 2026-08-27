import React, { useState } from 'react';

const AddSponsor = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        phone: '',
        email: '',
        subscription_start: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // حساب تاريخ الانتهاء (بعد سنة من تاريخ البدء)
    const calculateEndDate = (startDate) => {
        if (!startDate) return '';
        const date = new Date(startDate);
        date.setFullYear(date.getFullYear() + 1);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // حساب تاريخ الانتهاء تلقائياً
        const subscription_end = calculateEndDate(formData.subscription_start);

        const dataToSend = {
            ...formData,
            subscription_end
        };

        try {
            const response = await fetch('http://localhost:5000/api/sponsors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ تم إضافة الكافل بنجاح! المعرف (ID): ${data.data.id}\n📅 مدة الاشتراك: سنة واحدة (${formData.subscription_start} → ${subscription_end})`);
                setFormData({
                    full_name: '',
                    date_of_birth: '',
                    phone: '',
                    email: '',
                    subscription_start: ''
                });
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'حدث خطأ');
            }
        } catch (err) {
            setError('فشل الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.title}>➕ إضافة كافل جديد</h2>
                <p style={styles.note}>📅 مدة الاشتراك: سنة واحدة تلقائياً من تاريخ البدء</p>
                
                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.group}>
                        <label>الاسم الكامل *</label>
                        <input
                            type="text"
                            required
                            placeholder="أدخل الاسم الكامل"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label>تاريخ الميلاد *</label>
                        <input
                            type="date"
                            required
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label>تاريخ بدء الاشتراك *</label>
                        <input
                            type="date"
                            required
                            value={formData.subscription_start}
                            onChange={(e) => setFormData({...formData, subscription_start: e.target.value})}
                            style={styles.input}
                        />
                        {formData.subscription_start && (
                            <small style={styles.hint}>
                                📅 ينتهي الاشتراك في: {calculateEndDate(formData.subscription_start)}
                            </small>
                        )}
                    </div>

                    <div style={styles.group}>
                        <label>الهاتف (اختياري)</label>
                        <input
                            type="text"
                            placeholder="أدخل رقم الهاتف"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.group}>
                        <label>البريد الإلكتروني (اختياري)</label>
                        <input
                            type="email"
                            placeholder="أدخل البريد الإلكتروني"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.buttons}>
                        <button type="submit" style={styles.submit} disabled={loading}>
                            {loading ? '⏳ جاري الإضافة...' : '✅ إضافة كافل'}
                        </button>
                        <button type="button" onClick={onClose} style={styles.cancel}>
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(3px)'
    },
    modal: {
        backgroundColor: 'white',
        padding: '35px',
        borderRadius: '15px',
        width: '95%',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
    },
    title: {
        textAlign: 'center',
        color: '#2c3e50',
        marginBottom: '5px',
        borderBottom: '2px solid #3498db',
        paddingBottom: '10px'
    },
    note: {
        textAlign: 'center',
        color: '#27ae60',
        fontSize: '14px',
        marginBottom: '20px'
    },
    error: {
        backgroundColor: '#fde8e8',
        color: '#e74c3c',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '15px',
        textAlign: 'center'
    },
    hint: {
        color: '#7f8c8d',
        fontSize: '13px',
        marginTop: '5px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    input: {
        padding: '12px 14px',
        borderRadius: '8px',
        border: '2px solid #ddd',
        fontSize: '15px',
        transition: 'border 0.3s'
    },
    buttons: {
        display: 'flex',
        gap: '12px',
        marginTop: '15px'
    },
    submit: {
        flex: 1,
        padding: '14px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background 0.3s'
    },
    cancel: {
        flex: 1,
        padding: '14px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background 0.3s'
    }
};

export default AddSponsor;