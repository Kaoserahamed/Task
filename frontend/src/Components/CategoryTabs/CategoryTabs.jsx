import React from 'react';
import './CategoryTabs.css';

const CategoryTabs = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', name: 'All', icon: 'globe', color: '#6b7280' },
    { id: 'adventure', name: 'Adventure', icon: 'hiking', color: '#f97316' }, // hiking icon for adventure
    { id: 'Family', name: 'Family', icon: 'users', color: '#0ea5e9' }, // users/family icon
    { id: 'cultural', name: 'Cultural', icon: 'landmark', color: '#8b5cf6' },
    { id: 'Educational', name: 'Educational', icon: 'graduation-cap', color: '#ec4899' }, // graduation cap for educational
    { id: 'Nature & Eco', name: 'Nature & Eco', icon: 'tree', color: '#22c55e' }, // tree for nature
    { id: 'Honeymoon', name: 'Honeymoon', icon: 'heart', color: '#f43f5e' }, // heart for honeymoon
    { id: 'Seasonal', name: 'Seasonal', icon: 'calendar', color: '#f43f5e' } // calendar for seasonal
];

  return (
    <div className="category-tabs">
      {categories.map(category => (
        <button
          key={category.id}
          className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
          onClick={() => onCategoryChange(category.id)}
          style={{ backgroundColor: activeCategory === category.id ? category.color : 'transparent' }}
        >
          <i className={`fas fa-${category.icon}`}></i>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;

