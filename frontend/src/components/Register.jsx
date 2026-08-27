// frontend/src/components/Register.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { authService } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // التحقق من تطابق كلمة المرور
        if (formData.password !== formData.confirmPassword) {
            setError('كلمة المرور غير متطابقة');
            toast.error('❌ كلمة المرور غير متطابقة');
            setLoading(false);
            return;
        }

        // التحقق من طول كلمة المرور
        if (formData.password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            toast.error('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            setLoading(false);
            return;
        }

        // التحقق من اسم المستخدم
        if (formData.username.length < 3) {
            setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
            toast.error('❌ اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
            setLoading(false);
            return;
        }

        // التحقق من الاسم الكامل
        if (formData.full_name.length < 3) {
            setError('الاسم الكامل يجب أن يكون 3 أحرف على الأقل');
            toast.error('❌ الاسم الكامل يجب أن يكون 3 أحرف على الأقل');
            setLoading(false);
            return;
        }

        try {
            const response = await authService.register({
                username: formData.username,
                password: formData.password,
                full_name: formData.full_name,
                email: formData.email || null
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                toast.success('✅ تم إنشاء الحساب بنجاح!');
                toast.success('👋 سيتم تحويلك إلى صفحة تسجيل الدخول');
                
                // تنظيف النموذج
                setFormData({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    full_name: '',
                    email: ''
                });

                // الانتقال إلى صفحة تسجيل الدخول بعد 2 ثانية
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2500);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'حدث خطأ في إنشاء الحساب';
            setError(errorMessage);
            toast.error(`❌ ${errorMessage}`);
            console.error('❌ خطأ في التسجيل:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.headerH1}>🏥 نظام التأمين الطبي</h1>
                    <p style={styles.headerP}>إنشاء حساب جديد</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.formGroupLabel}>الاسم الكامل *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            placeholder="أدخل الاسم الكامل (3 أحرف على الأقل)"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formGroupLabel}>اسم المستخدم *</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            placeholder="أدخل اسم المستخدم (3 أحرف على الأقل)"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formGroupLabel}>كلمة المرور *</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formGroupLabel}>تأكيد كلمة المرور *</label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            placeholder="أعد إدخال كلمة المرور"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formGroupLabel}>البريد الإلكتروني (اختياري)</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="أدخل البريد الإلكتروني"
                            style={styles.input}
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={{
                            ...styles.button,
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                        disabled={loading}
                    >
                        {loading ? '⏳ جاري إنشاء الحساب...' : '✅ إنشاء حساب'}
                    </button>
                </form>

                <p style={styles.footer}>
                    لديك حساب؟ <a href="/login" style={styles.link}>تسجيل الدخول</a>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '20px'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        direction: 'rtl'
    },
    header: {
        textAlign: 'center',
        marginBottom: '25px'
    },
    headerH1: {
        color: '#2c3e50',
        fontSize: '24px',
        marginBottom: '5px'
    },
    headerP: {
        color: '#7f8c8d',
        fontSize: '16px'
    },
    error: {
        backgroundColor: '#fde8e8',
        color: '#e74c3c',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '15px',
        textAlign: 'center',
        border: '1px solid #f5c6cb'
    },
    success: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '15px',
        textAlign: 'center',
        border: '1px solid #c3e6cb'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    formGroupLabel: {
        fontWeight: '600',
        color: '#2c3e50',
        fontSize: '14px'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '10px',
        border: '2px solid #e0e0e0',
        fontSize: '15px',
        transition: 'border 0.3s',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl'
    },
    button: {
        padding: '14px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'Cairo, sans-serif'
    },
    buttonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed',
        transform: 'none !important'
    },
    footer: {
        textAlign: 'center',
        marginTop: '18px',
        color: '#7f8c8d',
        fontSize: '14px'
    },
    link: {
        color: '#3498db',
        textDecoration: 'none',
        fontWeight: '600'
    }
};

export default Register;