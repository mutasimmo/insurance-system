import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import api from '../services/api';
import { 
    FaUsers, 
    FaUserPlus, 
    FaChild, 
    FaUser, 
    FaUserGraduate,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaChartLine,
    FaClock
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_sponsors: 0,
        total_dependents: 0,
        children: 0,
        adults: 0,
        seniors: 0,
        expiring_soon: 0
    });
    const [recentSponsors, setRecentSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard');
            const data = response.data;
            if (data.success) {
                setStats({
                    total_sponsors: data.stats?.total_sponsors || 0,
                    total_dependents: data.stats?.total_dependents || 0,
                    children: data.stats?.children || 0,
                    adults: data.stats?.adults || 0,
                    seniors: data.stats?.seniors || 0,
                    expiring_soon: data.stats?.expiring_soon || 0
                });
            }
        } catch (err) {
            setError('فشل في جلب الإحصائيات');
            console.error('Dashboard error:', err);
        }
    }, []);

    const fetchRecentSponsors = useCallback(async () => {
        try {
            const response = await api.get('/sponsors');
            const data = response.data;
            if (data.success) {
                setRecentSponsors(data.sponsors || []);
            }
        } catch (err) {
            console.error('خطأ في جلب الكافلين');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
        fetchRecentSponsors();
        
        const interval = setInterval(() => {
            fetchDashboardData();
            fetchRecentSponsors();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [fetchDashboardData, fetchRecentSponsors]);

    const calculateAge = (birthDate) => {
        if (!birthDate) return '—';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num;
    };

    const StatCard = ({ icon, title, value, color, subtitle }) => (
        <div className={`stat-card ${color}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
                <h3>{title}</h3>
                <p className="stat-number">
                    {loading ? <Skeleton width={60} /> : formatNumber(value)}
                </p>
                {subtitle && <span className="stat-subtitle">{subtitle}</span>}
            </div>
        </div>
    );

    StatCard.propTypes = {
        icon: PropTypes.node.isRequired,
        title: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string.isRequired,
        subtitle: PropTypes.string
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard-header">
                    <Skeleton height={40} width={200} />
                    <Skeleton height={20} width={300} />
                </div>
                <div className="stats-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="stat-card">
                            <Skeleton circle height={50} width={50} />
                            <Skeleton height={30} width={100} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>📊 لوحة التحكم</h1>
                <p>نظرة عامة على نظام التأمين الطبي</p>
                <div className="header-time">
                    <FaClock />
                    <span>{new Date().toLocaleString('ar-SA')}</span>
                </div>
            </div>

            {error && <div className="dashboard-error">❌ {error}</div>}

            <div className="stats-grid">
                <StatCard
                    icon={<FaUsers />}
                    title="إجمالي الكافلين"
                    value={stats.total_sponsors}
                    color="primary"
                />
                <StatCard
                    icon={<FaUserPlus />}
                    title="إجمالي المكفولين"
                    value={stats.total_dependents}
                    color="success"
                />
                <StatCard
                    icon={<FaChild />}
                    title="الأطفال"
                    value={stats.children}
                    color="warning"
                    subtitle="أقل من 18 سنة"
                />
                <StatCard
                    icon={<FaUser />}
                    title="البالغين"
                    value={stats.adults}
                    color="info"
                    subtitle="18 - 60 سنة"
                />
                <StatCard
                    icon={<FaUserGraduate />}
                    title="كبار السن"
                    value={stats.seniors}
                    color="danger"
                    subtitle="أكثر من 60 سنة"
                />
                <StatCard
                    icon={<FaExclamationTriangle />}
                    title="ينتهي اشتراكهم قريباً"
                    value={stats.expiring_soon}
                    color="warning"
                    subtitle="أقل من 30 يوماً"
                />
            </div>

            <div className="charts-section">
                <div className="chart-card">
                    <h3>📊 توزيع المكفولين حسب الفئة العمرية</h3>
                    {stats.total_dependents === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🕊️</span>
                            <p>لا يوجد مكفولين حتى الآن</p>
                            <small>أضف كافلاً جديداً للبدء</small>
                        </div>
                    ) : (
                        <div className="chart-bars">
                            <div className="chart-bar-container">
                                <div className="chart-bar-label">أطفال</div>
                                <div className="chart-bar-track">
                                    <div 
                                        className="chart-bar-fill children-bar"
                                        style={{ width: `${(stats.children / stats.total_dependents) * 100}%` }}
                                    >
                                        {stats.children}
                                    </div>
                                </div>
                            </div>
                            <div className="chart-bar-container">
                                <div className="chart-bar-label">بالغين</div>
                                <div className="chart-bar-track">
                                    <div 
                                        className="chart-bar-fill adults-bar"
                                        style={{ width: `${(stats.adults / stats.total_dependents) * 100}%` }}
                                    >
                                        {stats.adults}
                                    </div>
                                </div>
                            </div>
                            <div className="chart-bar-container">
                                <div className="chart-bar-label">كبار السن</div>
                                <div className="chart-bar-track">
                                    <div 
                                        className="chart-bar-fill seniors-bar"
                                        style={{ width: `${(stats.seniors / stats.total_dependents) * 100}%` }}
                                    >
                                        {stats.seniors}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="chart-card">
                    <h3>🕒 أحدث الكافلين</h3>
                    {recentSponsors.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🕊️</span>
                            <p>لا يوجد كافلين حتى الآن</p>
                        </div>
                    ) : (
                        <div className="recent-sponsors">
    {recentSponsors.slice(0, 5).map(sponsor => {
        // استخراج عدد المكفولين بشكل صحيح
        let dependentsCount = 0;
        if (sponsor.dependents_count) {
            if (typeof sponsor.dependents_count === 'object') {
                dependentsCount = sponsor.dependents_count.count || 0;
            } else {
                dependentsCount = sponsor.dependents_count;
            }
        }
        
        return (
            <div key={sponsor.id} className="recent-item">
                <div className="recent-avatar">
                    {sponsor.full_name?.charAt(0) || '?'}
                </div>
                <div className="recent-info">
                    <div className="recent-name">{sponsor.full_name}</div>
                    <div className="recent-details">
                        <span>👤 {dependentsCount} مكفول</span>
                        <span>🎂 {calculateAge(sponsor.date_of_birth)} سنة</span>
                    </div>
                </div>
                <span className={`recent-status ${sponsor.is_active ? 'active' : 'inactive'}`}>
                    {sponsor.is_active ? '✅ نشط' : '❌ غير نشط'}
                </span>
            </div>
        );
    })}
</div>
                    )}
                </div>
            </div>

            <div className="quick-stats">
                <div className="quick-stat">
                    <FaCheckCircle className="quick-icon success" />
                    <div>
                        <span className="quick-label">مكفولين نشطين</span>
                        <span className="quick-value">{stats.total_dependents}</span>
                    </div>
                </div>
                <div className="quick-stat">
                    <FaTimesCircle className="quick-icon danger" />
                    <div>
                        <span className="quick-label">مكفولين منتهية اشتراكاتهم</span>
                        <span className="quick-value">0</span>
                    </div>
                </div>
                <div className="quick-stat">
                    <FaChartLine className="quick-icon info" />
                    <div>
                        <span className="quick-label">نسبة الأطفال</span>
                        <span className="quick-value">
                            {stats.total_dependents > 0 
                                ? Math.round((stats.children / stats.total_dependents) * 100) 
                                : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;