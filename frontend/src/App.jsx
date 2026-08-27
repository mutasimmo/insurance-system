// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import FamilyView from './components/FamilyView';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import { authService } from './services/api';
import './App.css';

// =============================================
// مكون خاص بالمسارات المحمية
// =============================================
const ProtectedRoute = ({ children, isLoggedIn }) => {
    const location = useLocation();
    
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
};

// =============================================
// المكون الرئيسي للتطبيق
// =============================================
const AppContent = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // =============================================
    // التحقق من الجلسة عند التحميل
    // =============================================
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            authService.verify()
                .then(response => {
                    if (response.data.success) {
                        setUser(response.data.user);
                        setIsLoggedIn(true);
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // =============================================
    // دوال المصادقة
    // =============================================
    const handleLogin = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
        navigate('/');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsLoggedIn(false);
        navigate('/login');
    };

    // =============================================
    // شاشة التحميل
    // =============================================
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>⏳ جاري التحقق من الجلسة...</p>
            </div>
        );
    }

    // =============================================
    // التنقل بين الصفحات
    // =============================================
    const navigateTo = (page) => {
        setCurrentPage(page);
        if (page === 'dashboard') {
            navigate('/');
        } else if (page === 'family') {
            navigate('/family');
        }
    };

    // =============================================
    // الواجهة الرئيسية (بعد تسجيل الدخول)
    // =============================================
    return (
        <div className="app">
            <nav className="navbar">
                <div className="navbar-brand">
                    <span className="brand-icon">🏥</span>
                    <span className="brand-text">نظام التأمين الطبي</span>
                </div>
                <div className="navbar-center">
                    <button 
                        className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
                        onClick={() => navigateTo('dashboard')}
                    >
                        📊 لوحة التحكم
                    </button>
                    <button 
                        className={`nav-btn ${currentPage === 'family' ? 'active' : ''}`}
                        onClick={() => navigateTo('family')}
                    >
                        👨‍👩‍👧‍👦 إدارة العائلات
                    </button>
                </div>
                <div className="navbar-right">
                    <span className="user-name">👤 {user?.full_name || user?.username}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        🚪 خروج
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/family" 
                        element={
                            <ProtectedRoute isLoggedIn={isLoggedIn}>
                                <FamilyView />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="*" 
                        element={<Navigate to="/" replace />} 
                    />
                </Routes>
            </main>
        </div>
    );
};

// =============================================
// المكون الرئيسي مع Router
// =============================================
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/*" element={<AppContent />} />
            </Routes>
        </Router>
    );
}

export default App;