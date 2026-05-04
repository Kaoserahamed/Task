import React from 'react';
import './SearchFilters.css';

const SearchFilters = ({ activeFilter, setActiveFilter }) => {
  return (
    <div className="search-filters">
      <div className="filter-group">
        <h3>Price Range</h3>
        <div className="price-range">
          <select onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">All Prices</option>
            <option value="0-100">$0 - $100</option>
            <option value="100-500">$100 - $500</option>
            <option value="500-1000">$500 - $1000</option>
            <option value="1000+">$1000+</option>
          </select>
        </div>
      </div>

      <div className="filter-group">
        <h3>Duration</h3>
        <div className="duration-filters">
          <button 
            className={activeFilter === '1-3' ? 'active' : ''}
            onClick={() => setActiveFilter('1-3')}
          >
            1-3 Days
          </button>
          <button 
            className={activeFilter === '4-7' ? 'active' : ''}
            onClick={() => setActiveFilter('4-7')}
          >
            4-7 Days
          </button>
          <button 
            className={activeFilter === '7+' ? 'active' : ''}
            onClick={() => setActiveFilter('7+')}
          >
            7+ Days
          </button>
        </div>
      </div>

      <div className="filter-group">
        <h3>Tour Type</h3>
        <div className="type-filters">
          <label>
            <input type="checkbox" value="adventure" />
            Adventure
          </label>
          <label>
            <input type="checkbox" value="cultural" />
            Cultural
          </label>
          <label>
            <input type="checkbox" value="beach" />
            Beach
          </label>
          <label>
            <input type="checkbox" value="mountain" />
            Mountain
          </label>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters; 
