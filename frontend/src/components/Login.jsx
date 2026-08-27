import React, { useState } from 'react';
import { authService } from '../services/api';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login(username, password);
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onLogin(response.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.headerH1}>🏥 نظام التأمين الطبي</h1>
                    <p style={styles.headerP}>تسجيل الدخول</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.formGroupLabel}>اسم المستخدم</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="أدخل اسم المستخدم"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.formGroupLabel}>كلمة المرور</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            required
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
                        {loading ? '⏳ جاري تسجيل الدخول...' : '🚪 تسجيل الدخول'}
                    </button>
                </form>

                <p style={styles.footer}>
                    ليس لديك حساب؟ <a href="/register" style={styles.link}>سجل الآن</a>
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
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        direction: 'rtl'
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px'
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
        marginBottom: '20px',
        textAlign: 'center'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
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
        fontSize: '16px',
        transition: 'border 0.3s',
        fontFamily: 'inherit'
    },
    button: {
        padding: '14px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.3s',
        fontFamily: 'Cairo, sans-serif'
    },
    buttonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed'
    },
    footer: {
        textAlign: 'center',
        marginTop: '20px',
        color: '#7f8c8d'
    },
    link: {
        color: '#3498db',
        textDecoration: 'none',
        fontWeight: '600'
    }
};

export default Login;