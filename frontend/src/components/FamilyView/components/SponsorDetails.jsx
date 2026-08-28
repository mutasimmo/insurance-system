// frontend/src/components/FamilyView/components/SponsorDetails.jsx
import React from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
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

    // ✅ تنسيق التواريخ باستخدام date-fns
    const formatDate = (date) => {
        if (!date) return '—';
        try {
            return format(new Date(date), 'dd/MM/yyyy', { locale: ar });
        } catch {
            return date;
        }
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const days = differenceInDays(new Date(endDate), new Date());
        return days > 0 ? days : 0;
    };

    const getTimeRemaining = (endDate) => {
        if (!endDate) return '—';
        try {
            return formatDistanceToNow(new Date(endDate), { 
                addSuffix: true, 
                locale: ar 
            });
        } catch {
            return '—';
        }
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
                    <span className="sponsor-grid-value">{formatDate(sponsor.date_of_birth)}</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">🎂 العمر</span>
                    <span className="sponsor-grid-value">{calculateAge(sponsor.date_of_birth)} سنة</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">📅 تاريخ الاشتراك</span>
                    <span className="sponsor-grid-value">{formatDate(sponsor.subscription_start)}</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">📅 تاريخ الانتهاء</span>
                    <span className="sponsor-grid-value">{formatDate(sponsor.subscription_end)}</span>
                </div>
                <div className="sponsor-grid-item">
                    <span className="sponsor-grid-label">⏳ الأيام المتبقية</span>
                    <span className={getDaysRemaining(sponsor.subscription_end) < 30 ? 'text-warning' : 'text-success'}>
                        {getDaysRemaining(sponsor.subscription_end)} يوم
                        <small style={{ display: 'block', fontSize: '11px', color: '#7f8c8d' }}>
                            {getTimeRemaining(sponsor.subscription_end)}
                        </small>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SponsorDetails;