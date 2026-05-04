import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Categories.css';

const Categories = () => {
  const navigate = useNavigate();
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
    <div className="categories-container">
      {categories.map(category => (
        <div 
          key={category.id} 
          className="category-card"
          style={{ '--category-color': category.color }}
          onClick={() => navigate(`/explore/${category.id}`)}
        >
          <div className="category-icon">
            <i className={`fas fa-${category.icon}`}></i>
          </div>
          <h3>{category.name}</h3>
        </div>
      ))}
    </div>
  );
};

export default Categories; 
