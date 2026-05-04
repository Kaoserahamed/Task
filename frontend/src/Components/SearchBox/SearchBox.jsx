import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBox.css';

const SearchBox = ({ onSearch }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = () => {
    navigate(`/search?query=${searchTerm}&category=${category}`);
  };

  return (
    <div className="custom-search-box">
      <i className="custom-search-icon fas fa-search"></i>
      <input
        type="text"
        className="custom-search-input"
        placeholder="Search destinations, tours, or activities..."
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onSearch(e.target.value);
        }}
      />
      <button className="custom-search-button" onClick={handleSearch}>
        Search
      </button>
    </div>
  );
};

export default SearchBox;
