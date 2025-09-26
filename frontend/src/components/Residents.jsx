import React from 'react'

function Residents({ user }) {
  const mockResidents = [
    { 
      id: 1, 
      name: 'John Smith', 
      unit: 'A101', 
      block: 'Block A', 
      phone: '+1234567890',
      vehicle: 'Toyota Camry (ABC123)'
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      unit: 'B205', 
      block: 'Block B', 
      phone: '+1234567891',
      vehicle: 'Honda Civic (XYZ789)'
    }
  ]

  return (
    <div className="card">
      <h2>Resident directory</h2>
      <p>You have access to view resident information as a <strong>{user.role}</strong>.</p>
      
      <div className="feature-grid">
        {mockResidents.map((resident) => (
          <div key={resident.id} className="feature-card">
            <h4>{resident.name}</h4>
            <p><strong>Unit:</strong> {resident.unit}</p>
            <p><strong>Block:</strong> {resident.block}</p>
            <p><strong>Phone:</strong> {resident.phone}</p>
            <p><strong>Vehicle:</strong> {resident.vehicle}</p>
            <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
              Contact resident
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Residents 