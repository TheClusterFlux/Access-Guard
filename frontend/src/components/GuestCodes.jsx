import React, { useState, useEffect } from 'react'
import axios from 'axios'

function GuestCodes({ user }) {
  const [activeTab, setActiveTab] = useState('generate')
  const [guestCodes, setGuestCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    guestName: '',
    codeType: 'PIN',
    validUntil: '',
    purpose: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchGuestCodes()
  }, [])

  const fetchGuestCodes = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/guest-codes')
      setGuestCodes(response.data.data || [])
    } catch (error) {
      console.error('Error fetching guest codes:', error)
      setError('Failed to load guest codes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await axios.post('/guest-codes', formData)
      setGuestCodes([response.data.data, ...guestCodes])
      setFormData({
        guestName: '',
        codeType: 'PIN',
        validUntil: '',
        purpose: ''
      })
      setActiveTab('history')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create guest code')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (codeId) => {
    try {
      setError('')
      setSuccess('')
      await axios.put(`/guest-codes/${codeId}/revoke`)
      setGuestCodes(guestCodes.map(code => 
        code._id === codeId ? { ...code, status: 'revoked', revokedAt: new Date() } : code
      ))
      setSuccess('Guest code revoked successfully')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to revoke code')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green'
      case 'used': return 'blue'
      case 'revoked': return 'red'
      default: return 'gray'
    }
  }

  if (loading) {
    return <div className="loading">Loading guest codes...</div>
  }

  return (
    <div>
      <div className="card">
        <h2>Guest access codes</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <div style={{ marginBottom: '1rem' }}>
          <button 
            className={`btn ${activeTab === 'generate' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('generate')}
            style={{ marginRight: '0.5rem' }}
          >
            Generate new code
          </button>
          <button 
            className={`btn ${activeTab === 'history' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            View history ({guestCodes.length})
          </button>
        </div>

        {activeTab === 'generate' && (
          <div className="card">
            <h3>Generate new guest code</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Guest name *</label>
                <input 
                  type="text" 
                  placeholder="Enter guest name"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Code type</label>
                <select 
                  value={formData.codeType}
                  onChange={(e) => setFormData({...formData, codeType: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="PIN">PIN Code (6 digits)</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Valid until *</label>
                <input 
                  type="datetime-local" 
                  value={formData.validUntil}
                  onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Purpose (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Dinner visit, Business meeting"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                />
              </div>
              
              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? 'Generating...' : 'Generate code'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <h3>Guest code history</h3>
            {guestCodes.length === 0 ? (
              <p>No guest codes found.</p>
            ) : (
              <div className="grid">
                {guestCodes.map((code) => (
                  <div key={code._id} className="feature-card">
                    <h4>{code.guestName}</h4>
                    <p><strong>Code:</strong> {code.code}</p>
                    <p><strong>Type:</strong> {code.codeType}</p>
                    <p><strong>Valid:</strong> {formatDate(code.validFrom)} - {formatDate(code.validUntil)}</p>
                    <p><strong>Status:</strong> 
                      <span style={{ 
                        color: getStatusColor(code.status),
                        fontWeight: 'bold'
                      }}>
                        {code.status}
                      </span>
                    </p>
                    {code.purpose && <p><strong>Purpose:</strong> {code.purpose}</p>}
                    {code.usedAt && <p><strong>Used:</strong> {formatDate(code.usedAt)}</p>}
                    {code.status === 'active' && (
                      <button 
                        className="btn btn-danger" 
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => handleRevoke(code._id)}
                      >
                        Revoke
                      </button>
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

export default GuestCodes 