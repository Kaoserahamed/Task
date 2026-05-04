# Migrating from Socket.IO to Pusher for Vercel

Since Socket.IO doesn't work on Vercel's serverless platform, here's how to migrate to Pusher Channels.

## Why Pusher?
- Works perfectly with serverless functions
- Similar API to Socket.IO
- Free tier available (100 connections, 200k messages/day)
- Easy to set up

## Setup Steps

### 1. Create Pusher Account
1. Go to https://pusher.com/channels
2. Sign up for free account
3. Create a new Channels app
4. Note your credentials:
   - app_id
   - key
   - secret
   - cluster

### 2. Install Pusher Dependencies

**Backend:**
```bash
cd Task/backend
npm install pusher
```

**Frontend:**
```bash
cd Task/admin
npm install pusher-js
```

### 3. Update Backend

Create `Task/backend/config/pusher.js`:
```javascript
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

module.exports = pusher;
```

### 4. Replace Socket.IO Events

**Old Socket.IO code:**
```javascript
const io = require('./socket').getIO();
io.emit('tour_approval_request', data);
```

**New Pusher code:**
```javascript
const pusher = require('./config/pusher');
pusher.trigger('tours', 'approval-request', data);
```

### 5. Update Frontend

**Old Socket.IO client (`Task/admin/src/socket.js`):**
```javascript
import opensocket from 'socket.io-client';
const socket = opensocket('http://localhost:4000');
export default socket;
```

**New Pusher client:**
```javascript
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
  cluster: process.env.REACT_APP_PUSHER_CLUSTER,
  encrypted: true
});

export default pusher;
```

### 6. Update Event Listeners

**Old Socket.IO:**
```javascript
import socket from './socket';

socket.on('tour_approval_request', (data) => {
  console.log('New tour approval request:', data);
});
```

**New Pusher:**
```javascript
import pusher from './pusher';

const channel = pusher.subscribe('tours');
channel.bind('approval-request', (data) => {
  console.log('New tour approval request:', data);
});
```

### 7. Environment Variables

Add to `.env`:
```env
# Pusher Configuration
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

Add to frontend `.env`:
```env
REACT_APP_PUSHER_KEY=your_key
REACT_APP_PUSHER_CLUSTER=your_cluster
```

### 8. Migration Mapping

| Socket.IO | Pusher |
|-----------|--------|
| `io.emit('event', data)` | `pusher.trigger('channel', 'event', data)` |
| `socket.on('event', callback)` | `channel.bind('event', callback)` |
| `socket.join('room')` | `pusher.subscribe('channel')` |
| `io.to('room').emit('event', data)` | `pusher.trigger('channel', 'event', data)` |

### 9. Example: Tour Approval Flow

**Backend (routes/tours.js):**
```javascript
const pusher = require('../config/pusher');

router.post('/api/tours', async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    
    // Trigger Pusher event instead of Socket.IO
    await pusher.trigger('admin-channel', 'tour-approval-request', {
      tourId: tour._id,
      tourName: tour.name,
      companyId: tour.companyId,
      timestamp: new Date()
    });
    
    res.json({ success: true, tour });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend (AdminSupport.jsx):**
```javascript
import { useEffect } from 'react';
import pusher from '../../pusher';

function AdminSupport() {
  useEffect(() => {
    const channel = pusher.subscribe('admin-channel');
    
    channel.bind('tour-approval-request', (data) => {
      console.log('New tour approval request:', data);
      // Update UI, show notification, etc.
    });
    
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);
  
  return <div>Admin Support Component</div>;
}
```

### 10. Testing

Test Pusher events:
```javascript
// Backend test endpoint
app.get('/test-pusher', async (req, res) => {
  await pusher.trigger('test-channel', 'test-event', {
    message: 'Hello from Pusher!'
  });
  res.json({ success: true });
});
```

```javascript
// Frontend test
const channel = pusher.subscribe('test-channel');
channel.bind('test-event', (data) => {
  console.log('Received:', data);
});
```

## Pusher Features

### Private Channels (for authenticated users)
```javascript
// Backend: Create auth endpoint
app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

// Frontend: Subscribe to private channel
const channel = pusher.subscribe('private-user-123');
```

### Presence Channels (see who's online)
```javascript
const channel = pusher.subscribe('presence-chat');
channel.bind('pusher:subscription_succeeded', (members) => {
  console.log('Online users:', members.count);
});
```

## Cost Comparison

**Pusher Free Tier:**
- 100 concurrent connections
- 200,000 messages per day
- Unlimited channels

**Paid Plans:** Start at $49/month for more connections

## Alternative Services

If Pusher doesn't fit your needs:
- **Ably** (similar to Pusher, better free tier)
- **AWS AppSync** (GraphQL subscriptions)
- **Firebase Realtime Database**
- **Supabase Realtime** (PostgreSQL-based)

## Resources

- [Pusher Documentation](https://pusher.com/docs/channels)
- [Pusher React Tutorial](https://pusher.com/tutorials/react-websockets)
- [Pusher vs Socket.IO](https://pusher.com/blog/socket-io-vs-pusher/)
