import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Header from './components/Header'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import GuestCodes from './components/GuestCodes'
import Deliveries from './components/Deliveries'
import Users from './components/Users'
import Residents from './components/Residents'
import AccessLogs from './components/AccessLogs'
import Notifications from './components/Notifications'

// Set up axios defaults
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api'
axios.defaults.baseURL = apiBaseUrl
console.log('API Base URL:', apiBaseUrl)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password })
      const response = await axios.post('/auth/login', { email, password })
      console.log('Login response:', response.data)
      
      const { token, user } = response.data
      
      if (!token || !user) {
        console.error('Missing token or user in response:', response.data)
        return { success: false, error: 'Invalid response from server' }
      }
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      console.log('Login successful, user set:', user)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="App">
      <Header user={user} onLogout={logout} />
      <main className="main">
        <div className="container">
          <Routes>
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/dashboard" /> : <Login onLogin={login} />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                user ? <Dashboard user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/guest-codes" 
              element={
                user ? <GuestCodes user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/deliveries" 
              element={
                user ? <Deliveries user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/users" 
              element={
                user && ['admin', 'super_admin'].includes(user.role) ? 
                <Users user={user} /> : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/residents" 
              element={
                user && ['admin', 'security', 'super_admin'].includes(user.role) ? 
                <Residents user={user} /> : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/access-logs" 
              element={
                user && ['security', 'super_admin'].includes(user.role) ? 
                <AccessLogs user={user} /> : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/notifications" 
              element={
                user ? <Notifications user={user} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App 