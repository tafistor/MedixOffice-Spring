import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../services/api';
import { motion } from 'framer-motion';
import Logo from '../Logo/Logo';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Login.css';

function Login() {
  const { t } = useTranslation();
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
      if (!email) setEmailError(t('login.emailInvalid'));
      else if (!validateEmail(email)) setEmailError(t('login.emailInvalid'));
      else setEmailError('');
    }

    if (touched.password) {
      if (!password) setPasswordError(t('login.passwordRequired'));
      else setPasswordError('');
    }
  }, [email, password, touched, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError || passwordError) return;

    setError('');
    const response = await auth.login({ email, password })
      .catch(err => {
        if (err.response?.status === 404) {
          setError(t('login.errorNotRegistered'));
        } else if (err.response?.status === 401) {
          setError(t('login.errorInvalidCredentials'));
        } else {
          setError(t('login.errorGeneric'));
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
        <div className="login-language-switcher">
          <LanguageSwitcher />
        </div>
        <h2 className="login-title">{t('login.welcomeBack')}</h2>
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
            <label className="form-label">{t('login.email')}</label>
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
            <label className="form-label">{t('login.password')}</label>
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
            {t('login.loginButton')}
          </button>
        </form>
        <p className="signup-text">
          {t('login.noAccount')}{' '}
          <a href="/signup" className="signup-link">
            {t('login.signUp')}
          </a>
        </p>
        <p className="signup-text">
          <a href="/password-reset" className="signup-link">
            {t('login.forgotPassword')}
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;