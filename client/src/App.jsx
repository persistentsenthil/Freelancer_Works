import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import HomeFeedPage from './pages/HomeFeedPage'
import ProfilePage from './pages/ProfilePage'
import MessagesPage from './pages/MessagesPage'
import ConnectionsPage from './pages/ConnectionsPage'
import { useAuth } from './context/AuthContext'

export default function App(){
  const { loading } = useAuth()

  if (loading){
    return (
      <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Routes>
      <Route path='/auth' element={<AuthLayout />}>
        <Route path='login' element={<LoginPage />} />
        <Route path='signup' element={<SignupPage />} />
      </Route>

      <Route path='/' element={<MainLayout />}>
        <Route index element={<HomeFeedPage />} />
        <Route path='profile/:id' element={<ProfilePage />} />
        <Route path='connections' element={<ConnectionsPage />} />
        <Route path='messages' element={<MessagesPage />} />
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
