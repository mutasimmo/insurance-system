// frontend/src/components/FamilyView/components/DependentsTable.jsx
import React from 'react';
import './DependentsTable.css';

const DependentsTable = ({ dependents, onEdit, onDelete }) => {
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

    return (
        <div className="table-section">
            <h3 className="table-title">
                👨‍👩‍👧‍👦 المكفولين ({dependents.length})
            </h3>
            <div className="table-wrapper">
                <table className="table">
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
                        {dependents.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="no-data">🕊️ لا يوجد مكفولين</td>
                            </tr>
                        ) : (
                            dependents.map((dep, index) => (
                                <tr key={dep.id}>
                                    <td>{index + 1}</td>
                                    <td><strong>{dep.full_name}</strong></td>
                                    <td>
                                        <span 
                                            className="relationship-badge"
                                            style={{ backgroundColor: getRelationshipColor(dep.relationship) }}
                                        >
                                            {getRelationshipEmoji(dep.relationship)} {dep.relationship}
                                        </span>
                                    </td>
                                    <td>{dep.date_of_birth}</td>
                                    <td>{dep.age} سنة</td>
                                    <td>
                                        <span className={dep.is_active ? 'badge-active' : 'badge-inactive'}>
                                            {dep.is_active ? '✅ نشط' : '❌ غير نشط'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn-edit"
                                                onClick={() => onEdit(dep)}
                                                title="تعديل"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                className="btn-delete"
                                                onClick={() => onDelete(dep.id, dep.full_name)}
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
    );
};

export default DependentsTable;