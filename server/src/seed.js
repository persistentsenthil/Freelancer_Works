/**
 * Seed script for LinkedIn clone
 * Usage: node src/seed.js
 *
 * This will create:
 * - 6 users
 * - some connections
 * - several posts
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linkedin_clone';

async function run(){
  await mongoose.connect(MONGO);
  console.log('Connected to Mongo for seeding');

  // clear
  await User.deleteMany({});
  await Post.deleteMany({});

  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const usersData = [
    { name: 'Alice Johnson', email: 'alice@example.com', passwordHash, headline: 'Frontend Engineer at Acme', about: 'I build delightful UIs.', skills: ['React','Design Systems'], location: 'San Francisco, CA' },
    { name: 'Bob Smith', email: 'bob@example.com', passwordHash, headline: 'Backend Engineer at Beta', about: 'APIs, systems, and scalability.', skills: ['Node.js','MongoDB'], location: 'New York, NY' },
    { name: 'Carol Lee', email: 'carol@example.com', passwordHash, headline: 'Product Manager', about: 'Shipping great products.', skills: ['Product Strategy','Communication'], location: 'Boston, MA' },
    { name: 'David Kumar', email: 'david@example.com', passwordHash, headline: 'Data Scientist', about: 'Analytics and ML.', skills: ['Python','ML Ops'], location: 'Austin, TX' },
    { name: 'Eve Zhang', email: 'eve@example.com', passwordHash, headline: 'DevOps Engineer', about: 'CI/CD and infra.', skills: ['Kubernetes','AWS'], location: 'Seattle, WA' },
    { name: 'Frank O\'Connor', email: 'frank@example.com', passwordHash, headline: 'CTO at StartupX', about: 'Building engineering teams.', skills: ['Leadership','Strategy'], location: 'Chicago, IL' }
  ];

  const created = [];
  for(const u of usersData){
    const user = await User.create(u);
    created.push(user);
  }

  // create some connections: make Alice connected to Bob and Carol, Bob connected to David
  const [alice,bob,carol,david,eve,frank] = created;
  alice.connections.push(bob._id, carol._id);
  bob.connections.push(alice._id, david._id);
  carol.connections.push(alice._id);
  david.connections.push(bob._id);
  await alice.save();
  await bob.save();
  await carol.save();
  await david.save();

  // posts
  const posts = [
    {
      author: alice._id,
      text: 'Excited to share our new open-source UI library! 🚀',
      media: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c']
    },
    {
      author: bob._id,
      text: 'Deployed a new microservice with autoscaling.',
      media: ['https://images.unsplash.com/photo-1518770660439-4636190af475']
    },
    {
      author: carol._id,
      text: 'Hiring for PM role — DM me if interested.',
      media: []
    },
    {
      author: david._id,
      text: 'Published a blog on model interpretability.',
      media: ['https://images.unsplash.com/photo-1517430816045-df4b7de11d1d']
    },
    {
      author: eve._id,
      text: 'Improved build times by 40% with caching.',
      media: ['https://images.unsplash.com/photo-1520607162513-77705c0f0d4a']
    }
  ];

  for(const p of posts){
    await Post.create(p);
  }

  console.log('Seeding complete. Created users and posts.');
  process.exit(0);
}

run().catch(err=> { console.error(err); process.exit(1); });
