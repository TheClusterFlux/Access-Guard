import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function Dashboard({ user }) {
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/auth/me')
      setUserProfile(response.data.residentProfile)
      // Initialize edit form with current user data
      setEditForm({
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone
      })
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = () => {
    setShowEditProfile(true)
    setMessage('')
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      await axios.put('/users/profile', editForm)
      setMessage('Profile updated successfully!')
      setShowEditProfile(false)
      // Refresh user data
      fetchUserProfile()
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setShowEditProfile(false)
    setMessage('')
    // Reset form to original values
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone
    })
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

  const getQuickActions = () => {
    const actions = {
      resident: [
        { title: 'Generate guest code', description: 'Create access codes for visitors', icon: '🔑', to: '/guest-codes' },
        { title: 'Authorize delivery', description: 'Pre-approve package deliveries', icon: '📦', to: '/deliveries' },
        { title: 'View notifications', description: 'Check alerts and updates', icon: '🔔', to: '/notifications' }
      ],
      admin: [
        { title: 'Manage users', description: 'Add residents and manage accounts', icon: '👥', to: '/users' },
        { title: 'Resident directory', description: 'View contact information', icon: '📞', to: '/residents' },
        { title: 'Generate guest code', description: 'Create access codes for visitors', icon: '🔑', to: '/guest-codes' }
      ],
      security: [
        { title: 'Resident directory', description: 'Search residents by name, unit, or block', icon: '📞', to: '/residents' },
        { title: 'Guest codes', description: 'View and verify guest access codes', icon: '🔑', to: '/guest-codes' },
        { title: 'Deliveries', description: 'View scheduled and pending deliveries', icon: '📦', to: '/deliveries' },
        { title: 'Access logs', description: 'Monitor all access attempts', icon: '📊', to: '/access-logs' },
        { title: 'Notifications', description: 'Check security alerts', icon: '🔔', to: '/notifications' }
      ],
      super_admin: [
        { title: 'User management', description: 'Manage all users and roles', icon: '👥', to: '/users' },
        { title: 'Access logs', description: 'View all system activity', icon: '📊', to: '/access-logs' },
        { title: 'Resident directory', description: 'View contact information', icon: '📞', to: '/residents' }
      ]
    }
    return actions[user.role] || []
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div>
      <div className="card">
        <h2>Welcome back, {user.name}!</h2>
        <p>You are logged in as a <strong>{getRoleDisplayName(user.role)}</strong>.</p>
        
        {message && (
          <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        {!showEditProfile ? (
          <div className="user-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Your profile</h3>
              <button className="btn btn-secondary" onClick={handleEditProfile}>
                Edit profile
              </button>
            </div>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            {userProfile && (
              <>
                <p><strong>Unit:</strong> {userProfile.unitNumber}</p>
                <p><strong>Block:</strong> {userProfile.block}</p>
                {userProfile.vehicleInfo && (
                  <p><strong>Vehicle:</strong> {userProfile.vehicleInfo.make} {userProfile.vehicleInfo.model} ({userProfile.vehicleInfo.plateNumber})</p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="user-info">
            <h3>Edit profile</h3>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Quick actions</h3>
        <div className="feature-grid">
          {getQuickActions().map((action, index) => (
            <div key={index} className="feature-card">
              <h4>{action.icon} {action.title}</h4>
              <p>{action.description}</p>
              <Link to={action.to} className="btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Go to {action.title.toLowerCase()}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 