import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FamilyView = () => {
    const [sponsors, setSponsors] = useState([]);
    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const [dependents, setDependents] = useState([]);
    const [statistics, setStatistics] = useState({ total: 0, children: 0, adults: 0, seniors: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [showAddSponsor, setShowAddSponsor] = useState(false);
    const [showEditSponsor, setShowEditSponsor] = useState(false);
    const [showAddDependent, setShowAddDependent] = useState(false);
    const [showEditDependent, setShowEditDependent] = useState(false);
    const [selectedDependent, setSelectedDependent] = useState(null);

    // =============================================
    // دوال مساعدة
    // =============================================
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

    const getRelationshipColor = (relationship) => {
        const colors = {
            'زوج': '#2196F3',
            'زوجة': '#E91E63',
            'أب': '#4CAF50',
            'أم': '#FF9800',
            'ابن': '#00BCD4',
            'ابنة': '#9C27B0'
        };
        return colors[relationship] || '#607D8B';
    };

    const getRelationshipEmoji = (relationship) => {
        const emojis = {
            'زوج': '👨',
            'زوجة': '👩',
            'أب': '👨',
            'أم': '👩',
            'ابن': '👦',
            'ابنة': '👧'
        };
        return emojis[relationship] || '👤';
    };

    // =============================================
    // جلب البيانات
    // =============================================
    const fetchSponsors = async () => {
        setLoading(true);
        try {
            const response = await api.get('/sponsors');
            const data = response.data;
            if (data.success) {
                setSponsors(data.sponsors);
            }
        } catch (err) {
            setError('فشل في جلب البيانات');
            console.error('❌ خطأ في جلب الكافلين:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSponsorDetails = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`/sponsors/${id}`);
            const data = response.data;
            if (data.success) {
                setSelectedSponsor(data.sponsor);
                setDependents(data.dependents);
                setStatistics(data.statistics);
            }
        } catch (err) {
            setError('فشل في جلب تفاصيل الكافل');
            console.error('❌ خطأ في جلب تفاصيل الكافل:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, []);

    const handleSelectSponsor = (id) => {
        fetchSponsorDetails(id);
    };

    // =============================================
    // دوال الحذف
    // =============================================
    const handleDeleteSponsor = async () => {
        if (!selectedSponsor) return;
        
        if (window.confirm(`⚠️ هل أنت متأكد من حذف الكافل "${selectedSponsor.full_name}" وجميع المكفولين التابعين له؟`)) {
            try {
                const response = await api.delete(`/sponsors/${selectedSponsor.id}`);
                const data = response.data;
                if (data.success) {
                    alert('✅ تم حذف الكافل وجميع المكفولين التابعين له بنجاح');
                    setSelectedSponsor(null);
                    setDependents([]);
                    fetchSponsors();
                } else {
                    alert('❌ ' + (data.message || 'حدث خطأ'));
                }
            } catch (err) {
                alert('❌ فشل الاتصال بالخادم');
                console.error('❌ خطأ في حذف الكافل:', err);
            }
        }
    };

    const handleDeleteDependent = async (id, name) => {
        if (window.confirm(`⚠️ هل أنت متأكد من حذف "${name}"؟`)) {
            try {
                const response = await api.delete(`/dependents/${id}`);
                const data = response.data;
                if (data.success) {
                    alert('✅ تم حذف المكفول بنجاح');
                    if (selectedSponsor) {
                        fetchSponsorDetails(selectedSponsor.id);
                    }
                    fetchSponsors();
                } else {
                    alert('❌ ' + (data.message || 'حدث خطأ'));
                }
            } catch (err) {
                alert('❌ فشل الاتصال بالخادم');
                console.error('❌ خطأ في حذف المكفول:', err);
            }
        }
    };

    // =============================================
    // التنسيقات (Styles)
    // =============================================
    const styles = {
        container: {
            padding: '20px',
            fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
            direction: 'rtl',
            maxWidth: '1600px',
            margin: '0 auto',
            backgroundColor: '#f5f7fa',
            minHeight: '100vh'
        },
        header: {
            textAlign: 'center',
            padding: '25px 0',
            color: '#2c3e50',
            borderBottom: '4px solid #3498db',
            marginBottom: '25px',
            backgroundColor: 'white',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        },
        headerH1: {
            fontSize: '32px',
            margin: 0,
            color: '#2c3e50'
        },
        headerP: {
            fontSize: '16px',
            color: '#7f8c8d',
            margin: '5px 0 0'
        },
        actions: {
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        },
        btn: {
            padding: '10px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            fontFamily: 'Cairo, sans-serif',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        addSponsorBtn: {
            ...styles.btn,
            backgroundColor: '#9b59b6',
            color: 'white'
        },
        addDependentBtn: {
            ...styles.btn,
            backgroundColor: '#27ae60',
            color: 'white'
        },
        editSponsorBtn: {
            ...styles.btn,
            backgroundColor: '#f39c12',
            color: 'white'
        },
        deleteSponsorBtn: {
            ...styles.btn,
            backgroundColor: '#e74c3c',
            color: 'white'
        },
        mainLayout: {
            display: 'flex',
            gap: '20px',
            minHeight: '500px',
            flexWrap: 'wrap'
        },
        sponsorList: {
            width: '320px',
            minWidth: '250px',
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            maxHeight: '650px',
            overflowY: 'auto',
            border: '1px solid #e8ecf1',
            flex: '0 0 auto'
        },
        sponsorListTitle: {
            color: '#2c3e50',
            fontSize: '18px',
            borderBottom: '2px solid #3498db',
            paddingBottom: '10px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        sponsorItem: {
            padding: '12px 16px',
            marginBottom: '8px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            border: '1px solid #e8ecf1',
            backgroundColor: 'white'
        },
        sponsorItemHover: {
            transform: 'translateX(-4px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        },
        sponsorItemSelected: {
            backgroundColor: '#e3f2fd',
            borderColor: '#2196F3'
        },
        sponsorItemHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
        },
        sponsorItemName: {
            fontSize: '15px',
            fontWeight: '700',
            color: '#2c3e50'
        },
        sponsorItemId: {
            backgroundColor: '#3498db',
            color: 'white',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
        },
        sponsorItemDetails: {
            display: 'flex',
            gap: '12px',
            fontSize: '13px',
            color: '#7f8c8d',
            flexWrap: 'wrap'
        },
        detailsPanel: {
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e8ecf1',
            minHeight: '400px',
            minWidth: '300px'
        },
        emptyState: {
            textAlign: 'center',
            padding: '80px 20px',
            color: '#b0b8c4'
        },
        emptyStateH2: {
            fontSize: '24px',
            marginBottom: '10px'
        },
        emptyStateP: {
            fontSize: '16px'
        },
        sponsorCard: {
            marginBottom: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px'
        },
        sponsorHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '15px'
        },
        sponsorName: {
            fontSize: '22px',
            fontWeight: '700',
            color: '#2c3e50',
            margin: 0
        },
        sponsorGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
        },
        sponsorGridItem: {
            backgroundColor: 'white',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e8ecf1',
            fontSize: '14px'
        },
        sponsorGridLabel: {
            color: '#7f8c8d',
            fontSize: '12px',
            display: 'block'
        },
        sponsorGridValue: {
            fontWeight: '600',
            color: '#2c3e50'
        },
        statsContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            marginBottom: '20px'
        },
        statBox: {
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center',
            border: '1px solid #e8ecf1',
            transition: 'all 0.3s ease'
        },
        statNumber: {
            display: 'block',
            fontSize: '28px',
            fontWeight: '800',
            color: '#2c3e50'
        },
        statLabel: {
            fontSize: '13px',
            color: '#7f8c8d'
        },
        tableSection: {
            marginTop: '20px'
        },
        tableTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: '#2c3e50',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        tableWrapper: {
            overflowX: 'auto',
            borderRadius: '10px',
            border: '1px solid #e8ecf1'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            minWidth: '700px'
        },
        tableHead: {
            backgroundColor: '#f0f4f8'
        },
        tableHeadCell: {
            padding: '12px 16px',
            textAlign: 'right',
            fontWeight: '700',
            color: '#2c3e50',
            borderBottom: '2px solid #dde3e9',
            whiteSpace: 'nowrap'
        },
        tableRow: {
            borderBottom: '1px solid #eef2f7',
            transition: 'background 0.15s ease'
        },
        tableRowHover: {
            backgroundColor: '#f8f9fa'
        },
        tableCell: {
            padding: '10px 16px',
            verticalAlign: 'middle',
            color: '#2c3e50'
        },
        relationshipBadge: {
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: '20px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            whiteSpace: 'nowrap'
        },
        statusBadge: {
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            whiteSpace: 'nowrap'
        },
        activeBadge: {
            ...styles.statusBadge,
            color: '#27ae60',
            backgroundColor: '#e8f5e9'
        },
        inactiveBadge: {
            ...styles.statusBadge,
            color: '#e74c3c',
            backgroundColor: '#fde8e8'
        },
        warning: {
            color: '#e67e22',
            fontWeight: '700'
        },
        success: {
            color: '#27ae60',
            fontWeight: '700'
        },
        actionButtons: {
            display: 'flex',
            gap: '5px',
            flexWrap: 'wrap'
        },
        editButton: {
            padding: '4px 10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s ease'
        },
        deleteButton: {
            padding: '4px 10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s ease'
        },
        error: {
            backgroundColor: '#fde8e8',
            color: '#e74c3c',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '15px',
            textAlign: 'center',
            fontWeight: '600'
        },
        loading: {
            textAlign: 'center',
            padding: '40px',
            color: '#7f8c8d'
        },
        spinner: {
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #e8ecf1',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        },
        noData: {
            textAlign: 'center',
            padding: '40px',
            color: '#b0b8c4',
            fontSize: '16px'
        }
    };

    // =============================================
    // التصيير (Render)
    // =============================================
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.headerH1}>🏥 نظام التأمين الطبي</h1>
                <p style={styles.headerP}>إدارة الكافلين والمكفولين</p>
            </header>

            <div style={styles.actions}>
                <button 
                    onClick={() => setShowAddSponsor(true)} 
                    style={styles.addSponsorBtn}
                >
                    🏠 إضافة كافل
                </button>
                {selectedSponsor && (
                    <>
                        <button 
                            onClick={() => setShowAddDependent(true)} 
                            style={styles.addDependentBtn}
                        >
                            ➕ إضافة مكفول
                        </button>
                        <button 
                            onClick={() => setShowEditSponsor(true)} 
                            style={styles.editSponsorBtn}
                        >
                            ✏️ تعديل الكافل
                        </button>
                        <button 
                            onClick={handleDeleteSponsor} 
                            style={styles.deleteSponsorBtn}
                        >
                            🗑️ حذف الكافل
                        </button>
                    </>
                )}
            </div>

            {error && <div style={styles.error}>❌ {error}</div>}

            <div style={styles.mainLayout}>
                {/* ========== قائمة الكافلين ========== */}
                <div style={styles.sponsorList}>
                    <h3 style={styles.sponsorListTitle}>👨‍👩‍👧‍👦 قائمة الكافلين</h3>
                    
                    {loading && <div style={styles.loading}>⏳ جاري التحميل...</div>}
                    
                    {sponsors.length === 0 && !loading && (
                        <div style={styles.noData}>🕊️ لا يوجد كافلين</div>
                    )}
                    
                    {sponsors.map(sponsor => (
                        <div
                            key={sponsor.id}
                            style={{
                                ...styles.sponsorItem,
                                ...(selectedSponsor?.id === sponsor.id ? styles.sponsorItemSelected : {})
                            }}
                            onMouseEnter={(e) => {
                                if (selectedSponsor?.id !== sponsor.id) {
                                    e.currentTarget.style.transform = 'translateX(-4px)';
                                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => handleSelectSponsor(sponsor.id)}
                        >
                            <div style={styles.sponsorItemHeader}>
                                <span style={styles.sponsorItemName}>{sponsor.full_name}</span>
                                <span style={styles.sponsorItemId}>#{sponsor.id}</span>
                            </div>
                            <div style={styles.sponsorItemDetails}>
                                <span>👤 {sponsor.dependents_count || 0} مكفول</span>
                                <span style={sponsor.is_active ? styles.activeBadge : styles.inactiveBadge}>
                                    {sponsor.is_active ? '✅ نشط' : '❌ غير نشط'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ========== لوحة التفاصيل ========== */}
                <div style={styles.detailsPanel}>
                    {selectedSponsor ? (
                        <>
                            {/* ===== بطاقة الكافل ===== */}
                            <div style={styles.sponsorCard}>
                                <div style={styles.sponsorHeader}>
                                    <h2 style={styles.sponsorName}>👤 {selectedSponsor.full_name}</h2>
                                    <span style={selectedSponsor.is_active ? styles.activeBadge : styles.inactiveBadge}>
                                        {selectedSponsor.is_active ? '✅ نشط' : '❌ غير نشط'}
                                    </span>
                                </div>
                                <div style={styles.sponsorGrid}>
                                    <div style={styles.sponsorGridItem}>
                                        <span style={styles.sponsorGridLabel}>📅 تاريخ الميلاد</span>
                                        <span style={styles.sponsorGridValue}>{selectedSponsor.date_of_birth}</span>
                                    </div>
                                    <div style={styles.sponsorGridItem}>
                                        <span style={styles.sponsorGridLabel}>🎂 العمر</span>
                                        <span style={styles.sponsorGridValue}>{calculateAge(selectedSponsor.date_of_birth)} سنة</span>
                                    </div>
                                    <div style={styles.sponsorGridItem}>
                                        <span style={styles.sponsorGridLabel}>📅 تاريخ الاشتراك</span>
                                        <span style={styles.sponsorGridValue}>{selectedSponsor.subscription_start}</span>
                                    </div>
                                    <div style={styles.sponsorGridItem}>
                                        <span style={styles.sponsorGridLabel}>📅 تاريخ الانتهاء</span>
                                        <span style={styles.sponsorGridValue}>{selectedSponsor.subscription_end}</span>
                                    </div>
                                    <div style={styles.sponsorGridItem}>
                                        <span style={styles.sponsorGridLabel}>⏳ الأيام المتبقية</span>
                                        <span style={selectedSponsor.days_remaining < 30 ? styles.warning : styles.success}>
                                            {selectedSponsor.days_remaining} يوم
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ===== الإحصائيات ===== */}
                            <div style={styles.statsContainer}>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.total}</span>
                                    <span style={styles.statLabel}>👨‍👩‍👧‍👦 إجمالي</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.children}</span>
                                    <span style={styles.statLabel}>👶 أطفال</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.adults}</span>
                                    <span style={styles.statLabel}>🧑 بالغين</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.seniors}</span>
                                    <span style={styles.statLabel}>👴 كبار السن</span>
                                </div>
                            </div>

                            {/* ===== جدول المكفولين ===== */}
                            <div style={styles.tableSection}>
                                <h3 style={styles.tableTitle}>
                                    👨‍👩‍👧‍👦 المكفولين
                                    <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: '400' }}>
                                        ({dependents.length})
                                    </span>
                                </h3>
                                <div style={styles.tableWrapper}>
                                    <table style={styles.table}>
                                        <thead style={styles.tableHead}>
                                            <tr>
                                                <th style={styles.tableHeadCell} width="50">#</th>
                                                <th style={styles.tableHeadCell} align="right">الاسم</th>
                                                <th style={styles.tableHeadCell} align="center">الصلة</th>
                                                <th style={styles.tableHeadCell} align="center">تاريخ الميلاد</th>
                                                <th style={styles.tableHeadCell} align="center">العمر</th>
                                                <th style={styles.tableHeadCell} align="center">الحالة</th>
                                                <th style={styles.tableHeadCell} align="center">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dependents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" style={styles.noData}>
                                                        🕊️ لا يوجد مكفولين
                                                    </td>
                                                </tr>
                                            ) : (
                                                dependents.map((dep, index) => (
                                                    <tr 
                                                        key={dep.id} 
                                                        style={styles.tableRow}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                        }}
                                                    >
                                                        <td style={styles.tableCell} align="center">{index + 1}</td>
                                                        <td style={styles.tableCell}>
                                                            <strong>{dep.full_name}</strong>
                                                        </td>
                                                        <td style={styles.tableCell} align="center">
                                                            <span style={{
                                                                ...styles.relationshipBadge,
                                                                backgroundColor: getRelationshipColor(dep.relationship)
                                                            }}>
                                                                {getRelationshipEmoji(dep.relationship)} {dep.relationship}
                                                            </span>
                                                        </td>
                                                        <td style={styles.tableCell} align="center">{dep.date_of_birth}</td>
                                                        <td style={styles.tableCell} align="center">{dep.age} سنة</td>
                                                        <td style={styles.tableCell} align="center">
                                                            <span style={dep.is_active ? styles.activeBadge : styles.inactiveBadge}>
                                                                {dep.is_active ? '✅ نشط' : '❌ غير نشط'}
                                                            </span>
                                                        </td>
                                                        <td style={styles.tableCell} align="center">
                                                            <div style={styles.actionButtons}>
                                                                <button 
                                                                    onClick={() => {
                                                                        setSelectedDependent(dep);
                                                                        setShowEditDependent(true);
                                                                    }}
                                                                    style={styles.editButton}
                                                                    title="تعديل"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteDependent(dep.id, dep.full_name)}
                                                                    style={styles.deleteButton}
                                                                    title="حذف"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <h2 style={styles.emptyStateH2}>👈 اختر كافلاً من القائمة</h2>
                            <p style={styles.emptyStateP}>لعرض تفاصيل الكافل والمكفولين التابعين له</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ========== النماذج المنبثقة ========== */}
            {showAddSponsor && (
                <SponsorFormModal
                    title="🏠 إضافة كافل جديد"
                    onClose={() => setShowAddSponsor(false)}
                    onSuccess={() => {
                        fetchSponsors();
                        setShowAddSponsor(false);
                    }}
                    mode="add"
                />
            )}

            {showEditSponsor && selectedSponsor && (
                <SponsorFormModal
                    title="✏️ تعديل بيانات الكافل"
                    onClose={() => setShowEditSponsor(false)}
                    onSuccess={() => {
                        fetchSponsors();
                        fetchSponsorDetails(selectedSponsor.id);
                        setShowEditSponsor(false);
                    }}
                    mode="edit"
                    sponsorData={selectedSponsor}
                />
            )}

            {showAddDependent && selectedSponsor && (
                <DependentFormModal
                    title="➕ إضافة مكفول جديد"
                    onClose={() => setShowAddDependent(false)}
                    onSuccess={() => {
                        fetchSponsorDetails(selectedSponsor.id);
                        fetchSponsors();
                        setShowAddDependent(false);
                    }}
                    sponsorId={selectedSponsor.id}
                    mode="add"
                />
            )}

            {showEditDependent && selectedDependent && (
                <DependentFormModal
                    title="✏️ تعديل مكفول"
                    onClose={() => {
                        setShowEditDependent(false);
                        setSelectedDependent(null);
                    }}
                    onSuccess={() => {
                        fetchSponsorDetails(selectedSponsor.id);
                        fetchSponsors();
                        setShowEditDependent(false);
                        setSelectedDependent(null);
                    }}
                    sponsorId={selectedSponsor.id}
                    mode="edit"
                    dependentData={selectedDependent}
                />
            )}
        </div>
    );
};

// =============================================
// نموذج إضافة/تعديل كافل
// =============================================
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

    const modalStyles = {
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
            borderRadius: '16px',
            width: '95%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            direction: 'rtl'
        },
        title: {
            textAlign: 'center',
            color: '#2c3e50',
            fontSize: '22px',
            marginBottom: '20px',
            borderBottom: '3px solid #3498db',
            paddingBottom: '12px',
            fontFamily: 'Cairo, sans-serif'
        },
        error: {
            backgroundColor: '#fde8e8',
            color: '#e74c3c',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
        },
        group: {
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        },
        label: {
            fontWeight: '600',
            color: '#2c3e50',
            fontSize: '14px'
        },
        input: {
            padding: '10px 14px',
            borderRadius: '8px',
            border: '2px solid #e0e0e0',
            fontSize: '15px',
            fontFamily: 'Cairo, sans-serif',
            transition: 'border 0.3s ease'
        },
        buttons: {
            display: 'flex',
            gap: '10px',
            marginTop: '10px'
        },
        submit: {
            flex: 1,
            padding: '12px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: '600'
        },
        cancel: {
            flex: 1,
            padding: '12px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: '600'
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={modalStyles.title}>{title}</h2>
                {error && <div style={modalStyles.error}>❌ {error}</div>}
                <form onSubmit={handleSubmit} style={modalStyles.form}>
                    <div style={modalStyles.group}>
                        <label style={modalStyles.label}>الاسم الكامل *</label>
                        <input
                            type="text"
                            required
                            placeholder="أدخل الاسم الكامل"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            style={modalStyles.input}
                        />
                    </div>
                    <div style={modalStyles.group}>
                        <label style={modalStyles.label}>تاريخ الميلاد *</label>
                        <input
                            type="date"
                            required
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                            style={modalStyles.input}
                        />
                    </div>
                    <div style={modalStyles.group}>
                        <label style={modalStyles.label}>تاريخ بدء الاشتراك *</label>
                        <input
                            type="date"
                            required
                            value={formData.subscription_start}
                            onChange={(e) => setFormData({...formData, subscription_start: e.target.value})}
                            style={modalStyles.input}
                        />
                    </div>
                    <div style={modalStyles.buttons}>
                        <button type="submit" style={modalStyles.submit} disabled={loading}>
                            {loading ? '⏳ جاري...' : mode === 'add' ? '✅ إضافة' : '✅ تحديث'}
                        </button>
                        <button type="button" onClick={onClose} style={modalStyles.cancel}>
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// =============================================
// نموذج إضافة/تعديل مكفول
// =============================================
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

    const modalStyles = {
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
            borderRadius: '16px',
            width: '95%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            direction: 'rtl'
        },
        title: {
            textAlign: 'center',
            color: '#2c3e50',
            fontSize: '22px',
            marginBottom: '20px',
            borderBottom: '3px solid #3498db',
            paddingBottom: '12px',
            fontFamily: 'Cairo, sans-serif'
        },
        hintBox: {
            backgroundColor: isFirstOnly ? '#e8f4fd' : '#fff3e0',
            border: `2px solid ${isFirstOnly ? '#3498db' : '#ff9800'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '15px',
            textAlign: 'center'
        },
        hintText: {
            color: '#2c3e50',
            fontSize: '14px',
            margin: 0,
            fontFamily: 'Cairo, sans-serif'
        },
        error: {
            backgroundColor: '#fde8e8',
            color: '#e74c3c',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
        },
        group: {
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        },
        label: {
            fontWeight: '600',
            color: '#2c3e50',
            fontSize: '14px'
        },
        input: {
            padding: '10px 14px',
            borderRadius: '8px',
            border: '2px solid #e0e0e0',
            fontSize: '15px',
            fontFamily: 'Cairo, sans-serif',
            transition: 'border 0.3s ease'
        },
        select: {
            padding: '10px 14px',
            borderRadius: '8px',
            border: '2px solid #e0e0e0',
            fontSize: '15px',
            fontFamily: 'Cairo, sans-serif',
            backgroundColor: 'white'
        },
        hintSmall: {
            color: '#7f8c8d',
            fontSize: '12px',
            marginTop: '3px'
        },
        buttons: {
            display: 'flex',
            gap: '10px',
            marginTop: '10px'
        },
        submit: {
            flex: 1,
            padding: '12px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: '600'
        },
        cancel: {
            flex: 1,
            padding: '12px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: '600'
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={modalStyles.title}>{title}</h2>
                
                <div style={modalStyles.hintBox}>
                    <p style={modalStyles.hintText}>
                        💡 {isFirstOnly 
                            ? 'الاسم الأول فقط (سيتم إكماله تلقائياً باسم الأب)' 
                            : 'الاسم الكامل (الاسم + اسم الأب)'}
                    </p>
                </div>

                {error && <div style={modalStyles.error}>❌ {error}</div>}
                
                <form onSubmit={handleSubmit} style={modalStyles.form}>
                    <div style={modalStyles.group}>
                        <label style={modalStyles.label}>الاسم *</label>
                        <input
                            type="text"
                            required
                            placeholder={getNamePlaceholder(formData.relationship)}
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            style={modalStyles.input}
                        />
                        <small style={modalStyles.hintSmall}>
                            {isFirstOnly 
                                ? '✏️ أدخل الاسم الأول فقط (مثال: خالد)' 
                                : '✏️ أدخل الاسم الكامل (مثال: أحمد محمد)'}
                        </small>
                    </div>

                    <div style={modalStyles.group}>
                        <label style={modalStyles.label}>تاريخ الميلاد *</label>
                        <input
                            type="date"
                            required
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                            style={modalStyles.input}
                        />
                    </div>

                    <div style={modalStyles.group}>
                        <label style={modalStyles.label}>الصلة *</label>
                        <select
                            value={formData.relationship}
                            onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                            style={modalStyles.select}
                        >
                            <option value="أب">أب (اسم كامل)</option>
                            <option value="أم">أم (اسم كامل)</option>
                            <option value="زوج">زوج (اسم كامل)</option>
                            <option value="زوجة">زوجة (اسم كامل)</option>
                            <option value="ابن">ابن (اسم أول + إكمال تلقائي)</option>
                            <option value="ابنة">ابنة (اسم أول + إكمال تلقائي)</option>
                        </select>
                    </div>

                    <div style={modalStyles.buttons}>
                        <button type="submit" style={modalStyles.submit} disabled={loading}>
                            {loading ? '⏳ جاري...' : mode === 'add' ? '✅ إضافة' : '✅ تحديث'}
                        </button>
                        <button type="button" onClick={onClose} style={modalStyles.cancel}>
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FamilyView;