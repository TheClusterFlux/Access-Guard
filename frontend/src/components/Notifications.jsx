import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/notifications')
      setNotifications(response.data.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count')
      setUnreadCount(response.data.data.count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      setError('')
      setSuccess('')
      await axios.put(`/notifications/${notificationId}/read`)
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true, readAt: new Date() }
          : notification
      ))
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      setSuccess('Notification marked as read')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setError('')
      setSuccess('')
      const response = await axios.put('/notifications/mark-all-read')
      
      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true,
        readAt: new Date()
      })))
      
      // Update unread count
      setUnreadCount(0)
      setSuccess(response.data.message)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to mark all notifications as read')
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      setError('')
      setSuccess('')
      await axios.delete(`/notifications/${notificationId}`)
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === notificationId)
      setNotifications(notifications.filter(n => n._id !== notificationId))
      
      // Update unread count if notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      setSuccess('Notification deleted successfully')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete notification')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info': return 'ℹ️'
      case 'alert': return '⚠️'
      case 'emergency': return '🚨'
      case 'success': return '✅'
      case 'warning': return '⚠️'
      default: return '📢'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'info': return '#3b82f6'
      case 'alert': return '#f59e0b'
      case 'emergency': return '#ef4444'
      case 'success': return '#10b981'
      case 'warning': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return <div className="loading">Loading notifications...</div>
  }

  return (
    <div className="card">
      <h2>Notifications</h2>
      <p>You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}.</p>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div style={{ marginBottom: '1rem' }}>
        {unreadCount > 0 && (
          <button 
            className="btn" 
            onClick={handleMarkAllAsRead}
            style={{ marginRight: '0.5rem' }}
          >
            Mark all as read
          </button>
        )}
        <button 
          className="btn btn-secondary" 
          onClick={fetchNotifications}
        >
          Refresh
        </button>
      </div>
      
      {notifications.length === 0 ? (
        <div className="feature-card">
          <h4>No notifications</h4>
          <p>You're all caught up! No notifications to display.</p>
        </div>
      ) : (
        <div className="feature-grid">
          {notifications.map((notification) => (
            <div key={notification._id} className="feature-card" style={{
              borderLeftColor: notification.read ? '#6c757d' : getNotificationColor(notification.type),
              opacity: notification.read ? 0.7 : 1
            }}>
              <h4>
                {getNotificationIcon(notification.type)} {notification.title}
                {!notification.read && (
                  <span style={{ 
                    color: getNotificationColor(notification.type), 
                    fontSize: '0.8rem',
                    marginLeft: '0.5rem'
                  }}>
                    (New)
                  </span>
                )}
              </h4>
              <p>{notification.message}</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                {formatDate(notification.createdAt)}
              </p>
              {notification.read && notification.readAt && (
                <p style={{ fontSize: '0.8rem', color: '#999' }}>
                  Read: {formatDate(notification.readAt)}
                </p>
              )}
              
              <div style={{ marginTop: '0.5rem' }}>
                {!notification.read && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleMarkAsRead(notification._id)}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Mark as Read
                  </button>
                )}
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDeleteNotification(notification._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications 