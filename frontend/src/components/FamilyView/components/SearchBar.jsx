// frontend/src/components/FamilyView/components/SearchBar.jsx
import React from 'react';
import './SearchBar.css';

const SearchBar = ({ value, onChange, onClear, placeholder }) => {
    return (
        <div className="search-container">
            <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder={placeholder || 'بحث...'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                {value && (
                    <button className="clear-search-btn" onClick={onClear}>
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;