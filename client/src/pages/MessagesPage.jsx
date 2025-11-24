import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import api from '../api/axios'
import { initSocket } from '../socket'
import { useAuth } from '../context/AuthContext'

const threadIdForUsers = (a,b)=> [a,b].map(id=>id.toString()).sort().join('_')

export default function MessagesPage(){
  const { me } = useAuth()
  const [threads, setThreads] = useState([])
  const [messages, setMessages] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [text, setText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const listRef = useRef(null)

  const fetchThreads = useCallback(async ()=> {
    try{
      const { data } = await api.get('/messages/threads')
      setThreads(data)
    }catch(e){
      setThreads([])
    }
  },[])

  const hydrateConnections = useCallback(async ()=> {
    try{
      const { data } = await api.get('/connections/me')
      setConnections(data)
    }catch(e){
      setConnections([])
    }
  },[])

  useEffect(()=> {
    if (!me) return
    fetchThreads()
    hydrateConnections()
    const token = localStorage.getItem('token')
    if (!token) return
    const socket = initSocket(token, me._id)
    const onReceive = (msg) => {
      const senderId = msg.from?._id?.toString() || msg.from?.toString()
      const receiverId = msg.to?._id?.toString() || msg.to?.toString()
      const partner = senderId === me._id ? msg.to : msg.from
      setThreads(prev => {
        const remaining = prev.filter(t => t.threadId !== msg.threadId)
        const existing = prev.find(t => t.threadId === msg.threadId)
        const unreadBoost = selectedThread && msg.threadId === selectedThread.threadId ? 0 : (receiverId === me._id ? 1 : 0)
        const updated = {
          threadId: msg.threadId,
          participant: existing?.participant || partner,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + unreadBoost
        }
        return [updated, ...remaining]
      })
      if (selectedThread && msg.threadId === selectedThread.threadId){
        setMessages(prev => [...prev, msg])
        setSelectedThread(prev => prev ? ({ ...prev, lastMessage: msg }) : prev)
        api.post(`/messages/thread/${msg.threadId}/seen`).catch(()=>{})
      }
    }
    socket.on('message:receive', onReceive)
    return ()=> {
      socket.off('message:receive', onReceive)
    }
  },[me, fetchThreads, hydrateConnections, selectedThread])

  const loadThreadMessages = async (threadId)=> {
    setLoadingMessages(true)
    try{
      const { data } = await api.get(`/messages/thread/${threadId}`)
      setMessages(data)
      await api.post(`/messages/thread/${threadId}/seen`)
      setThreads(prev => prev.map(t => t.threadId === threadId ? ({ ...t, unreadCount: 0 }) : t))
    }catch(e){
      setMessages([])
    }finally{
      setLoadingMessages(false)
      requestAnimationFrame(()=> {
        if (listRef.current){
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      })
    }
  }

  const openThread = async (thread)=> {
    setSelectedThread(thread)
    await loadThreadMessages(thread.threadId)
  }

  const startConversation = async (connection)=> {
    const threadId = threadIdForUsers(me._id, connection._id)
    let thread = threads.find(t => t.threadId === threadId)
    if (!thread){
      thread = { threadId, participant: connection, lastMessage: null, unreadCount: 0 }
      setThreads(prev => [thread, ...prev])
    }
    await openThread(thread)
  }

  const sendMessage = async ()=> {
    if (!selectedThread || !text.trim()) return
    try{
      const { data } = await api.post('/messages', { to: selectedThread.participant._id, text })
      setMessages(prev => [...prev, data])
      setThreads(prev => {
        const without = prev.filter(t => t.threadId !== selectedThread.threadId)
        return [{
          ...(selectedThread || {}),
          threadId: selectedThread.threadId,
          participant: selectedThread.participant,
          lastMessage: data,
          unreadCount: 0
        }, ...without]
      })
      setSelectedThread(prev => prev ? ({ ...prev, lastMessage: data }) : prev)
      setText('')
      requestAnimationFrame(()=> {
        if (listRef.current){
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      })
    }catch(e){
      alert('Unable to send message right now')
    }
  }

  if (!me){
    return (
      <Paper sx={{ p:3 }}>
        <Typography variant='h6'>Sign in to use messaging</Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p:2, minHeight:500 }}>
      <Stack direction={{ xs:'column', md:'row' }} spacing={2} sx={{ height:'100%' }}>
        <Box sx={{ width:{ xs:'100%', md:280 }, borderRight:{ md:'1px solid #e0e0e0' }, pr:1 }}>
          <Typography variant='h6' sx={{ mb:1 }}>Inbox</Typography>
          <List sx={{ maxHeight:420, overflow:'auto' }}>
            {threads.map(thread => (
              <ListItemButton
                key={thread.threadId}
                selected={selectedThread?.threadId === thread.threadId}
                onClick={()=>openThread(thread)}
                sx={{ borderRadius:2, mb:0.5 }}
              >
                <ListItemAvatar>
                  <Avatar src={thread.participant?.photoUrl}>{thread.participant?.name?.[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={thread.participant?.name}
                  secondary={thread.lastMessage?.text || 'Start the conversation'}
                />
                {thread.unreadCount > 0 && (
                  <Chip size='small' color='primary' label={thread.unreadCount} />
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Divider flexItem orientation='vertical' sx={{ display:{ xs:'none', md:'block' } }} />

        <Box sx={{ flex:1, display:'flex', flexDirection:'column' }}>
          {selectedThread ? (
            <>
              <Box sx={{ display:'flex', alignItems:'center', gap:1, borderBottom:'1px solid #eee', pb:1, mb:1 }}>
                <Avatar src={selectedThread.participant?.photoUrl}>{selectedThread.participant?.name?.[0]}</Avatar>
                <Box>
                  <Typography fontWeight={600}>{selectedThread.participant?.name}</Typography>
                  <Typography variant='body2' color='text.secondary'>{selectedThread.participant?.headline}</Typography>
                </Box>
              </Box>
              <Box ref={listRef} sx={{ flex:1, overflowY:'auto', mb:2, pr:1 }}>
                {loadingMessages && <Typography color='text.secondary'>Loading conversation...</Typography>}
                {!loadingMessages && messages.length === 0 && (
                  <Typography color='text.secondary'>Say hello 👋</Typography>
                )}
                <Stack spacing={1.5}>
                  {messages.map(msg => {
                    const isMine = msg.from === me._id || msg.from?._id === me._id
                    return (
                      <Box key={msg._id || msg.createdAt} sx={{ display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <Box sx={{
                          bgcolor: isMine ? '#0a66c2' : '#f2f2f2',
                          color: isMine ? '#fff' : 'inherit',
                          px:2,
                          py:1,
                          borderRadius:2,
                          maxWidth:'70%'
                        }}>
                          <Typography variant='body2'>{msg.text}</Typography>
                          <Typography variant='caption' sx={{ opacity:0.7, display:'block' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
              <Box sx={{ display:'flex', gap:1 }}>
                <TextField fullWidth placeholder='Write a message...' value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=> {
                  if (e.key === 'Enter' && !e.shiftKey){
                    e.preventDefault()
                    sendMessage()
                  }
                }} />
                <Button variant='contained' endIcon={<SendIcon />} onClick={sendMessage} disabled={!text.trim()}>
                  Send
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'text.secondary' }}>
              Select a conversation to get started
            </Box>
          )}
        </Box>

        <Divider flexItem orientation='vertical' sx={{ display:{ xs:'none', lg:'block' } }} />

        <Box sx={{ width:{ xs:'100%', lg:260 } }}>
          <Typography variant='h6' sx={{ mb:1 }}>Connections</Typography>
          <List sx={{ maxHeight:420, overflow:'auto' }}>
            {connections.map(conn => (
              <ListItemButton key={conn._id} onClick={()=>startConversation(conn)}>
                <ListItemAvatar>
                  <Avatar src={conn.photoUrl}>{conn.name?.[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={conn.name} secondary={conn.headline} />
              </ListItemButton>
            ))}
            {!connections.length && <Typography color='text.secondary' sx={{ p:2 }}>Connect with people to start messaging.</Typography>}
          </List>
        </Box>
      </Stack>
    </Paper>
  )
}
