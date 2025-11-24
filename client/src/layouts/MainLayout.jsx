import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import NavBar from '../shared/NavBar'

export default function MainLayout(){
  return (
    <Box sx={{ minHeight:'100vh',  }}>
      <NavBar />
      <Container maxWidth='lg' sx={{ mt:3, pb:6 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
