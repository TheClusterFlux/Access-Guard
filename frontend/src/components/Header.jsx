import React from 'react'
import { Link } from 'react-router-dom'

function Header({ user, onLogout }) {
  const getNavLinks = () => {
    if (!user) return []

    const links = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/guest-codes', label: 'Guest Codes' },
      { to: '/deliveries', label: 'Deliveries' },
      { to: '/notifications', label: 'Notifications' }
    ]

    // Admin and Super Admin can access Users
    if (['admin', 'super_admin'].includes(user.role)) {
      links.push({ to: '/users', label: 'Users' })
    }

    // Admin, Security, and Super Admin can access Residents
    if (['admin', 'security', 'super_admin'].includes(user.role)) {
      links.push({ to: '/residents', label: 'Residents' })
    }

    // Security and Super Admin can access Access Logs
    if (['security', 'super_admin'].includes(user.role)) {
      links.push({ to: '/access-logs', label: 'Access Logs' })
    }

    return links
  }

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'resident': 'Resident',
      'admin': 'Community Admin',
      'security': 'Security',
      'super_admin': 'Super Admin'
    }
    return roleNames[role] || role
  }

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div>
            <h1>🛡️ AccessGuard</h1>
            {user && (
              <div style={{ 
                fontSize: '1rem', 
                opacity: 0.9,
                color: '#3498db',
                fontWeight: '500'
              }}>
                👤 {user.name} | 🔐 {getRoleDisplayName(user.role)}
              </div>
            )}
          </div>
          
          {user && (
            <ul className="nav-links">
              {getNavLinks().map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
              <li>
                <button className="logout-btn" onClick={onLogout}>
                  🚪 Logout
                </button>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header 