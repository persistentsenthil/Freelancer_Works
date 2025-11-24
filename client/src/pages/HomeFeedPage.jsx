import React, { useEffect, useState } from 'react'
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
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

dayjs.extend(relativeTime)

// const insights = [
//   { label: 'Profile views', value: 42 },
//   { label: 'Search appearances', value: 18 },
//   { label: 'Post impressions', value: 312 }
// ]

export default function HomeFeedPage(){
  const { me } = useAuth()
  const [posts, setPosts] = useState([])
  const [composer, setComposer] = useState('')
  const [mediaInput, setMediaInput] = useState('')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [suggestions, setSuggestions] = useState([])
  const [connections, setConnections] = useState([])
  const [requesting, setRequesting] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=> {
    if (!me) return
    const fetchFeed = async ()=> {
      setLoading(true)
      try{
        const { data } = await api.get('/posts')
        setPosts(data)
      }catch(e){
        console.error(e)
      }finally{
        setLoading(false)
      }
    }
    const fetchSuggestions = async ()=> {
      try{
        const { data } = await api.get('/users/suggestions')
        setSuggestions(data)
      }catch(e){
        setSuggestions([])
      }
    }
    fetchFeed()
    fetchSuggestions()
    api.get('/connections/me').then(res => setConnections(res.data)).catch(()=> setConnections([]))
  },[me])

  const createPost = async ()=> {
    if (!composer.trim()) return
    const media = mediaInput
      .split(',')
      .map(url => url.trim())
      .filter(Boolean)
    try{
      const { data } = await api.post('/posts', { text: composer, media })
      setPosts(prev => [data, ...prev])
      setComposer('')
      setMediaInput('')
    }catch(e){
      alert('Could not create post')
    }
  }

  const toggleLike = async (postId)=> {
    try{
      const { data } = await api.post(`/posts/${postId}/like`)
      setPosts(prev => prev.map(p => p._id === postId ? data : p))
    }catch(e){
      console.error(e)
    }
  }

  const submitComment = async (postId)=> {
    const draft = commentDrafts[postId]
    if (!draft?.trim()) return
    try{
      const { data } = await api.post(`/posts/${postId}/comment`, { comment: draft })
      setPosts(prev => prev.map(p => p._id === postId ? data : p))
      setCommentDrafts(prev => ({ ...prev, [postId]: '' }))
    }catch(e){
      console.error(e)
    }
  }

  const handleConnect = async (userId)=> {
    setRequesting(userId)
    try{
      await api.post('/connections/request', { toUserId: userId })
      setSuggestions(prev => prev.filter(person => person._id !== userId))
    }catch(e){
      alert(e.response?.data?.message || 'Unable to send request right now.')
    }finally{
      setRequesting(null)
    }
  }

  const likedPost = (post)=> {
    if (!me) return false
    return post.likes?.some(like => {
      const id = typeof like === 'string' ? like : like?._id
      return id?.toString() === me._id
    })
  }

  const feedEmpty = !loading && posts.length === 0

  if (!me){
    return (
      <Box
        sx={{
          minHeight:'80vh',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
        //   background:'linear-gradient(135deg,#0a66c2,#004182)'
        }}
      >
        <Card sx={{ maxWidth:520, p:4,  }}>
          <CardContent>
            <Typography variant='h4' fontWeight={600} gutterBottom>
              Welcome to Freelancer Works
            </Typography>
            <Typography color='text.secondary' sx={{ mb:3 }}>
              Sign in to share updates, discover new opportunities, and connect with your network.
            </Typography>
            <Stack spacing={1.5}>
             <Button variant='contained' size='large' href='/auth/login'>Sign in</Button>
              <Button variant='outlined' size='large' href='/auth/signup'>Create an account</Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Card sx={{ mb:2 }}>
          <CardContent>
            <Stack alignItems='center' spacing={1.5}>
              <Avatar sx={{ width:72, height:72 }} src={me.photoUrl}>{me.name?.[0]}</Avatar>
              <Typography variant='h6'>{me.name}</Typography>
              <Typography color='text.secondary' textAlign='center'>{me.headline || 'Add a headline to stand out'}</Typography>
              <Divider flexItem />
              <Stack spacing={0.5} width='100%'>
                <Typography variant='body2' color='text.secondary'>Connections</Typography>
                <Typography variant='body1' fontWeight={600}>{connections.length} people</Typography>
              </Stack>
              <Stack spacing={1} width='100%'>
                <Typography variant='body2' color='text.secondary'>Skills spotlight</Typography>
                <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                  {(me.skills?.length ? me.skills : ['Leadership','Product Sense','Strategy']).slice(0,4).map(skill=> (
                    <Chip key={skill} label={skill} size='small' />
                  ))}
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        {/* <Card>
          <CardHeader title='Insights' subheader='Last 7 days' />
          <CardContent>
            <Stack spacing={1.5}>
              {insights.map(item => (
                <Box key={item.label} sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Typography color='text.secondary'>{item.label}</Typography>
                  <Typography fontWeight={600}>{item.value}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card> */}
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ mb:2 }}>
          <CardContent>
            <Box sx={{ display:'flex', gap:2 }}>
              <Avatar src={me.photoUrl}>{me.name?.[0]}</Avatar>
              <Stack spacing={1} sx={{ flex:1 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Share something with your network..."
                  value={composer}
                  onChange={e=>setComposer(e.target.value)}
                />
                <TextField
                  fullWidth
                  placeholder='Paste image or video URL(s), separated by commas'
                  value={mediaInput}
                  onChange={e=>setMediaInput(e.target.value)}
                  helperText='Supports jpg, png, gif, mp4, webm links'
                />
              </Stack>
            </Box>
            <Box sx={{ textAlign:'right', mt:1.5 }}>
              <Button variant='contained' onClick={createPost} disabled={!composer.trim()}>Post</Button>
            </Box>
          </CardContent>
        </Card>

        {feedEmpty && (
          <Card>
            <CardContent>
              <Typography variant='h6'>Nothing here yet</Typography>
              <Typography color='text.secondary'>Follow more people to bring your feed to life.</Typography>
            </CardContent>
          </Card>
        )}

        {posts.map(post => {
          const liked = likedPost(post)
          return (
            <Card key={post._id} sx={{ mb:2 }}>
              <CardHeader
                avatar={<Avatar src={post.author?.photoUrl}>{post.author?.name?.[0]}</Avatar>}
                title={post.author?.name}
                subheader={`${post.author?.headline || 'Member'} • ${dayjs(post.createdAt).fromNow()}`}
                action={<IconButton><BookmarkAddOutlinedIcon /></IconButton>}
              />
              <CardContent>
                <Typography sx={{ whiteSpace:'pre-wrap' }}>{post.text}</Typography>
                {!!post.media?.length && (
                  <Stack spacing={1.5} sx={{ mt:2 }}>
                    {post.media.map((url, idx) => {
                      const lowered = url?.toLowerCase() || ''
                      const isVideo = /\.(mp4|webm|mov|m4v|ogg)$/.test(lowered)
                      return isVideo ? (
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
                          alt={`post-media-${idx}`}
                          sx={{ width:'100%', maxHeight:400, objectFit:'cover', borderRadius:2, border:'1px solid #eee' }}
                        />
                      )
                    })}
                  </Stack>
                )}
                <Box sx={{ display:'flex', gap:3, mt:2 }}>
                  <Button
                    variant='text'
                    startIcon={<ThumbUpOffAltIcon />}
                    onClick={()=>toggleLike(post._id)}
                    color={liked ? 'primary' : 'inherit'}
                  >
                    {post.likes?.length || 0} {liked ? 'Liked' : 'Likes'}
                  </Button>
                  <Button variant='text' startIcon={<ChatBubbleOutlineIcon />}>
                    {post.comments?.length || 0} Comments
                  </Button>
                </Box>
                <Divider sx={{ my:2 }} />
                <Stack spacing={1.5}>
                  {post.comments?.map((comment, idx)=> (
                    <Box key={`${post._id}-comment-${idx}`} sx={{ display:'flex', gap:1.5 }}>
                      <Avatar sx={{ width:32, height:32 }} src={comment.author?.photoUrl}>{comment.author?.name?.[0]}</Avatar>
                      <Box sx={{ bgcolor:'#f4f4f6', borderRadius:2, px:1.5, py:1, flex:1 }}>
                        <Typography variant='subtitle2'>{comment.author?.name}</Typography>
                        <Typography variant='body2'>{comment.text}</Typography>
                      </Box>
                    </Box>
                  ))}
                  <Box sx={{ display:'flex', gap:1.5, alignItems:'center' }}>
                    <Avatar sx={{ width:32, height:32 }} src={me.photoUrl}>{me.name?.[0]}</Avatar>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Add a comment...'
                      value={commentDrafts[post._id] || ''}
                      onChange={e=>setCommentDrafts(prev => ({ ...prev, [post._id]: e.target.value }))}
                    />
                    <Button variant='contained' onClick={()=>submitComment(post._id)} disabled={!commentDrafts[post._id]?.trim()}>
                      Send
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardHeader title='People you may know' subheader='Based on your activity' />
          <CardContent>
            <Stack spacing={2}>
              {suggestions.length === 0 && (
                <Typography color='text.secondary'>Keep building your network for better suggestions.</Typography>
              )}
              {suggestions.map(person => (
                <Box key={person._id} sx={{ display:'flex', gap:1.5, alignItems:'center' }}>
                  <Avatar src={person.photoUrl}>{person.name?.[0]}</Avatar>
                  <Box sx={{ flex:1 }}>
                    <Typography fontWeight={600}>{person.name}</Typography>
                    <Typography variant='body2' color='text.secondary'>{person.headline || 'Member'}</Typography>
                  </Box>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={()=>handleConnect(person._id)}
                    disabled={requesting === person._id}
                  >
                    {requesting === person._id ? 'Sent...' : 'Connect'}
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

