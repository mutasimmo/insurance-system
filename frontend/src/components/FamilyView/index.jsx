// frontend/src/components/FamilyView/index.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useFamilyData from './hooks/useFamilyData';
import SponsorList from './components/SponsorList';
import SponsorDetails from './components/SponsorDetails';
import StatsCards from './components/StatsCards';
import DependentsTable from './components/DependentsTable';
import SponsorFormModal from './components/SponsorFormModal';
import DependentFormModal from './components/DependentFormModal';
import './FamilyView.css';

const FamilyView = () => {
    const {
        sponsors,
        selectedSponsor,
        dependents,
        statistics,
        loading,
        error,
        fetchSponsors,
        fetchSponsorDetails,
        setSelectedSponsor,
        setDependents,
        setStatistics,
        setLoading,
        setError
    } = useFamilyData();

    const [showAddSponsor, setShowAddSponsor] = useState(false);
    const [showEditSponsor, setShowEditSponsor] = useState(false);
    const [showAddDependent, setShowAddDependent] = useState(false);
    const [showEditDependent, setShowEditDependent] = useState(false);
    const [selectedDependent, setSelectedDependent] = useState(null);

    const handleSelectSponsor = (id) => {
        fetchSponsorDetails(id);
    };

    const handleDeleteSponsor = async () => {
        if (!selectedSponsor) return;
        
        if (window.confirm(`⚠️ هل أنت متأكد من حذف الكافل "${selectedSponsor.full_name}" وجميع المكفولين التابعين له؟`)) {
            try {
                const response = await api.delete(`/sponsors/${selectedSponsor.id}`);
                if (response.data.success) {
                    alert('✅ تم حذف الكافل وجميع المكفولين التابعين له بنجاح');
                    setSelectedSponsor(null);
                    setDependents([]);
                    fetchSponsors();
                }
            } catch (err) {
                alert('❌ فشل الاتصال بالخادم');
            }
        }
    };

    const handleDeleteDependent = async (id, name) => {
        if (window.confirm(`⚠️ هل أنت متأكد من حذف "${name}"؟`)) {
            try {
                const response = await api.delete(`/dependents/${id}`);
                if (response.data.success) {
                    alert('✅ تم حذف المكفول بنجاح');
                    if (selectedSponsor) {
                        fetchSponsorDetails(selectedSponsor.id);
                    }
                    fetchSponsors();
                }
            } catch (err) {
                alert('❌ فشل الاتصال بالخادم');
            }
        }
    };

    return (
        <div className="family-container">
            <header className="family-header">
                <h1>🏥 نظام التأمين الطبي</h1>
                <p>إدارة الكافلين والمكفولين</p>
            </header>

            <div className="actions-bar">
                <button 
                    className="btn btn-primary" 
                    onClick={() => setShowAddSponsor(true)}
                >
                    🏠 إضافة كافل
                </button>
                {selectedSponsor && (
                    <>
                        <button 
                            className="btn btn-success" 
                            onClick={() => setShowAddDependent(true)}
                        >
                            ➕ إضافة مكفول
                        </button>
                        <button 
                            className="btn btn-warning" 
                            onClick={() => setShowEditSponsor(true)}
                        >
                            ✏️ تعديل الكافل
                        </button>
                        <button 
                            className="btn btn-danger" 
                            onClick={handleDeleteSponsor}
                        >
                            🗑️ حذف الكافل
                        </button>
                    </>
                )}
            </div>

            {error && <div className="error-message">❌ {error}</div>}

            <div className="main-layout">
                <SponsorList
                    sponsors={sponsors}
                    selectedSponsor={selectedSponsor}
                    onSelect={handleSelectSponsor}
                    loading={loading}
                />

                <div className="details-panel">
                    {selectedSponsor ? (
                        <>
                            <SponsorDetails sponsor={selectedSponsor} />
                            <StatsCards statistics={statistics} />
                            <DependentsTable
                                dependents={dependents}
                                onEdit={(dep) => {
                                    setSelectedDependent(dep);
                                    setShowEditDependent(true);
                                }}
                                onDelete={handleDeleteDependent}
                            />
                        </>
                    ) : (
                        <div className="empty-state">
                            <h2>👈 اختر كافلاً من القائمة</h2>
                            <p>لعرض تفاصيل الكافل والمكفولين التابعين له</p>
                        </div>
                    )}
                </div>
            </div>

            {/* النماذج المنبثقة */}
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

export default FamilyView;