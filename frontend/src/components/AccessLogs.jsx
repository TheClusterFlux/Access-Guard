import React from 'react'

function AccessLogs({ user }) {
  const mockLogs = [
    {
      id: 1,
      timestamp: '2025-08-03 14:30:00',
      user: 'John Smith',
      method: 'PIN',
      result: 'success',
      details: 'Resident entry - Unit A101'
    },
    {
      id: 2,
      timestamp: '2025-08-03 14:25:00',
      user: 'Alice Brown',
      method: 'PIN',
      result: 'success',
      details: 'Guest entry - Visiting John Smith'
    },
    {
      id: 3,
      timestamp: '2025-08-03 14:20:00',
      user: 'Unknown',
      method: 'PIN',
      result: 'failed',
      details: 'Invalid PIN code attempted'
    }
  ]

  return (
    <div className="card">
      <h2>Access logs</h2>
      <p>You have access to view access logs as a <strong>{user.role}</strong>.</p>
      
      <div className="feature-grid">
        {mockLogs.map((log) => (
          <div key={log.id} className="feature-card">
            <h4>{log.timestamp}</h4>
            <p><strong>User:</strong> {log.user}</p>
            <p><strong>Method:</strong> {log.method}</p>
            <p><strong>Result:</strong> 
              <span style={{ 
                color: log.result === 'success' ? 'green' : 'red',
                fontWeight: 'bold'
              }}>
                {log.result}
              </span>
            </p>
            <p><strong>Details:</strong> {log.details}</p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <button className="btn">Export logs</button>
        <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>
          Generate report
        </button>
      </div>
    </div>
  )
}

export default AccessLogs 