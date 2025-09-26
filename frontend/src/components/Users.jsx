import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Users({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'resident',
    password: '',
    unitNumber: '',
    block: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/users')
      setUsers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (editingUser) {
        // Update existing user
        const response = await axios.put(`/users/${editingUser._id}`, formData)
        setUsers(users.map(u => u._id === editingUser._id ? response.data.data : u))
        setSuccess('User updated successfully')
      } else {
        // Create new user
        const response = await axios.post('/users', formData)
        setUsers([response.data.data, ...users])
        setSuccess('User created successfully')
      }
      
      resetForm()
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '', // Don't populate password for editing
      unitNumber: user.unitNumber || '',
      block: user.block || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      await axios.delete(`/users/${userId}`)
      setUsers(users.filter(u => u._id !== userId))
      setSuccess('User deleted successfully')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'resident',
      password: '',
      unitNumber: '',
      block: ''
    })
    setEditingUser(null)
    setShowAddForm(false)
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'suspended': return 'orange'
      default: return 'gray'
    }
  }

  if (loading) {
    return <div className="loading">Loading users...</div>
  }

  return (
    <div>
      <div className="card">
        <h2>User management</h2>
        <p>You have access to manage users as a <strong>{getRoleDisplayName(user.role)}</strong>.</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <div style={{ marginBottom: '1rem' }}>
          <button 
            className="btn" 
            onClick={() => setShowAddForm(true)}
            style={{ marginRight: '0.5rem' }}
          >
            Add new user
          </button>
          {showAddForm && (
            <button 
              className="btn btn-secondary" 
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="card">
            <h3>{editingUser ? 'Edit user' : 'Add new user'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Role *</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="resident">Resident</option>
                    <option value="admin">Community Admin</option>
                    <option value="security">Security</option>
                    {user.role === 'super_admin' && <option value="super_admin">Super admin</option>}
                  </select>
                </div>
                
                {!editingUser && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                )}
                
                {formData.role === 'resident' && (
                  <>
                    <div className="form-group">
                      <label>Unit number</label>
                      <input 
                        type="text" 
                        value={formData.unitNumber}
                        onChange={(e) => setFormData({...formData, unitNumber: e.target.value})}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Block</label>
                      <input 
                        type="text" 
                        value={formData.block}
                        onChange={(e) => setFormData({...formData, block: e.target.value})}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Saving...' : (editingUser ? 'Update user' : 'Create user')}
              </button>
            </form>
          </div>
        )}
        
        <div className="feature-grid">
          {users.map((userItem) => (
            <div key={userItem._id} className="feature-card">
              <h4>{userItem.name}</h4>
              <p><strong>Email:</strong> {userItem.email}</p>
              <p><strong>Role:</strong> {getRoleDisplayName(userItem.role)}</p>
              <p><strong>Status:</strong> 
                <span style={{ 
                  color: getStatusColor(userItem.status),
                  fontWeight: 'bold'
                }}>
                  {userItem.status}
                </span>
              </p>
              {userItem.phone && <p><strong>Phone:</strong> {userItem.phone}</p>}
              {userItem.role === 'resident' && userItem.unitNumber && (
                <p><strong>Unit:</strong> {userItem.unitNumber}</p>
              )}
              {userItem.role === 'resident' && userItem.block && (
                <p><strong>Block:</strong> {userItem.block}</p>
              )}
              <p><strong>Created:</strong> {new Date(userItem.createdAt).toLocaleDateString()}</p>
              
              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleEdit(userItem)}
                  style={{ marginRight: '0.5rem' }}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDelete(userItem._id)}
                  disabled={userItem._id === user.id}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Users 