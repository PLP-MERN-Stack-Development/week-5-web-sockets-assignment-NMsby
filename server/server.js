// server.js - Server with advanced features

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/gif', 'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Store connected users, messages, and rooms
const users = {};
const messages = [];
const privateMessages = {};
const typingUsers = {};
const rooms = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', (username) => {
    users[socket.id] = {
      username,
      id: socket.id,
      joinedAt: new Date().toISOString(),
      status: 'online'
    };

    // Join user to their own room for private messages
    socket.join(socket.id);

    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
    console.log(`${username} joined the chat`);
  });

  // Handle public chat messages
  socket.on('send_message', (messageData) => {
    const message = {
      ...messageData,
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      timestamp: new Date().toISOString(),
      type: 'text',
      reactions: {},
    };

    messages.push(message);

    // Limit stored messages to prevent memory issues
    if (messages.length > 100) {
      messages.shift();
    }

    io.emit('receive_message', message);
  });

  // Handle private messages
  socket.on('private_message', ({ to, message, type = 'text', fileData = null }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      recipient: users[to]?.username || 'Unknown',
      recipientId: to,
      message,
      type,
      fileData,
      timestamp: new Date().toISOString(),
      isPrivate: true,
      reactions: {},
    };

    // Store private message
    const conversationKey = [socket.id, to].sort().join('-');
    if (!privateMessages[conversationKey]) {
      privateMessages[conversationKey] = [];
    }
    privateMessages[conversationKey].push(messageData);

    // Send to recipient and sender
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle message reactions
  socket.on('add_reaction', ({ messageId, reaction, isPrivate = false, conversationKey = null }) => {
    const username = users[socket.id]?.username;
    if (!username) return;

    if (isPrivate && conversationKey) {
      // Handle private message reactions
      const conversation = privateMessages[conversationKey];
      if (conversation) {
        const message = conversation.find(msg => msg.id === messageId);
        if (message) {
          if (!message.reactions[reaction]) {
            message.reactions[reaction] = [];
          }

          // Toggle reaction
          const userIndex = message.reactions[reaction].indexOf(username);
          if (userIndex === -1) {
            message.reactions[reaction].push(username);
          } else {
            message.reactions[reaction].splice(userIndex, 1);
            if (message.reactions[reaction].length === 0) {
              delete message.reactions[reaction];
            }
          }

          // Emit to conversation participants
          const participants = conversationKey.split('-');
          participants.forEach(participantId => {
            io.to(participantId).emit('reaction_updated', {
              messageId,
              reactions: message.reactions,
              isPrivate: true,
              conversationKey
            });
          });
        }
      }
    } else {
      // Handle public message reactions
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        if (!message.reactions[reaction]) {
          message.reactions[reaction] = [];
        }

        // Toggle reaction
        const userIndex = message.reactions[reaction].indexOf(username);
        if (userIndex === -1) {
          message.reactions[reaction].push(username);
        } else {
          message.reactions[reaction].splice(userIndex, 1);
          if (message.reactions[reaction].length === 0) {
            delete message.reactions[reaction];
          }
        }

        io.emit('reaction_updated', {
          messageId,
          reactions: message.reactions,
          isPrivate: false
        });
      }
    }
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;

      if (isTyping) {
        typingUsers[socket.id] = username;
      } else {
        delete typingUsers[socket.id];
      }

      io.emit('typing_users', Object.values(typingUsers));
    }
  });

  // Handle private conversation requests
  socket.on('get_private_messages', ({ otherUserId }) => {
    const conversationKey = [socket.id, otherUserId].sort().join('-');
    const conversation = privateMessages[conversationKey] || [];
    socket.emit('private_messages_loaded', {
      conversationKey,
      messages: conversation
    });
  });

  // Handle user status updates
  socket.on('update_status', (status) => {
    if (users[socket.id]) {
      users[socket.id].status = status;
      io.emit('user_list', Object.values(users));
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
      console.log(`${username} left the chat`);
    }

    delete users[socket.id];
    delete typingUsers[socket.id];

    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.json({ success: true, file: fileData });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// API routes
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };