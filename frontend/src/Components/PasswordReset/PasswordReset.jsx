import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { passwordReset } from '../../services/api';
import Logo from '../Logo/Logo';
import './PasswordReset.css';

function PasswordReset() {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isBlocked, setIsBlocked] = useState(false);
  const [touched, setTouched] = useState({});

  const navigate = useNavigate();

  // Timer pour l'expiration du code
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Validation email
  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validation mot de passe
  const isPasswordValid = (password) => password.length >= 8;

  // Étape 1: Demander le code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!isEmailValid(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await passwordReset.requestCode(email);
      setSuccess('Reset code sent by email');
      // Réinitialiser les champs quand on passe à l'étape 2
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setTouched({});
      setTimer(180); // 3 minutes
      setStep(2);
      setRemainingAttempts(3);
      setIsBlocked(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setError('No account found with this email address');
      } else {
        setError('Error sending code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Vérifier le code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== 8) {
      setError('Code must be 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await passwordReset.verifyCode(email, code);
      setSuccess('Code verified successfully');
      // Réinitialiser les champs de mot de passe quand on passe à l'étape 3
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setTouched({});
      setStep(3);
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 400) {
        setError(data.message);
        setRemainingAttempts(data.remainingAttempts || 0);
      } else if (status === 429) {
        setError(data.message);
        setIsBlocked(true);
        if (data.maxAttemptsReached) {
          setTimer(180); // 3 minutes de blocage
        }
      } else if (status === 410) {
        setError(data.message);
        // Réinitialiser complètement quand le code expire
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setTouched({});
        setStep(1);
        setTimer(0);
      } else {
        setError('Error verifying code');
      }
    } finally {
      setLoading(false);
    }
  };

  // Étape 3: Réinitialiser le mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!isPasswordValid(newPassword)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await passwordReset.resetPassword(email, code, newPassword);
      setSuccess('Your password has been reset successfully.');
      // Réinitialiser tous les champs après succès
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setTouched({});
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error.response?.status === 410) {
        setError('Code has expired. Please start over.');
        // Réinitialiser complètement quand le code expire
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setTouched({});
        setStep(1);
      } else {
        setError('Error resetting password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Demander un nouveau code
  const handleRequestNewCode = () => {
    setStep(1);
    // Réinitialiser tous les champs et états
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setInfo('');
    setTimer(0);
    setRemainingAttempts(3);
    setIsBlocked(false);
    setTouched({});
  };

  // Formater le timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="password-reset-container">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="password-reset-form"
      >
        <div className="logo-container">
          <Logo />
        </div>

        <h2 className="password-reset-title">Reset Password</h2>

        {/* Indicateur d'étapes */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : 'inactive'} ${step > 1 ? 'completed' : ''}`}>1</div>
          <div className={`step-line ${step > 1 ? 'completed' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : 'inactive'} ${step > 2 ? 'completed' : ''}`}>2</div>
          <div className={`step-line ${step > 2 ? 'completed' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : 'inactive'}`}>3</div>
        </div>

        {/* Messages */}
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

        {success && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="success-message"
          >
            {success}
          </motion.div>
        )}

        {info && (
          <div className="info-message">
            {info}
          </div>
        )}

        {/* Étape 1: Email */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                className={`form-input ${touched.email && !isEmailValid(email) ? 'error' : ''}`}
                placeholder="Enter your email address"
                required
              />
              {touched.email && !isEmailValid(email) && (
                <span className="error-text">Please enter a valid email address</span>
              )}
            </div>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading || !isEmailValid(email)}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        )}

        {/* Étape 2: Code de vérification */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="form">
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`form-input code-input ${code.length !== 8 ? 'error' : ''}`}
                placeholder="XXXXXXXX"
                maxLength={8}
                required
              />
              {code.length > 0 && code.length !== 8 && (
                <span className="error-text">Code must be 8 characters long</span>
              )}
            </div>

            {timer > 0 && (
              <div className={`timer ${timer <= 30 ? 'warning' : ''}`}>
                Code expires in: {formatTimer(timer)}
              </div>
            )}

            {remainingAttempts < 3 && !isBlocked && (
              <div className={`attempts-info ${remainingAttempts <= 1 ? 'warning' : ''}`}>
                Remaining attempts: {remainingAttempts}
              </div>
            )}

            {isBlocked && timer > 0 && (
              <div className="attempts-info warning">
                Too many attempts. Try again in: {formatTimer(timer)}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading || code.length !== 8 || isBlocked}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            {(timer === 0 || isBlocked) && (
              <button 
                type="button" 
                className="secondary-button"
                onClick={handleRequestNewCode}
              >
                Request New Code
              </button>
            )}
          </form>
        )}

        {/* Étape 3: Nouveau mot de passe */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="form">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, newPassword: true })}
                className={`form-input ${touched.newPassword && !isPasswordValid(newPassword) ? 'error' : ''}`}
                placeholder="Minimum 8 characters"
                required
              />
              {touched.newPassword && !isPasswordValid(newPassword) && (
                <span className="error-text">Password must be at least 8 characters long</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                className={`form-input ${touched.confirmPassword && confirmPassword !== newPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                required
              />
              {touched.confirmPassword && confirmPassword !== newPassword && (
                <span className="error-text">Passwords do not match</span>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        <div className="back-to-login">
          <a href="/login">Back to Login</a>
        </div>
      </motion.div>
    </div>
  );
}

export default PasswordReset;