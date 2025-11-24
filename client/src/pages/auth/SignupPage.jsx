import React, { useState } from 'react'
import { Box, TextField, Button, Typography, Stack } from '@mui/material'
import api from '../../api/axios'
import { useNavigate, Link as RouterLink } from 'react-router-dom'

export default function SignupPage(){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  const nav = useNavigate()
  const submit = async ()=> {
    try{
      await api.post('/auth/register',{name,email,password})
      alert('Registered! Please login.')
      nav('/auth/login')
    }catch(e){ alert('Register failed: '+ (e.response?.data?.message || e.message)) }
  }
  return (
    <Box>
      <Typography variant='h5' sx={{ mb:2 }}>Create account</Typography>
      <TextField fullWidth label='Full name' sx={{ mb:2 }} value={name} onChange={e=>setName(e.target.value)} />
      <TextField fullWidth label='Email' sx={{ mb:2 }} value={email} onChange={e=>setEmail(e.target.value)} />
      <TextField fullWidth label='Password' type='password' sx={{ mb:2 }} value={password} onChange={e=>setPassword(e.target.value)} />
      <Stack spacing={1.5}>
        <Button variant='contained' fullWidth onClick={submit}>Create account</Button>
        <Button component={RouterLink} to='/auth/login' variant='text'>Already have an account? Sign in</Button>
      </Stack>
    </Box>
  )
}
