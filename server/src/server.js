require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const connectionRoutes = require('./routes/connections');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const { initSocket } = require('./utils/socket');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);

// health
app.get('/api/health', (req,res)=> res.json({ok:true}));

const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linkedin_clone';

mongoose.connect(MONGO).then(()=> {
  console.log('Mongo connected');
  initSocket(server);
  server.listen(PORT, ()=> console.log('Server listening on', PORT));
}).catch(err=> {
  console.error('Mongo connection error', err);
  process.exit(1);
});
