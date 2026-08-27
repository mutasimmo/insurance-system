// frontend/src/components/FamilyView/components/SponsorDetails.jsx
import React from 'react';
import './SponsorDetails.css';

const SponsorDetails = ({ sponsor }) => {
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

    return (
        <div className="sponsor-card">
            <div className="sponsor-header">
                <h2 className="sponsor-name">👤 {sponsor.full_name}</h2>
                <span className={sponsor.is_active ? 'badge-active' : 'badge-inactive'}>
                    {sponsor.is_active ? '✅ نشط' : '❌ غير نشط'}
                </span>
            </div>
            <div className="sponsor-grid">
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">📅 تاريخ الميلاد</span>
                    <span className="sponsor-grid-value">{sponsor.date_of_birth}</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">🎂 العمر</span>
                    <span className="sponsor-grid-value">{calculateAge(sponsor.date_of_birth)} سنة</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">📅 تاريخ الاشتراك</span>
                    <span className="sponsor-grid-value">{sponsor.subscription_start}</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">📅 تاريخ الانتهاء</span>
                    <span className="sponsor-grid-value">{sponsor.subscription_end}</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">⏳ الأيام المتبقية</span>
                    <span className={sponsor.days_remaining < 30 ? 'text-warning' : 'text-success'}>
                        {sponsor.days_remaining} يوم
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SponsorDetails;