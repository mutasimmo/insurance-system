// frontend/src/components/FamilyView/components/StatsCards.jsx
import React from 'react';
import './StatsCards.css';

const StatsCards = ({ statistics }) => {
    const stats = [
        { label: '👨‍👩‍👧‍👦 إجمالي', value: statistics.total, color: '#3498db' },
        { label: '👶 أطفال', value: statistics.children, color: '#2ecc71' },
        { label: '🧑 بالغين', value: statistics.adults, color: '#f39c12' },
        { label: '👴 كبار السن', value: statistics.seniors, color: '#e74c3c' }
    ];

    return (
        <div className="stats-container">
            {stats.map((stat, index) => (
                <div key={index} className="stat-box">
                    <span className="stat-number" style={{ color: stat.color }}>
                        {stat.value}
                    </span>
                    <span className="stat-label">{stat.label}</span>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;