import React from 'react'
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Tooltip, Button, InputBase } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import LogoutIcon from '@mui/icons-material/Logout'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import HomeIcon from '@mui/icons-material/Home'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import { useAuth } from '../context/AuthContext'
import { disconnectSocket } from '../socket'

export default function NavBar(){
  const { me, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    disconnectSocket()
    navigate('/auth/login')
  }

  return (
    <AppBar position='sticky' elevation={0} sx={{ background:'linear-gradient(90deg, #0a66c2, #004182)' }}>
      <Toolbar sx={{ display:'flex', gap:2 }}>
        <Typography component={Link} to='/' variant='h6' sx={{ textDecoration:'none', color:'#fff', fontWeight:600 }}>
        Freelancer Works
        </Typography>
        <Box sx={{ flex:1, maxWidth:360, bgcolor:'rgba(255,255,255,0.2)', borderRadius:2, px:2, py:0.5, display:'flex', alignItems:'center', gap:1 }}>
          <SearchIcon fontSize='small' sx={{ color:'#fff' }} />
          <InputBase placeholder='Search people, jobs, posts' sx={{ color:'#fff', width:'100%', '&::placeholder': { color:'rgba(255,255,255,0.7)' } }} />
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
          <Tooltip title='Home feed'>
            <IconButton color='inherit' component={Link} to='/'>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title='Connections'>
            <IconButton color='inherit' component={Link} to='/connections'>
              <PeopleAltOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title='Messages'>
            <IconButton color='inherit' component={Link} to='/messages'>
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Tooltip>
          {me ? (
            <>
              <Tooltip title='View profile'>
                <IconButton color='inherit' component={Link} to={`/profile/${me._id}`}>
                  <Avatar sx={{ width:36, height:36, bgcolor:'#fff', color:'#0a66c2' }}>{me?.name?.[0]}</Avatar>
                </IconButton>
              </Tooltip>
              <Tooltip title='Sign out'>
                <IconButton color='inherit' onClick={handleLogout}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button component={Link} to='/auth/login' variant='outlined' sx={{ borderColor:'#fff', color:'#fff' }}>
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
