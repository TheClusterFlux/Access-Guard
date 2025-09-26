import React, { useState } from 'react'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testUsers = [
    { email: 'john.smith@example.com', password: 'password123', role: 'Resident' },
    { email: 'sarah.johnson@example.com', password: 'password123', role: 'Resident' },
    { email: 'mike.wilson@example.com', password: 'password123', role: 'Community Admin' },
    { email: 'security@accessguard.com', password: 'password123', role: 'Security' },
    { email: 'admin@accessguard.com', password: 'password123', role: 'Super Admin' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await onLogin(email, password)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const fillCredentials = (user) => {
    setEmail(user.email)
    setPassword(user.password)
  }

  return (
    <div className="card">
      <h2 style={{ 
        color: '#3498db', 
        textAlign: 'center', 
        marginBottom: '2rem',
        fontSize: '2rem',
        fontWeight: '600',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        🔐 Secure Access
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <button type="submit" className="btn" disabled={loading}>
          {loading ? '🔐 Authenticating...' : '🚀 Secure Login'}
        </button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          color: '#27ae60', 
          marginBottom: '1rem',
          fontSize: '1.3rem',
          fontWeight: '500',
          borderBottom: '2px solid #27ae60',
          paddingBottom: '0.5rem'
        }}>
          🚨 Authorized Personnel Only
        </h3>
        <p style={{ 
          color: '#b0b0b0', 
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontStyle: 'italic'
        }}>
          Select authorized credentials for system access:
        </p>
        
        <div className="grid">
          {testUsers.map((user) => (
            <div key={user.email} className="user-info">
              <h4>{user.role}</h4>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Password:</strong> {user.password}</p>
              <button 
                className="btn btn-secondary" 
                onClick={() => fillCredentials(user)}
                style={{ marginTop: '0.5rem' }}
              >
                🔑 Select Credentials
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Login 