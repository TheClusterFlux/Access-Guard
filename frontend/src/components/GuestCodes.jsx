import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

function GuestCodes({ user }) {
  const [allGuestCodes, setAllGuestCodes] = useState([])
  const [filteredGuestCodes, setFilteredGuestCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = React.useRef(null)

  // Check if user can create guest codes (residents and admins)
  const canCreate = ['resident', 'admin', 'super_admin'].includes(user?.role)
  
  // Form state for residents/admins
  const [formData, setFormData] = useState({
    guestName: '',
    codeType: 'PIN',
    validUntil: '',
    purpose: '',
    maxUsage: 1
  })
  const [submitting, setSubmitting] = useState(false)

  // Helper function to get default valid until date (24 hours from now)
  const getDefaultValidUntil = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16) // Format for datetime-local input
  }

  // Initialize form with default date on component mount
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      validUntil: getDefaultValidUntil()
    }))
  }, [])

  // Debounced search function
  const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const fetchGuestCodes = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/guest-codes')
      const codes = response.data.data || []
      setAllGuestCodes(codes)
      setFilteredGuestCodes(codes)
    } catch (error) {
      console.error('Error fetching guest codes:', error)
      setError('Failed to load guest codes')
    } finally {
      setLoading(false)
    }
  }

  // Client-side search function
  const filterGuestCodes = useCallback((searchValue) => {
    if (!searchValue.trim()) {
      setFilteredGuestCodes(allGuestCodes)
      return
    }

    const searchLower = searchValue.toLowerCase().trim()
    const filtered = allGuestCodes.filter(code => {
      return (
        // Search by guest name
        code.guestName.toLowerCase().includes(searchLower) ||
        // Search by code
        code.code.toLowerCase().includes(searchLower) ||
        // Search by purpose
        (code.purpose && code.purpose.toLowerCase().includes(searchLower)) ||
        // Search by status
        code.status.toLowerCase().includes(searchLower) ||
        // Search by unit number (from resident data)
        (code.resident?.unitNumber && code.resident.unitNumber.toLowerCase().includes(searchLower))
      )
    })

    setFilteredGuestCodes(filtered)
  }, [allGuestCodes])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      filterGuestCodes(searchValue)
    }, 150),
    [filterGuestCodes]
  )

  useEffect(() => {
    fetchGuestCodes()
  }, [])

  // Search and keyboard shortcuts
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('')
        searchInputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await axios.post('/guest-codes', formData)
      const newCode = response.data.data
      setAllGuestCodes([newCode, ...allGuestCodes])
      setFilteredGuestCodes([newCode, ...filteredGuestCodes])
      setFormData({
        guestName: '',
        codeType: 'PIN',
        validUntil: getDefaultValidUntil(),
        purpose: '',
        maxUsage: 1
      })
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create guest code')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleRevoke = async (codeId) => {
    try {
      setError('')
      await axios.put(`/guest-codes/${codeId}/revoke`)
      // Refresh the data
      fetchGuestCodes()
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to revoke guest code')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      active: '#28a745',
      used: '#6c757d', 
      expired: '#dc3545',
      revoked: '#fd7e14'
    }
    return colors[status] || '#6c757d'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card">
        <h2>Guest Codes {user.role === 'security' ? '- Security View' : ''}</h2>
        <p>
          {user.role === 'security' 
            ? 'View and search all guest codes. Use search to quickly find codes by guest name, code, unit, or status.'
            : 'Manage your guest access codes.'
          }
        </p>

        {/* Search Bar */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="search">Search guest codes</label>
          <input
            type="text"
            id="search"
            ref={searchInputRef}
            placeholder="Search by guest name, code, unit, purpose, or status... (Ctrl+F to focus)"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
            {loading ? 'Loading...' : `${filteredGuestCodes.length} code${filteredGuestCodes.length !== 1 ? 's' : ''} found`}
          </small>
        </div>

        {/* Create Form (only for residents/admins) */}
        {canCreate && (
          <details style={{ marginBottom: '2rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              ➕ Generate New Guest Code
            </summary>
            <form onSubmit={handleSubmit} style={{ paddingLeft: '1rem', borderLeft: '3px solid #007bff' }}>
              <div className="form-group">
                <label>Guest Name *</label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Code Type *</label>
                <select
                  value={formData.codeType}
                  onChange={(e) => setFormData({...formData, codeType: e.target.value})}
                  required
                >
                  <option value="PIN">PIN Code</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Valid Until *</label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Default: 24 hours from now (1 day duration)
                </small>
              </div>
              
              <div className="form-group">
                <label>Purpose (Optional)</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="e.g., Dinner party, Maintenance visit"
                />
              </div>
              
              <div className="form-group">
                <label>Maximum Uses</label>
                <input
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({...formData, maxUsage: parseInt(e.target.value) || 1})}
                  min="1"
                  max="50"
                  placeholder="1"
                />
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  How many times this code can be used before expiring (1-50)
                </small>
              </div>
              
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Generating...' : 'Generate Guest Code'}
              </button>
            </form>
          </details>
        )}

        {/* Guest Codes List */}
        {loading ? (
          <div className="loading">Loading guest codes...</div>
        ) : (
          <>
            {filteredGuestCodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                {searchTerm ? 'No guest codes found matching your search.' : 'No guest codes found.'}
              </div>
            ) : (
              <div className="feature-grid">
                {filteredGuestCodes.map((code) => (
                  <div key={code._id} className="feature-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h4>{code.guestName}</h4>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: getStatusColor(code.status),
                        color: 'white',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {code.status}
                      </span>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '0.75rem', 
                      borderRadius: '4px', 
                      marginBottom: '1rem',
                      fontFamily: 'monospace',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {code.code}
                    </div>
                    
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                      <p><strong>Type:</strong> {code.codeType}</p>
                      <p><strong>Unit:</strong> {code.resident?.unitNumber || 'N/A'}</p>
                      <p><strong>Valid from:</strong> {formatDate(code.validFrom)}</p>
                      <p><strong>Valid until:</strong> {formatDate(code.validUntil)}</p>
                      {code.purpose && <p><strong>Purpose:</strong> {code.purpose}</p>}
                      <p><strong>Usage:</strong> {code.usageCount}/{code.maxUsage}</p>
                      {code.usedAt && <p><strong>Used at:</strong> {formatDate(code.usedAt)}</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Security can verify codes */}
                      {user.role === 'security' && code.status === 'active' && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => {
                            // TODO: Implement verify functionality
                            alert('Verify functionality - mark as used')
                          }}
                        >
                          ✅ Verify & Use
                        </button>
                      )}

                      {/* Residents/admins can revoke their own codes */}
                      {canCreate && code.status === 'active' && (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleRevoke(code._id)}
                        >
                          ❌ Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default GuestCodes