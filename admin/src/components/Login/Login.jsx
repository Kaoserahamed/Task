// src/components/Auth/Login.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import API_BASE_URL from '../../config/api';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Fill demo credentials
    const fillDemoCredentials = () => {
        setEmail('admin@demo.com');
        setPassword('demo123');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data); // data contains { token, user }
                navigate('/');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <h2>Admin Login</h2>
            {error && <p className="error">{error}</p>}
            
            <div className="demo-credentials" style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '2px dashed #f59e0b',
                borderRadius: '12px',
                padding: '15px',
                margin: '20px 0',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#92400e', marginBottom: '10px' }}>
                    🎯 Try Demo Admin Account
                </p>
                <button 
                    type="button" 
                    onClick={fillDemoCredentials}
                    style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }}
                >
                    Fill Demo Credentials
                </button>
                <p style={{ fontSize: '0.85rem', color: '#78350f', margin: 0 }}>
                    Email: <strong>admin@demo.com</strong> | Password: <strong>demo123</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn">Login</button>
            </form>
            <p>
               For testing purposes, use the demo credentials above.
            </p>
        </div>
    );
};

export default Login;
