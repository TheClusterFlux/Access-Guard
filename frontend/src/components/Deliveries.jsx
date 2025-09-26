import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Deliveries({ user }) {
  const [activeTab, setActiveTab] = useState('authorize')
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    company: '',
    trackingNumber: '',
    expectedDate: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/deliveries')
      setDeliveries(response.data.data || [])
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      setError('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await axios.post('/deliveries', formData)
      setDeliveries([response.data.data, ...deliveries])
      setFormData({
        company: '',
        trackingNumber: '',
        expectedDate: '',
        notes: ''
      })
      setActiveTab('tracking')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to authorize delivery')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      await axios.put(`/deliveries/${deliveryId}/status`, { status: newStatus })
      setDeliveries(deliveries.map(delivery => 
        delivery._id === deliveryId ? { ...delivery, status: newStatus } : delivery
      ))
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update delivery status')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'authorized': return 'orange'
      case 'delivered': return 'green'
      case 'failed': return 'red'
      case 'cancelled': return 'gray'
      default: return 'gray'
    }
  }

  if (loading) {
    return <div className="loading">Loading deliveries...</div>
  }

  return (
    <div>
      <div className="card">
        <h2>Delivery management</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div style={{ marginBottom: '1rem' }}>
          <button 
            className={`btn ${activeTab === 'authorize' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('authorize')}
            style={{ marginRight: '0.5rem' }}
          >
            Authorize delivery
          </button>
          <button 
            className={`btn ${activeTab === 'tracking' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tracking')}
          >
            Track deliveries ({deliveries.length})
          </button>
        </div>

        {activeTab === 'authorize' && (
          <div className="card">
            <h3>Authorize new delivery</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Delivery company *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Amazon, FedEx, UPS"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Tracking number</label>
                <input 
                  type="text" 
                  placeholder="Enter tracking number"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Expected date *</label>
                <input 
                  type="datetime-local" 
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  placeholder="Additional details about the delivery"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }}
                />
              </div>
              
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Authorizing...' : 'Authorize delivery'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="card">
            <h3>Delivery tracking</h3>
            {deliveries.length === 0 ? (
              <p>No deliveries found.</p>
            ) : (
              <div className="grid">
                {deliveries.map((delivery) => (
                  <div key={delivery._id} className="feature-card">
                    <h4>{delivery.company}</h4>
                    {delivery.trackingNumber && (
                      <p><strong>Tracking:</strong> {delivery.trackingNumber}</p>
                    )}
                    <p><strong>Expected:</strong> {formatDate(delivery.expectedDate)}</p>
                    <p><strong>Status:</strong> 
                      <span style={{ 
                        color: getStatusColor(delivery.status),
                        fontWeight: 'bold'
                      }}>
                        {delivery.status}
                      </span>
                    </p>
                    {delivery.notes && <p><strong>Notes:</strong> {delivery.notes}</p>}
                    {delivery.deliveredAt && (
                      <p><strong>Delivered:</strong> {formatDate(delivery.deliveredAt)}</p>
                    )}
                    
                    {/* Status update buttons for security users */}
                    {['security', 'super_admin'].includes(user.role) && delivery.status === 'authorized' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <button 
                          className="btn" 
                          onClick={() => handleStatusUpdate(delivery._id, 'delivered')}
                          style={{ marginRight: '0.5rem' }}
                        >
                          Mark delivered
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleStatusUpdate(delivery._id, 'failed')}
                        >
                          Mark failed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Deliveries 