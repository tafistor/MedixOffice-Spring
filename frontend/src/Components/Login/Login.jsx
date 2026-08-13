import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../services/api';
import { motion } from 'framer-motion';
import Logo from '../Logo/Logo';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  useEffect(() => {
    if (touched.email) {
      if (!email) setEmailError('Please enter a valid email address');
      else if (!validateEmail(email)) setEmailError('Please enter a valid email address');
      else setEmailError('');
    }

    if (touched.password) {
      if (!password) setPasswordError('Password is required');
      else setPasswordError('');
    }
  }, [email, password, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError || passwordError) return;

    setError('');
    const response = await auth.login({ email, password })
      .catch(err => {
        if (err.response?.status === 404) {
          setError('This email address is not registered');
        } else if (err.response?.status === 401) {
          setError('Invalid email or password');
        } else {
          setError('An error occurred during login');
        }
        return { data: null };
      });

    if (!response.data) return;
    
    const { user, token } = response.data;
    if (!user || !token) return;
    
    login(user, token);
    localStorage.setItem('token', token);
    navigate('/dashboard');
  };

  const isFormValid = !emailError && !passwordError && email && password;

  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="login-form"
      >
        <div className="logo-container">
          <Logo />
        </div>
        <h2 className="login-title">Welcome Back</h2>
        {error && (
          <motion.div 
            initial={{ x: -10 }}
            animate={{ x: [10, -10, 5, -5, 0] }}
            transition={{ duration: 0.4 }}
            className="error-message"
          >
            {error}
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              className={`form-input ${emailError ? 'input-error' : ''}`}
              required
            />
            {emailError && <span className="error-text">{emailError}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              className={`form-input ${passwordError ? 'input-error' : ''}`}
              required
            />
            {passwordError && <span className="error-text">{passwordError}</span>}
          </div>
          <button type="submit" className="submit-button" disabled={!isFormValid}>
            Login
          </button>
        </form>
        <p className="signup-text">
          Don't have an account?{' '}
          <a href="/signup" className="signup-link">
            Sign up
          </a>
        </p>
        <p className="signup-text">
          <a href="/password-reset" className="signup-link">
            Mot de passe oublié ?
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;