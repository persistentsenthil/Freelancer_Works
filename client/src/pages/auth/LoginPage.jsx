import React, { useState } from 'react'
import { Box, TextField, Button, Typography, Stack } from '@mui/material'
import api from '../../api/axios'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  const nav = useNavigate()
  const { refresh } = useAuth()
  const submit = async ()=> {
    try{
      const res = await api.post('/auth/login',{email,password})
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('me', JSON.stringify(res.data.user))
      await refresh()
      nav('/')
    }catch(e){ alert('Login failed') }
  }
  return (
    <Box>
      <Typography variant='h5' sx={{ mb:2 }}>Sign in</Typography>
      <TextField fullWidth label='Email' sx={{ mb:2 }} value={email} onChange={e=>setEmail(e.target.value)} />
      <TextField fullWidth label='Password' type='password' sx={{ mb:2 }} value={password} onChange={e=>setPassword(e.target.value)} />
      <Stack spacing={1.5}>
        <Button variant='contained' fullWidth onClick={submit}>Sign in</Button>
        <Button component={RouterLink} to='/auth/signup' variant='text'>New here? Create an account</Button>
      </Stack>
    </Box>
  )
}
