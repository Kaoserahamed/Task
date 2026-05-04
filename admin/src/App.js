// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import Navbar from './components/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import TourMonitoring from './components/TourMonitoring/TourMonitoring';
import AdminSupport from './components/AdminSupport/AdminSupport';
import DestinationSearch from './components/DestinationSearch/DestinationSearch';
import Reports from './components/Reports/Reports';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Settings from './components/settings/settings';
import ProtectedRoute from './components/ProtectedRoute';
import RegistrationRequest from './components/RegistrationRequests/RegistrationRequest';
import PackageDetailsAndApprove from './components/PackageDetailsAndApprove/PackageDetailsAndApprove';
import Companies from './components/Companies/Companies';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          
          <div className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute>  <Dashboard />  </ProtectedRoute>} />
              <Route path="/tour-monitoring" element={<ProtectedRoute>  <TourMonitoring /> </ProtectedRoute> } />
              <Route path="/admin-support" element={<ProtectedRoute>  <AdminSupport /> </ProtectedRoute> } />
              <Route path="/settings" element={<ProtectedRoute>  <Settings /> </ProtectedRoute> } />
              <Route path="/destination-search" element={<DestinationSearch />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/admin/registration-request/:id" element={<ProtectedRoute><RegistrationRequest /></ProtectedRoute>} />
              <Route path='/admin/package-details/:id' element={<ProtectedRoute><PackageDetailsAndApprove /></ProtectedRoute>} />
              <Route path='/admin/companies' element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
