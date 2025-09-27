import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

function Residents({ user }) {
  const [allResidents, setAllResidents] = useState([]) // Store all residents
  const [filteredResidents, setFilteredResidents] = useState([]) // Store filtered results
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const searchInputRef = React.useRef(null)

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

  // Fetch all residents once on component mount
  const fetchAllResidents = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.get('/residents')
      
      if (response.data.success) {
        const residents = response.data.data || []
        setAllResidents(residents)
        setFilteredResidents(residents) // Initially show all residents
      } else {
        setError('Failed to fetch residents')
      }
    } catch (err) {
      console.error('Error fetching residents:', err)
      setError(err.response?.data?.error || 'Failed to fetch residents')
    } finally {
      setLoading(false)
    }
  }

  // Client-side search function
  const filterResidents = useCallback((searchValue) => {
    if (!searchValue.trim()) {
      setFilteredResidents(allResidents)
      return
    }

    const searchLower = searchValue.toLowerCase().trim()
    const filtered = allResidents.filter(resident => {
      return (
        // Search by name
        resident.name.toLowerCase().includes(searchLower) ||
        // Search by unit number
        resident.unitNumber.toLowerCase().includes(searchLower) ||
        // Search by block
        resident.block.toLowerCase().includes(searchLower) ||
        // Search by notes (if any)
        (resident.notes && resident.notes.toLowerCase().includes(searchLower))
      )
    })

    setFilteredResidents(filtered)
  }, [allResidents])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      filterResidents(searchValue)
    }, 150), // Reduced debounce time since it's client-side
    [filterResidents]
  )

  useEffect(() => {
    fetchAllResidents()
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('')
        searchInputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchTerm])

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleContactResident = (resident) => {
    // Create a mailto link or show contact modal
    if (resident.phone) {
      window.open(`tel:${resident.phone}`)
    }
  }

  const formatVehicle = (vehicleInfo) => {
    if (!vehicleInfo || !vehicleInfo.make) return 'No vehicle info'
    const { make, model, color, plateNumber } = vehicleInfo
    return `${make} ${model || ''} ${color ? `(${color})` : ''} ${plateNumber ? `- ${plateNumber}` : ''}`.trim()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div>
      <div className="card">
        <h2>Resident directory</h2>
        <p>You have access to view resident information as a <strong>{user.role}</strong>.</p>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="search">Search residents</label>
          <input
            type="text"
            id="search"
            ref={searchInputRef}
            placeholder="Search by name, unit number, or block... (Ctrl+F to focus)"
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
            {loading ? 'Loading...' : `${filteredResidents.length} resident${filteredResidents.length !== 1 ? 's' : ''} found`}
          </small>
        </div>

        {loading ? (
          <div className="loading">Loading residents...</div>
        ) : (
          <>
            {filteredResidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                {searchTerm ? 'No residents found matching your search.' : 'No residents found.'}
              </div>
            ) : (
              <div className="feature-grid">
                {filteredResidents.map((resident) => (
                  <div key={resident.id} className="feature-card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4>{resident.name}</h4>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: resident.status === 'active' ? '#d4edda' : '#f8d7da',
                        color: resident.status === 'active' ? '#155724' : '#721c24',
                        borderRadius: '4px'
                      }}>
                        {resident.status}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <p><strong>Unit:</strong> {resident.unitNumber}</p>
                      <p><strong>Block:</strong> {resident.block}</p>
                      <p><strong>Phone:</strong> {resident.phone}</p>
                      <p><strong>Email:</strong> {resident.email}</p>
                      <p><strong>Vehicle:</strong> {formatVehicle(resident.vehicleInfo)}</p>
                      <p><strong>Move-in:</strong> {formatDate(resident.moveInDate)}</p>
                      {resident.notes && (
                        <p><strong>Notes:</strong> {resident.notes}</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleContactResident(resident)}
                        disabled={!resident.phone || resident.phone === 'N/A'}
                      >
                        📞 Call
                      </button>
                      {resident.email && resident.email !== 'N/A' && (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => window.open(`mailto:${resident.email}`)}
                        >
                          ✉️ Email
                        </button>
                      )}
                    </div>

                    {/* Emergency Contacts */}
                    {resident.emergencyContacts && resident.emergencyContacts.length > 0 && (
                      <details style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                          Emergency Contacts ({resident.emergencyContacts.length})
                        </summary>
                        <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                          {resident.emergencyContacts.map((contact, index) => (
                            <div key={index} style={{ marginBottom: '0.5rem' }}>
                              <strong>{contact.name}</strong> ({contact.relationship})<br />
                              <a href={`tel:${contact.phone}`} style={{ color: '#007bff' }}>
                                {contact.phone}
                              </a>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
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

export default Residents 