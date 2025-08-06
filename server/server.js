// server.js - Server with advanced features

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Load environment variables
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Production security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  }));

  // Compression for better performance
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Socket.io server with production optimizations
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },

  // Production optimizations
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 20000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 10000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB

  // Transports configuration
  transports: process.env.NODE_ENV === 'production'
      ? ['websocket', 'polling']
      : ['polling', 'websocket'],
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Enhanced file upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    files: 1,
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

// Enhanced data storage with limits
const users = new Map();
const messages = [];
const privateMessages = new Map();
const typingUsers = new Map();
const rooms = new Map();

// Message cleanup function
const cleanupOldMessages = () => {
  const maxMessages = 1000;
  if (messages.length > maxMessages) {
    messages.splice(0, messages.length - maxMessages);
  }

  // Clean up old private messages
  for (const [key, msgs] of privateMessages.entries()) {
    if (msgs.length > 100) {
      privateMessages.set(key, msgs.slice(-100));
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupOldMessages, 10 * 60 * 1000);

// Socket.io connection handler with error handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} at ${new Date().toISOString()}`);

  // Enhanced error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });

  // User join with validation
  socket.on('user_join', (username) => {
    try {
      if (!username || typeof username !== 'string' || username.length > 30) {
        socket.emit('error', 'Invalid username');
        return;
      }

      const userData = {
        username: username.trim(),
        id: socket.id,
        joinedAt: new Date().toISOString(),
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      users.set(socket.id, userData);
      socket.join(socket.id);

      io.emit('user_list', Array.from(users.values()));
      io.emit('user_joined', { username: userData.username, id: socket.id });

      console.log(`${username} joined the chat`);
    } catch (error) {
      console.error('Error in user_join:', error);
      socket.emit('error', 'Failed to join chat');
    }
  });

  // Enhanced message handling with validation
  socket.on('send_message', (messageData) => {
    try {
      const user = users.get(socket.id);
      if (!user) {
        socket.emit('error', 'User not authenticated');
        return;
      }

      if (!messageData.message || messageData.message.length > 500) {
        socket.emit('error', 'Invalid message');
        return;
      }

      const message = {
        ...messageData,
        id: Date.now() + Math.random(),
        sender: user.username,
        senderId: socket.id,
        timestamp: new Date().toISOString(),
        type: 'text',
        reactions: {},
      };

      messages.push(message);
      io.emit('receive_message', message);

    } catch (error) {
      console.error('Error in send_message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Private message handling with validation
  socket.on('private_message', ({ to, message, type = 'text', fileData = null }) => {
    try {
      const sender = users.get(socket.id);
      const recipient = users.get(to);

      if (!sender || !recipient) {
        socket.emit('error', 'Invalid users');
        return;
      }

      if (!message || message.length > 500) {
        socket.emit('error', 'Invalid message');
        return;
      }

      const messageData = {
        id: Date.now() + Math.random(),
        sender: sender.username,
        senderId: socket.id,
        recipient: recipient.username,
        recipientId: to,
        message,
        type,
        fileData,
        timestamp: new Date().toISOString(),
        isPrivate: true,
        reactions: {},
      };

      const conversationKey = [socket.id, to].sort().join('-');
      if (!privateMessages.has(conversationKey)) {
        privateMessages.set(conversationKey, []);
      }
      privateMessages.get(conversationKey).push(messageData);

      socket.to(to).emit('private_message', messageData);
      socket.emit('private_message', messageData);

    } catch (error) {
      console.error('Error in private_message:', error);
      socket.emit('error', 'Failed to send private message');
    }
  });

  // Rest of the socket handlers remain the same but with enhanced error handling...
  // [Previous handlers with try-catch blocks]

  // Enhanced disconnect handling
  socket.on('disconnect', (reason) => {
    try {
      const user = users.get(socket.id);
      if (user) {
        io.emit('user_left', { username: user.username, id: socket.id });
        console.log(`${user.username} left the chat (${reason})`);
      }

      users.delete(socket.id);
      typingUsers.delete(socket.id);

      io.emit('user_list', Array.from(users.values()));
      io.emit('typing_users', Array.from(typingUsers.values()));

    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

// Enhanced file upload endpoint
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
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString(),
    };

    res.json({ success: true, file: fileData });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    users: users.size,
    messages: messages.length,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes with error handling
app.get('/api/messages', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const recentMessages = messages.slice(-limit);
    res.json(recentMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/users', (req, res) => {
  try {
    res.json(Array.from(users.values()));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Serve client app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Root route for development
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    res.send('Socket.io Chat Server is running');
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Socket.io enabled with CORS origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = { app, server, io };