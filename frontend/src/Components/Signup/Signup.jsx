import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo/Logo';
import './Signup.css';

function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState({});

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    
    // Block spaces at the beginning
    if (value.startsWith(' ')) {
      return;
    }
    
    // Block multiple spaces
    if (value.includes('  ')) {
      return;
    }
    
    // Block multiple apostrophes or hyphens
    if (value.includes("''") || value.includes('--')) {
      return;
    }
    
    // Check for valid characters
    const validPattern = /^[a-zA-ZÀ-ÿ'\s-]*$/;
    if (value && !validPattern.test(value)) {
      return;
    }
    
    setFirstName(value);
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    
    // Block spaces at the beginning
    if (value.startsWith(' ')) {
      return;
    }
    
    // Block multiple spaces
    if (value.includes('  ')) {
      return;
    }
    
    // Block multiple apostrophes or hyphens
    if (value.includes("''") || value.includes('--')) {
      return;
    }
    
    // Check for valid characters
    const validPattern = /^[a-zA-ZÀ-ÿ'\s-]*$/;
    if (value && !validPattern.test(value)) {
      return;
    }
    
    setLastName(value);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    // Prevent spaces
    if (value.includes(' ')) {
      return;
    }
    setPassword(value);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    // Prevent spaces
    if (value.includes(' ')) {
      return;
    }
    setConfirmPassword(value);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    try {
      const response = await auth.register({
        firstName,
        lastName,
        email,
        password,
        role,
      });
      
      const { user, token } = response.data;
      login(user, token);
      navigate(role === 'patient' || role === 'doctor' ? '/complete-profile' : '/dashboard');
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message === 'Email already in use') {
        setEmailError('This email already exists');
      } else {
        setError('An error occurred during registration');
      }
    }
  };

  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = () => {
    return (
      firstName.length >= 3 &&
      lastName.length >= 3 &&
      isEmailValid(email) &&
      password.length >= 8 &&
      password === confirmPassword
    );
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError(''); 
  };

  return (
    <div className="signup-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="signup-form">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="logo-container">
          <Logo />
        </motion.div>
        <h2 className="signup-title">Create Account</h2>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="form">
          <div>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={handleFirstNameChange}
              onBlur={() => setTouched({ ...touched, firstName: true })}
              className={`input-field ${touched.firstName && firstName.length < 3 ? 'error' : ''}`}
              required
            />
            {touched.firstName && firstName.length < 3 && (
              <p className="error-text">First name must be at least 3 characters</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={handleLastNameChange}
              onBlur={() => setTouched({ ...touched, lastName: true })}
              className={`input-field ${touched.lastName && lastName.length < 3 ? 'error' : ''}`}
              required
            />
            {touched.lastName && lastName.length < 3 && (
              <p className="error-text">Last name must be at least 3 characters</p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => setTouched({ ...touched, email: true })}
              className={`input-field ${(touched.email && !isEmailValid(email)) || emailError ? 'error' : ''}`}
              required
            />
            {touched.email && !isEmailValid(email) && !emailError && (
              <p className="error-text">Please enter a valid email address</p>
            )}
            {emailError && (
              <p className="error-text">{emailError}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => setTouched({ ...touched, password: true })}
              className={`input-field ${touched.password && password.length < 8 ? 'error' : ''}`}
              required
            />
            {touched.password && password.length < 8 && (
              <p className="error-text">Password must be at least 8 characters</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              className={`input-field ${touched.confirmPassword && confirmPassword !== password ? 'error' : ''}`}
              required
            />
            {touched.confirmPassword && confirmPassword !== password && (
              <p className="error-text">Passwords do not match</p>
            )}
          </div>

          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field" required>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="secretary">Secretary</option>
            <option value="patient">Patient</option>
          </select>

          <button type="submit" className="submit-button" disabled={!isFormValid()}>
            Sign Up
          </button>
        </form>

        <p className="login-link-text">
          Already have an account? <a href="/login" className="login-link">Login</a>
        </p>
      </motion.div>
    </div>
  );
}

export default Signup;