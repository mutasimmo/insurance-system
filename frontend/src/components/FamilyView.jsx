import React, { useState, useEffect } from 'react';

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

    const fetchSponsors = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/sponsors');
            const data = await response.json();
            if (data.success) {
                setSponsors(data.sponsors);
            }
        } catch (err) {
            setError('فشل في جلب البيانات');
        } finally {
            setLoading(false);
        }
    };

    const fetchSponsorDetails = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/sponsors/${id}`);
            const data = await response.json();
            if (data.success) {
                setSelectedSponsor(data.sponsor);
                setDependents(data.dependents);
                setStatistics(data.statistics);
            }
        } catch (err) {
            setError('فشل في جلب تفاصيل الكافل');
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

    const handleDeleteSponsor = async () => {
        if (!selectedSponsor) return;
        
        if (window.confirm(`⚠️ هل أنت متأكد من حذف الكافل "${selectedSponsor.full_name}" وجميع المكفولين التابعين له؟`)) {
            try {
                const response = await fetch(`http://localhost:5000/api/sponsors/${selectedSponsor.id}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
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
            }
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>🏥 نظام التأمين الطبي</h1>
                <p>إدارة الكافلين والمكفولين</p>
            </header>

            <div style={styles.actions}>
                <button onClick={() => setShowAddSponsor(true)} style={styles.addSponsorBtn}>
                    🏠 إضافة كافل
                </button>
                {selectedSponsor && (
                    <>
                        <button onClick={() => setShowAddDependent(true)} style={styles.addDependentBtn}>
                            ➕ إضافة مكفول
                        </button>
                        <button onClick={() => setShowEditSponsor(true)} style={styles.editSponsorBtn}>
                            ✏️ تعديل الكافل
                        </button>
                        <button onClick={handleDeleteSponsor} style={styles.deleteSponsorBtn}>
                            🗑️ حذف الكافل
                        </button>
                    </>
                )}
            </div>

            {error && <div style={styles.error}>❌ {error}</div>}

            <div style={styles.mainLayout}>
                <div style={styles.sponsorList}>
                    <h3>👨‍👩‍👧‍👦 قائمة الكافلين</h3>
                    {loading && <div>⏳ جاري التحميل...</div>}
                    {sponsors.length === 0 && !loading && <div>لا يوجد كافلين</div>}
                    {sponsors.map(sponsor => (
                        <div
                            key={sponsor.id}
                            style={{
                                ...styles.sponsorItem,
                                backgroundColor: selectedSponsor?.id === sponsor.id ? '#e3f2fd' : 'white',
                                border: selectedSponsor?.id === sponsor.id ? '2px solid #2196F3' : '1px solid #ddd'
                            }}
                            onClick={() => handleSelectSponsor(sponsor.id)}
                        >
                            <div style={styles.sponsorItemHeader}>
                                <strong>{sponsor.full_name}</strong>
                                <span style={styles.badge}>#{sponsor.id}</span>
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

                <div style={styles.detailsPanel}>
                    {selectedSponsor ? (
                        <>
                            <div style={styles.sponsorCard}>
                                <div style={styles.sponsorHeader}>
                                    <h2>👤 {selectedSponsor.full_name}</h2>
                                    <span style={selectedSponsor.is_active ? styles.activeBadge : styles.inactiveBadge}>
                                        {selectedSponsor.is_active ? '✅ نشط' : '❌ غير نشط'}
                                    </span>
                                </div>
                                <div style={styles.sponsorGrid}>
                                    <div><strong>تاريخ الميلاد:</strong> {selectedSponsor.date_of_birth}</div>
                                    <div><strong>العمر:</strong> {calculateAge(selectedSponsor.date_of_birth)} سنة</div>
                                    <div><strong>تاريخ الاشتراك:</strong> {selectedSponsor.subscription_start}</div>
                                    <div><strong>تاريخ الانتهاء:</strong> {selectedSponsor.subscription_end}</div>
                                    <div><strong>الأيام المتبقية:</strong> 
                                        <span style={selectedSponsor.days_remaining < 30 ? styles.warning : styles.success}>
                                            {' '}{selectedSponsor.days_remaining} يوم
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.statsContainer}>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.total}</span>
                                    <span>👨‍👩‍👧‍👦 إجمالي</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.children}</span>
                                    <span>👶 أطفال</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.adults}</span>
                                    <span>🧑 بالغين</span>
                                </div>
                                <div style={styles.statBox}>
                                    <span style={styles.statNumber}>{statistics.seniors}</span>
                                    <span>👴 كبار السن</span>
                                </div>
                            </div>

                            <h3 style={styles.tableTitle}>👨‍👩‍👧‍👦 المكفولين ({dependents.length})</h3>
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>الاسم</th>
                                            <th>الصلة</th>
                                            <th>تاريخ الميلاد</th>
                                            <th>العمر</th>
                                            <th>الحالة</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dependents.map((dep, index) => (
                                            <tr key={dep.id}>
                                                <td>{index + 1}</td>
                                                <td><strong>{dep.full_name}</strong></td>
                                                <td>
                                                    <span style={{
                                                        ...styles.relationshipBadge,
                                                        backgroundColor: getRelationshipColor(dep.relationship)
                                                    }}>
                                                        {dep.relationship}
                                                    </span>
                                                </td>
                                                <td>{dep.date_of_birth}</td>
                                                <td>{dep.age} سنة</td>
                                                <td>
                                                    <span style={dep.is_active ? styles.activeBadge : styles.inactiveBadge}>
                                                        {dep.is_active ? '✅ نشط' : '❌ غير نشط'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedDependent(dep);
                                                            setShowEditDependent(true);
                                                        }}
                                                        style={styles.editButton}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (window.confirm(`هل أنت متأكد من حذف "${dep.full_name}"؟`)) {
                                                                await fetch(`http://localhost:5000/api/dependents/${dep.id}`, { method: 'DELETE' });
                                                                fetchSponsorDetails(selectedSponsor.id);
                                                                fetchSponsors();
                                                            }
                                                        }}
                                                        style={styles.deleteButton}
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {dependents.length === 0 && (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                    لا يوجد مكفولين
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <h2>👈 اختر كافلاً من القائمة</h2>
                            <p>لعرض تفاصيل الكافل والمكفولين التابعين له</p>
                        </div>
                    )}
                </div>
            </div>

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

        const url = mode === 'add' 
            ? 'http://localhost:5000/api/sponsors'
            : `http://localhost:5000/api/sponsors/${sponsorData.id}`;
        
        const method = mode === 'add' ? 'POST' : 'PUT';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                alert(mode === 'add' ? '✅ تم إضافة الكافل بنجاح' : '✅ تم تحديث الكافل بنجاح');
                onSuccess();
            } else {
                setError(data.message || 'حدث خطأ');
            }
        } catch (err) {
            setError('فشل الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.modalTitle}>{title}</h2>
                {error && <div style={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label>الاسم الكامل *</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            style={styles.formInput}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>تاريخ الميلاد *</label>
                        <input
                            type="date"
                            required
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                            style={styles.formInput}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label>تاريخ بدء الاشتراك *</label>
                        <input
                            type="date"
                            required
                            value={formData.subscription_start}
                            onChange={(e) => setFormData({...formData, subscription_start: e.target.value})}
                            style={styles.formInput}
                        />
                    </div>
                    <div style={styles.modalButtons}>
                        <button type="submit" style={styles.submitButton} disabled={loading}>
                            {loading ? '⏳ جاري...' : mode === 'add' ? '✅ إضافة' : '✅ تحديث'}
                        </button>
                        <button type="button" onClick={onClose} style={styles.cancelButton}>
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

        const url = mode === 'add'
            ? 'http://localhost:5000/api/dependents'
            : `http://localhost:5000/api/dependents/${dependentData.id}`;
        
        const method = mode === 'add' ? 'POST' : 'PUT';
        const body = mode === 'add' 
            ? { sponsor_id: sponsorId, ...formData }
            : formData;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message || (mode === 'add' ? '✅ تم إضافة المكفول بنجاح' : '✅ تم تحديث المكفول بنجاح'));
                onSuccess();
            } else {
                setError(data.message || 'حدث خطأ');
            }
        } catch (err) {
            setError('فشل الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const getNamePlaceholder = (relationship) => {
        const placeholders = {
            'ابن': 'مثال: خالد (الاسم الأول فقط)',
            'ابنة': 'مثال: نورا (الاسم الأول فقط)',
            'زوج': 'مثال: أحمد محمد (الاسم الكامل)',
            'زوجة': 'مثال: مريم علي (الاسم الكامل)',
            'أب': 'مثال: محمد أحمد (الاسم الكامل)',
            'أم': 'مثال: فاطمة علي (الاسم الكامل)'
        };
        return placeholders[relationship] || 'أدخل الاسم';
    };

    const getIsFirstOnly = (relationship) => {
        return ['ابن', 'ابنة'].includes(relationship);
    };

    const getAutoCompleteHint = (relationship) => {
        if (['ابن', 'ابنة'].includes(relationship)) {
            return '✨ سيتم إكمال الاسم تلقائياً باسم الأب';
        }
        return '📝 أدخل الاسم الكامل (الاسم + اسم الأب)';
    };

    const isFirstOnly = getIsFirstOnly(formData.relationship);

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.modalTitle}>{title}</h2>
                
                <div style={isFirstOnly ? styles.hintBox : styles.hintBoxFull}>
                    <p style={styles.hintText}>
                        💡 {isFirstOnly 
                            ? 'الاسم الأول فقط (سيتم إكماله تلقائياً)' 
                            : 'الاسم الكامل (الاسم + اسم الأب)'}
                    </p>
                </div>

                {isFirstOnly && (
                    <div style={styles.autoCompleteHint}>
                        <span style={styles.autoCompleteIcon}>✨</span>
                        <span>{getAutoCompleteHint(formData.relationship)}</span>
                    </div>
                )}

                {error && <div style={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label>الاسم *</label>
                        <input
                            type="text"
                            required
                            placeholder={getNamePlaceholder(formData.relationship)}
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            style={styles.formInput}
                        />
                        <small style={styles.hintSmall}>
                            {isFirstOnly 
                                ? '✏️ أدخل الاسم الأول فقط (مثال: خالد)' 
                                : '✏️ أدخل الاسم الكامل (مثال: أحمد محمد)'}
                        </small>
                    </div>

                    <div style={styles.formGroup}>
                        <label>تاريخ الميلاد *</label>
                        <input
                            type="date"
                            required
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                            style={styles.formInput}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>الصلة *</label>
                        <select
                            value={formData.relationship}
                            onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                            style={styles.formInput}
                        >
                            <option value="أب">أب (اسم كامل)</option>
                            <option value="أم">أم (اسم كامل)</option>
                            <option value="زوج">زوج (اسم كامل)</option>
                            <option value="زوجة">زوجة (اسم كامل)</option>
                            <option value="ابن">ابن (اسم أول + إكمال تلقائي)</option>
                            <option value="ابنة">ابنة (اسم أول + إكمال تلقائي)</option>
                        </select>
                    </div>

                    <div style={styles.modalButtons}>
                        <button type="submit" style={styles.submitButton} disabled={loading}>
                            {loading ? '⏳ جاري...' : mode === 'add' ? '✅ إضافة' : '✅ تحديث'}
                        </button>
                        <button type="button" onClick={onClose} style={styles.cancelButton}>
                            ❌ إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// =============================================
// الأنماط (Styles)
// =============================================
const styles = {
    container: {
        padding: '20px',
        fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
        direction: 'rtl',
        maxWidth: '1600px',
        margin: '0 auto'
    },
    header: {
        textAlign: 'center',
        padding: '20px 0',
        color: '#2c3e50',
        borderBottom: '3px solid #3498db',
        marginBottom: '20px'
    },
    actions: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    addSponsorBtn: {
        padding: '10px 25px',
        backgroundColor: '#9b59b6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontFamily: 'Cairo, sans-serif',
        fontWeight: '600',
        transition: 'all 0.3s ease'
    },
    addDependentBtn: {
        padding: '10px 25px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontFamily: 'Cairo, sans-serif',
        fontWeight: '600',
        transition: 'all 0.3s ease'
    },
    editSponsorBtn: {
        padding: '10px 25px',
        backgroundColor: '#f39c12',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontFamily: 'Cairo, sans-serif',
        fontWeight: '600',
        transition: 'all 0.3s ease'
    },
    deleteSponsorBtn: {
        padding: '10px 25px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontFamily: 'Cairo, sans-serif',
        fontWeight: '600',
        transition: 'all 0.3s ease'
    },
    mainLayout: {
        display: 'flex',
        gap: '20px',
        minHeight: '500px'
    },
    sponsorList: {
        width: '300px',
        minWidth: '250px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '15px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        maxHeight: '600px',
        overflowY: 'auto',
        border: '1px solid #e8e8e8'
    },
    sponsorItem: {
        padding: '12px 15px',
        marginBottom: '8px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        border: '1px solid #ddd'
    },
    sponsorItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px'
    },
    sponsorItemDetails: {
        display: 'flex',
        gap: '10px',
        fontSize: '13px',
        color: '#666',
        flexWrap: 'wrap'
    },
    badge: {
        backgroundColor: '#3498db',
        color: 'white',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px'
    },
    detailsPanel: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #e8e8e8',
        minHeight: '400px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
        color: '#999'
    },
    sponsorCard: {
        marginBottom: '20px'
    },
    sponsorHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '15px'
    },
    sponsorGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px'
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
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #e8e8e8'
    },
    statNumber: {
        display: 'block',
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#2c3e50'
    },
    tableTitle: {
        marginBottom: '15px',
        color: '#2c3e50'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '600px'
    },
    relationshipBadge: {
        display: 'inline-block',
        padding: '4px 14px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '13px',
        fontWeight: 'bold'
    },
    activeBadge: {
        color: '#27ae60',
        fontWeight: 'bold'
    },
    inactiveBadge: {
        color: '#e74c3c',
        fontWeight: 'bold'
    },
    warning: {
        color: '#e67e22',
        fontWeight: 'bold'
    },
    success: {
        color: '#27ae60',
        fontWeight: 'bold'
    },
    editButton: {
        padding: '5px 10px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        margin: '2px',
        transition: 'all 0.3s ease'
    },
    deleteButton: {
        padding: '5px 10px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        margin: '2px',
        transition: 'all 0.3s ease'
    },
    error: {
        backgroundColor: '#fde8e8',
        color: '#e74c3c',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '15px',
        textAlign: 'center'
    },
    modalOverlay: {
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
        padding: '30px',
        borderRadius: '15px',
        width: '95%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
    },
    modalTitle: {
        textAlign: 'center',
        color: '#2c3e50',
        marginBottom: '20px',
        borderBottom: '2px solid #3498db',
        paddingBottom: '10px',
        fontFamily: 'Cairo, sans-serif'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    formInput: {
        padding: '10px 14px',
        borderRadius: '8px',
        border: '2px solid #ddd',
        fontSize: '15px',
        fontFamily: 'Cairo, sans-serif',
        transition: 'border 0.3s ease'
    },
    modalButtons: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    submitButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        fontFamily: 'Cairo, sans-serif',
        fontWeight: '600',
        transition: 'all 0.3s ease'
    },
    cancelButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        fontFamily: 'Cairo, sans-serif',
        fontWeight: '600',
        transition: 'all 0.3s ease'
    },
    hintBox: {
        backgroundColor: '#e8f4fd',
        border: '1px solid #3498db',
        borderRadius: '8px',
        padding: '10px 15px',
        marginBottom: '15px',
        textAlign: 'center'
    },
    hintText: {
        color: '#2c3e50',
        fontSize: '14px',
        margin: 0,
        fontFamily: 'Cairo, sans-serif'
    },
    hintSmall: {
        color: '#7f8c8d',
        fontSize: '12px',
        marginTop: '3px',
        fontFamily: 'Cairo, sans-serif'
    },
    autoCompleteHint: {
        backgroundColor: '#e8f5e9',
        border: '1px solid #4caf50',
        borderRadius: '8px',
        padding: '10px 15px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        color: '#2e7d32',
        fontFamily: 'Cairo, sans-serif'
    },
    autoCompleteIcon: {
        fontSize: '20px'
    },
    hintBoxFull: {
        backgroundColor: '#fff3e0',
        border: '1px solid #ff9800',
        borderRadius: '8px',
        padding: '10px 15px',
        marginBottom: '15px',
        textAlign: 'center'
    }
};

export default FamilyView;