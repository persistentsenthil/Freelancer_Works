import React, { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage(){
  const { id } = useParams()
  const { me, setMe } = useAuth()
  const navigate = useNavigate()
  const [user,setUser]=useState(null)
  const [status, setStatus] = useState('loading')
  const [pendingAction, setPendingAction] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [form, setForm] = useState({
    name: '',
    headline: '',
    about: '',
    location: '',
    photoUrl: '',
    bannerUrl: '',
    skills: ''
  })

  useEffect(()=> {
    api.get(`/users/${id}`).then(r=> setUser(r.data)).catch(()=> setUser(null))
  },[id])

  useEffect(()=> {
    setLoadingPosts(true)
    api.get(`/posts/user/${id}`).then(r=> setPosts(r.data)).catch(()=> setPosts([])).finally(()=> setLoadingPosts(false))
  },[id])

  useEffect(()=> {
    if (!me || me._id === id) {
      setStatus(me && me._id === id ? 'self' : 'anonymous')
      return
    }
    api.get(`/connections/status/${id}`).then(res=> setStatus(res.data.status)).catch(()=> setStatus('not_connected'))
  },[id, me])

  const handleConnectionAction = async ()=> {
    if (!me) {
      navigate('/auth/login')
      return
    }
    setPendingAction(true)
    try{
      if (status === 'not_connected'){
        await api.post('/connections/request', { toUserId: id })
        setStatus('pending_outbound')
      }else if (status === 'pending_outbound'){
        await api.post('/connections/cancel', { userId: id })
        setStatus('not_connected')
      }else if (status === 'pending_inbound'){
        await api.post('/connections/accept', { fromUserId: id })
        setStatus('connected')
      }else if (status === 'connected'){
        navigate('/messages', { state: { userId: id } })
      }
    }catch(e){
      alert(e.response?.data?.message || 'Action failed')
    }finally{
      setPendingAction(false)
    }
  }

  if (!user) return <Typography>Loading profile...</Typography>

  const isSelf = status === 'self'
  const primaryActionLabel = {
    not_connected: 'Connect',
    pending_outbound: 'Cancel request',
    pending_inbound: 'Accept invite',
    connected: 'Message'
  }[status] || 'Connect'

  return (
    <Stack spacing={2}>
      <Paper sx={{ p:3, backgroundImage:'linear-gradient(135deg,#0f2027,#203a43,#2c5364)', color:'#fff' }}>
        <Stack direction={{ xs:'column', md:'row' }} spacing={2} alignItems='center'>
          <Avatar sx={{ width:120, height:120, border:'4px solid rgba(255,255,255,0.4)' }} src={user.photoUrl}>
            {user.name?.[0]}
          </Avatar>
          <Box flex={1}>
            <Typography variant='h4'>{user.name}</Typography>
            <Typography variant='h6' sx={{ opacity:0.8 }}>{user.headline}</Typography>
            <Typography sx={{ opacity:0.7 }}>{user.location}</Typography>
          </Box>
          {isSelf ? (
            <Button variant='outlined' color='inherit' onClick={()=> {
              setForm({
                name: user.name || '',
                headline: user.headline || '',
                about: user.about || '',
                location: user.location || '',
                photoUrl: user.photoUrl || '',
                bannerUrl: user.bannerUrl || '',
                skills: (user.skills || []).join(', ')
              })
              setEditOpen(true)
            }}>
              Edit Profile
            </Button>
          ) : (
            <Button
              variant='contained'
              color='secondary'
              onClick={handleConnectionAction}
              disabled={pendingAction || status === 'loading'}
            >
              {status === 'loading' ? 'Checking...' : primaryActionLabel}
            </Button>
          )}
        </Stack>
      </Paper>

      <Dialog open={editOpen} onClose={()=> !saving && setEditOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label='Full name' value={form.name} onChange={e=>setForm(prev=> ({ ...prev, name: e.target.value }))} />
            <TextField label='Headline' value={form.headline} onChange={e=>setForm(prev=> ({ ...prev, headline: e.target.value }))} />
            <TextField label='Location' value={form.location} onChange={e=>setForm(prev=> ({ ...prev, location: e.target.value }))} />
            <TextField label='Photo URL' value={form.photoUrl} onChange={e=>setForm(prev=> ({ ...prev, photoUrl: e.target.value }))} />
            <TextField label='Banner URL' value={form.bannerUrl} onChange={e=>setForm(prev=> ({ ...prev, bannerUrl: e.target.value }))} />
            <TextField
              label='About'
              multiline
              minRows={3}
              value={form.about}
              onChange={e=>setForm(prev=> ({ ...prev, about: e.target.value }))}
            />
            <TextField
              label='Skills (comma separated)'
              value={form.skills}
              onChange={e=>setForm(prev=> ({ ...prev, skills: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant='contained'
            disabled={saving}
            onClick={async ()=> {
              setSaving(true)
              try{
                const payload = {
                  name: form.name,
                  headline: form.headline,
                  about: form.about,
                  location: form.location,
                  photoUrl: form.photoUrl,
                  bannerUrl: form.bannerUrl,
                  skills: form.skills.split(',').map(s=>s.trim()).filter(Boolean)
                }
                const { data } = await api.patch('/users/me', payload)
                setUser(data)
                setMe(data)
                localStorage.setItem('me', JSON.stringify(data))
                setEditOpen(false)
              }catch(e){
                alert(e.response?.data?.message || 'Update failed')
              }finally{
                setSaving(false)
              }
            }}
          >
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p:3 }}>
        <Typography variant='h6' gutterBottom>About</Typography>
        <Typography color='text.secondary'>{user.about || 'Tell your story to let people know more about you.'}</Typography>
      </Paper>

      <Paper sx={{ p:3 }}>
        <Typography variant='h6' gutterBottom>Experience</Typography>
        <Stack spacing={2}>
          {(user.jobs?.length ? user.jobs : []).map(job => (
            <Box key={`${job.company}-${job.title}`}>
              <Typography fontWeight={600}>{job.title} @ {job.company}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {job.startDate ? new Date(job.startDate).getFullYear() : ''} - {job.current ? 'Present' : job.endDate ? new Date(job.endDate).getFullYear() : ''}
              </Typography>
              <Typography variant='body2'>{job.description}</Typography>
            </Box>
          ))}
          {!user.jobs?.length && <Typography color='text.secondary'>Add your work experience to showcase your impact.</Typography>}
        </Stack>
      </Paper>

      <Paper sx={{ p:3 }}>
        <Typography variant='h6' gutterBottom>Skills</Typography>
        <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
          {(user.skills?.length ? user.skills : ['Collaboration','Leadership','Communication']).map(skill => (
            <Chip key={skill} label={skill} />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p:3 }}>
        <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb:2 }}>
          <Typography variant='h6'>Posts</Typography>
          <Typography variant='body2' color='text.secondary'>{posts.length} shared</Typography>
        </Stack>
        {loadingPosts ? (
          <Typography color='text.secondary'>Loading posts...</Typography>
        ) : posts.length === 0 ? (
          <Typography color='text.secondary'>No posts yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {posts.map(post => (
              <Card key={post._id} variant='outlined'>
                <CardHeader
                  avatar={<Avatar src={post.author?.photoUrl}>{post.author?.name?.[0]}</Avatar>}
                  title={post.author?.name}
                  subheader={new Date(post.createdAt).toLocaleDateString()}
                  action={<IconButton><BookmarkAddOutlinedIcon /></IconButton>}
                />
                <CardContent>
                  <Typography sx={{ whiteSpace:'pre-wrap' }}>{post.text}</Typography>
                  {!!post.media?.length && (
                    <Stack spacing={1.5} sx={{ mt:2 }}>
                      {post.media.map((url, idx)=> (
                        /\.(mp4|webm|mov|m4v|ogg)$/i.test(url) ? (
                          <Box
                            component='video'
                            key={`${post._id}-media-${idx}`}
                            controls
                            src={url}
                            sx={{ width:'100%', borderRadius:2, backgroundColor:'#000' }}
                          />
                        ) : (
                          <Box
                            component='img'
                            key={`${post._id}-media-${idx}`}
                            src={url}
                            alt='post media'
                            sx={{ width:'100%', maxHeight:360, objectFit:'cover', borderRadius:2, border:'1px solid #eee' }}
                          />
                        )
                      ))}
                    </Stack>
                  )}
                  <Divider sx={{ my:2 }} />
                  <Typography variant='body2' color='text.secondary'>
                    {post.likes?.length || 0} likes · {post.comments?.length || 0} comments
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}
