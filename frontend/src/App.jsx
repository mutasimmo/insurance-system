import React, { useState, useEffect } from 'react';
import FamilyView from './components/FamilyView';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import { authService } from './services/api';
import './App.css';

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const handleLogin = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
        setCurrentPage('dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsLoggedIn(false);
        setCurrentPage('dashboard');
    };

    // التحقق من المسار الحالي
    const path = window.location.pathname;

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>⏳ جاري التحقق من الجلسة...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        if (path === '/register') {
            return <Register />;
        }
        return <Login onLogin={handleLogin} />;
    }

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
                        onClick={() => setCurrentPage('dashboard')}
                    >
                        📊 لوحة التحكم
                    </button>
                    <button 
                        className={`nav-btn ${currentPage === 'family' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('family')}
                    >
                        👨‍👩‍👧‍👦 إدارة العائلات
                    </button>
                </div>
                <div className="navbar-right">
                    <span className="user-name">👤 {user?.full_name}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        🚪 خروج
                    </button>
                </div>
            </nav>

            <main className="main-content">
                {currentPage === 'dashboard' ? <Dashboard /> : <FamilyView />}
            </main>
        </div>
    );
}

export default App;