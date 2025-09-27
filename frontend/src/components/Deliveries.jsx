import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

function Deliveries({ user }) {
  const [allDeliveries, setAllDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = React.useRef(null)

  // Check if user can create deliveries (residents and admins)
  const canCreate = ['resident', 'admin', 'super_admin'].includes(user?.role)
  
  // Form state for residents/admins
  const [formData, setFormData] = useState({
    company: '',
    trackingNumber: '',
    expectedDate: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

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

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/deliveries')
      const deliveries = response.data.data || []
      
      // Sort deliveries: pending/scheduled first, then by expected date
      const sortedDeliveries = deliveries.sort((a, b) => {
        // Priority order: authorized (pending) > delivered > failed/cancelled
        const statusPriority = { 'authorized': 0, 'delivered': 1, 'failed': 2, 'cancelled': 3 }
        const aPriority = statusPriority[a.status] ?? 4
        const bPriority = statusPriority[b.status] ?? 4
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        
        // Within same status, sort by expected date (earliest first)
        return new Date(a.expectedDate) - new Date(b.expectedDate)
      })
      
      setAllDeliveries(sortedDeliveries)
      setFilteredDeliveries(sortedDeliveries)
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      setError('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  // Client-side search function
  const filterDeliveries = useCallback((searchValue) => {
    if (!searchValue.trim()) {
      setFilteredDeliveries(allDeliveries)
      return
    }

    const searchLower = searchValue.toLowerCase().trim()
    const filtered = allDeliveries.filter(delivery => {
      return (
        // Search by company
        delivery.deliveryCompany.toLowerCase().includes(searchLower) ||
        // Search by tracking number
        (delivery.trackingNumber && delivery.trackingNumber.toLowerCase().includes(searchLower)) ||
        // Search by status
        delivery.status.toLowerCase().includes(searchLower) ||
        // Search by notes
        (delivery.notes && delivery.notes.toLowerCase().includes(searchLower)) ||
        // Search by unit number (from resident data)
        (delivery.residentData?.unitNumber && delivery.residentData.unitNumber.toLowerCase().includes(searchLower)) ||
        // Search by resident name
        (delivery.authorizedByData?.name && delivery.authorizedByData.name.toLowerCase().includes(searchLower))
      )
    })

    setFilteredDeliveries(filtered)
  }, [allDeliveries])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      filterDeliveries(searchValue)
    }, 150),
    [filterDeliveries]
  )

  useEffect(() => {
    fetchDeliveries()
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
      const response = await axios.post('/deliveries', formData)
      const newDelivery = response.data.data
      const updatedDeliveries = [newDelivery, ...allDeliveries]
      setAllDeliveries(updatedDeliveries)
      setFilteredDeliveries(updatedDeliveries)
      setFormData({
        company: '',
        trackingNumber: '',
        expectedDate: '',
        notes: ''
      })
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to authorize delivery')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      setError('')
      await axios.put(`/deliveries/${deliveryId}/status`, { status: newStatus })
      // Refresh the data
      fetchDeliveries()
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update delivery status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      authorized: '#ffc107', // Yellow - pending
      delivered: '#28a745',   // Green - completed
      failed: '#dc3545',      // Red - failed
      cancelled: '#6c757d'    // Gray - cancelled
    }
    return colors[status] || '#6c757d'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const isOverdue = (expectedDate, status) => {
    if (status !== 'authorized') return false
    return new Date() > new Date(expectedDate)
  }

  const getDaysUntilDelivery = (expectedDate) => {
    const today = new Date()
    const expected = new Date(expectedDate)
    const diffTime = expected - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card">
        <h2>Deliveries {user.role === 'security' ? '- Security View' : ''}</h2>
        <p>
          {user.role === 'security' 
            ? 'View and manage delivery authorizations. Pending deliveries are shown first, followed by completed ones.'
            : 'Manage your delivery authorizations.'
          }
        </p>

        {/* Search Bar */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="search">Search deliveries</label>
          <input
            type="text"
            id="search"
            ref={searchInputRef}
            placeholder="Search by company, tracking number, unit, resident, or status... (Ctrl+F to focus)"
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
            {loading ? 'Loading...' : `${filteredDeliveries.length} deliver${filteredDeliveries.length !== 1 ? 'ies' : 'y'} found`}
          </small>
        </div>

        {/* Create Form (only for residents/admins) */}
        {canCreate && (
          <details style={{ marginBottom: '2rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              📦 Authorize New Delivery
            </summary>
            <form onSubmit={handleSubmit} style={{ paddingLeft: '1rem', borderLeft: '3px solid #007bff' }}>
              <div className="form-group">
                <label>Delivery Company *</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="e.g., FedEx, UPS, Amazon"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Tracking Number</label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})}
                  placeholder="Optional tracking number"
                />
              </div>
              
              <div className="form-group">
                <label>Expected Date *</label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special instructions for security"
                  rows="3"
                />
              </div>
              
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Authorizing...' : 'Authorize Delivery'}
              </button>
            </form>
          </details>
        )}

        {/* Deliveries List */}
        {loading ? (
          <div className="loading">Loading deliveries...</div>
        ) : (
          <>
            {filteredDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                {searchTerm ? 'No deliveries found matching your search.' : 'No deliveries found.'}
              </div>
            ) : (
              <div className="feature-grid">
                {filteredDeliveries.map((delivery) => (
                  <div key={delivery._id} className="feature-card" style={{ 
                    position: 'relative',
                    borderLeft: isOverdue(delivery.expectedDate, delivery.status) ? '4px solid #dc3545' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h4>{delivery.deliveryCompany}</h4>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: getStatusColor(delivery.status),
                        color: 'white',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {delivery.status}
                      </span>
                    </div>
                    
                    {isOverdue(delivery.expectedDate, delivery.status) && (
                      <div style={{ 
                        backgroundColor: '#f8d7da', 
                        color: '#721c24', 
                        padding: '0.5rem', 
                        borderRadius: '4px', 
                        marginBottom: '1rem',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ OVERDUE
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                      <p><strong>Unit:</strong> {delivery.residentData?.unitNumber || 'N/A'}</p>
                      <p><strong>Resident:</strong> {delivery.authorizedByData?.name || 'N/A'}</p>
                      {delivery.trackingNumber && (
                        <p><strong>Tracking:</strong> {delivery.trackingNumber}</p>
                      )}
                      <p><strong>Expected:</strong> {formatDate(delivery.expectedDate)}</p>
                      <p style={{ 
                        color: isOverdue(delivery.expectedDate, delivery.status) ? '#dc3545' : '#666',
                        fontWeight: isOverdue(delivery.expectedDate, delivery.status) ? 'bold' : 'normal'
                      }}>
                        <strong>Status:</strong> {getDaysUntilDelivery(delivery.expectedDate)}
                      </p>
                      {delivery.deliveredAt && (
                        <p><strong>Delivered:</strong> {formatDate(delivery.deliveredAt)}</p>
                      )}
                      {delivery.notes && <p><strong>Notes:</strong> {delivery.notes}</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Security can mark deliveries as delivered/failed */}
                      {user.role === 'security' && delivery.status === 'authorized' && (
                        <>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleStatusUpdate(delivery._id, 'delivered')}
                            style={{ fontSize: '0.85rem' }}
                          >
                            ✅ Mark Delivered
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleStatusUpdate(delivery._id, 'failed')}
                            style={{ fontSize: '0.85rem' }}
                          >
                            ❌ Mark Failed
                          </button>
                        </>
                      )}

                      {/* Residents/admins can cancel their pending deliveries */}
                      {canCreate && delivery.status === 'authorized' && (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleStatusUpdate(delivery._id, 'cancelled')}
                          style={{ fontSize: '0.85rem' }}
                        >
                          🚫 Cancel
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

export default Deliveries