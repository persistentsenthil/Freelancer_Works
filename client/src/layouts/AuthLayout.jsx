import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Container, Paper } from '@mui/material'
export default function AuthLayout(){
  return (
    <Box sx={{ minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center', bgcolor: '#f5f7fa' }}>
      <Container maxWidth='sm'><Paper sx={{ p:3 }}><Outlet /></Paper></Container>
    </Box>
  )
}
