import React, { useCallback, useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function UserRow({ user, actions, subtitle }){
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
      <Avatar src={user.photoUrl}>{user.name?.[0]}</Avatar>
      <Box sx={{ flex:1 }}>
        <Typography fontWeight={600}>{user.name}</Typography>
        <Typography variant='body2' color='text.secondary'>{subtitle || user.headline || 'Member'}</Typography>
      </Box>
      <Stack direction='row' spacing={1}>
        {actions}
      </Stack>
    </Box>
  )
}

export default function ConnectionsPage(){
  const { me } = useAuth()
  const [connections, setConnections] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async ()=> {
    if (!me) return
    setLoading(true)
    try{
      const [connRes, pendingRes, suggestRes] = await Promise.all([
        api.get('/connections/me'),
        api.get('/connections/pending'),
        api.get('/users/suggestions')
      ])
      setConnections(connRes.data)
      setIncoming(pendingRes.data.incoming)
      setOutgoing(pendingRes.data.outgoing)
      setSuggestions(suggestRes.data)
    }catch(e){
      console.error(e)
    }finally{
      setLoading(false)
    }
  },[me])

  useEffect(()=> {
    loadData()
  },[me, loadData])

  const accept = async (userId)=> {
    const target = incoming.find(u => u._id === userId)
    try{
      await api.post('/connections/accept', { fromUserId: userId })
      setIncoming(prev => prev.filter(u => u._id !== userId))
      if (target){
        setConnections(prev => [...prev, target])
      }
    }catch(e){
      alert(e.response?.data?.message || 'Unable to accept invite right now.')
    }
  }

  const decline = async (userId)=> {
    try{
      await api.post('/connections/decline', { userId })
      setIncoming(prev => prev.filter(u => u._id !== userId))
    }catch(e){
      alert(e.response?.data?.message || 'Unable to decline invite right now.')
    }
  }

  const cancel = async (userId)=> {
    try{
      await api.post('/connections/cancel', { userId })
      setOutgoing(prev => prev.filter(u => u._id !== userId))
    }catch(e){
      alert(e.response?.data?.message || 'Unable to cancel request.')
    }
  }

  const connect = async (userId)=> {
    const target = suggestions.find(u => u._id === userId)
    try{
      await api.post('/connections/request', { toUserId: userId })
      if (target){
        setOutgoing(prev => [...prev, target])
      }
      setSuggestions(prev => prev.filter(u => u._id !== userId))
    }catch(e){
      alert(e.response?.data?.message || 'Unable to send invite.')
    }
  }

  if (!me){
    return (
      <Card>
        <CardContent>
          <Typography>Please sign in to manage your network.</Typography>
        </CardContent>
      </Card>
    )
  }

  if (loading){
    return (
      <Card>
        <CardContent>
          <Typography>Loading your network…</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Stack spacing={2}>
          <Card>
            <CardHeader title='Connections' subheader={`${connections.length} total`} />
            <CardContent>
              {!connections.length && <Typography color='text.secondary'>You have no connections yet.</Typography>}
              <Stack spacing={2}>
                {connections.map(conn => (
                  <UserRow
                    key={conn._id}
                    user={conn}
                    subtitle={conn.headline}
                    actions={<Chip label='Connected' color='success' size='small' />}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title='Pending invitations'
              subheader={`${incoming.length} incoming • ${outgoing.length} outgoing`}
            />
            <CardContent>
              {!incoming.length && !outgoing.length && (
                <Typography color='text.secondary'>No pending invites.</Typography>
              )}
              <Stack spacing={2}>
                {incoming.map(user => (
                  <UserRow
                    key={`incoming-${user._id}`}
                    user={user}
                    subtitle='Wants to connect with you'
                    actions={
                      <>
                        <Button size='small' variant='contained' onClick={()=>accept(user._id)}>Accept</Button>
                        <Button size='small' variant='outlined' onClick={()=>decline(user._id)}>Decline</Button>
                      </>
                    }
                  />
                ))}
              </Stack>
              {incoming.length && outgoing.length ? <Divider sx={{ my:2 }} /> : null}
              <Stack spacing={2}>
                {outgoing.map(user => (
                  <UserRow
                    key={`outgoing-${user._id}`}
                    user={user}
                    subtitle='Awaiting response'
                    actions={
                      <Button size='small' variant='text' onClick={()=>cancel(user._id)}>Cancel</Button>
                    }
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='People you may know' />
          <CardContent>
            {!suggestions.length && (
              <Typography color='text.secondary'>We will suggest new people soon.</Typography>
            )}
            <Stack spacing={2}>
              {suggestions.map(user => (
                <UserRow
                  key={`suggest-${user._id}`}
                  user={user}
                  actions={
                    <Button size='small' variant='outlined' onClick={()=>connect(user._id)}>
                      Connect
                    </Button>
                  }
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

