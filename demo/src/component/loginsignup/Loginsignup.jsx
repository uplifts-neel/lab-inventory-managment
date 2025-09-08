import React, { useState, useContext } from 'react'
import './Loginsignup.css'
import user_icon from '../../assets/person.png'
import email_icon from '../../assets/email.png'     
import password_icon from '../../assets/password.png'
import { AuthContext } from '../../context/AuthContext';

const LoginSignup = () => {
  const { login, signup } = useContext(AuthContext);
  const [action, setAction] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Frontend validation
    if (action === 'Sign Up') {
      if (!name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }
      if (!email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      if (!password.trim()) {
        setError('Password is required');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please provide a valid email address');
        setLoading(false);
        return;
      }
    } else {
      if (!email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      if (!password.trim()) {
        setError('Password is required');
        setLoading(false);
        return;
      }
    }
    
    try {
      if (action === 'Login') {
        await login({ email: email.trim(), password });
      } else {
        await signup({ name: name.trim(), email: email.trim(), password });
      }
      // Success - user will be automatically redirected by AuthContext
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleActionSwitch = () => {
    setAction(action === 'Login' ? 'Sign Up' : 'Login');
    clearForm();
  };

  return (
    <div className='body-bg'>
      <div className="container">
        <div className="header">
          <div className="text">{action}</div>
          <div className="underline"></div>
        </div>
        <form className="inputs" onSubmit={handleSubmit}>
          {action === 'Login' ? null : (
            <div className="input">
              <img src={user_icon} alt="" />
              <input type="text" placeholder='Name' value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="input">
            <img src={email_icon} alt="" />
            <input type="email" placeholder='Email id' value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input">
            <img src={password_icon} alt="" />
            <input type="password" placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && (
            <div style={{ 
              color: '#dc3545', 
              marginBottom: 16, 
              padding: '8px 12px', 
              background: '#f8d7da', 
              border: '1px solid #f5c6cb', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          <button className="submit" type="submit" disabled={loading}>{loading ? 'Please wait...' : action}</button>
        </form>
        <div className="submit-container">
          <button className="submit gray" type="button" onClick={handleActionSwitch}>
            {action === 'Login' ? 'Switch to Sign Up' : 'Switch to Login'}
          </button>
        </div>
        {action === 'Login' && (
          <div className="forgot-password" style={{ marginTop: 32, textAlign: 'center' }}>lost password?<span> Click here!</span></div>
        )}
      </div>
    </div>
  );
}

export default LoginSignup
