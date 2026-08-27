// frontend/src/components/FamilyView/components/SponsorList.jsx
import React, { useState } from 'react';
import SearchBar from './SearchBar';
import './SponsorList.css';

const SponsorList = ({ sponsors, selectedSponsor, onSelect, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const handleSearch = (term) => {
        setSearchTerm(term);
        
        if (!term.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const results = sponsors.filter(sponsor =>
            sponsor.full_name.toLowerCase().includes(term.toLowerCase().trim())
        );

        setSearchResults(results.map(s => ({ ...s, type: 'كافل' })));
        setShowSearchResults(true);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setShowSearchResults(false);
    };

    const displayList = searchTerm ? searchResults : sponsors;

    return (
        <div className="sponsor-list">
            <h3 className="sponsor-list-title">👨‍👩‍👧‍👦 قائمة الكافلين</h3>
            
            <SearchBar
                value={searchTerm}
                onChange={handleSearch}
                onClear={clearSearch}
                placeholder="ابحث عن كافل..."
            />

            {showSearchResults && searchResults.length === 0 && searchTerm && (
                <div className="no-results">🕊️ لا توجد نتائج مطابقة</div>
            )}

            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>⏳ جاري التحميل...</p>
                </div>
            )}

            {!loading && displayList.length === 0 && (
                <div className="no-data">🕊️ لا يوجد كافلين</div>
            )}

            {!loading && displayList.map(sponsor => (
                <div
                    key={sponsor.id}
                    className={`sponsor-item ${selectedSponsor?.id === sponsor.id ? 'selected' : ''}`}
                    onClick={() => onSelect(sponsor.id)}
                >
                    <div className="sponsor-item-header">
                        <span className="sponsor-item-name">{sponsor.full_name}</span>
                        <span className="sponsor-item-id">#{sponsor.id}</span>
                    </div>
                    <div className="sponsor-item-details">
                        <span>👤 {sponsor.dependents_count || 0} مكفول</span>
                        <span className={sponsor.is_active ? 'badge-active' : 'badge-inactive'}>
                            {sponsor.is_active ? '✅ نشط' : '❌ غير نشط'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SponsorList;