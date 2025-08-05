// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState({});
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Connect to socket server
  const connect = (username) => {
    socket.connect();
    if (username) {
      socket.emit('user_join', username);
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a public message
  const sendMessage = (message, type = 'text', fileData = null) => {
    socket.emit('send_message', { message, type, fileData });
  };

  // Send a private message
  const sendPrivateMessage = (to, message, type = 'text', fileData = null) => {
    socket.emit('private_message', { to, message, type, fileData });
  };

  // Add reaction to message
  const addReaction = (messageId, reaction, isPrivate = false, conversationKey = null) => {
    socket.emit('add_reaction', { messageId, reaction, isPrivate, conversationKey });
  };

  // Load private messages
  const loadPrivateMessages = (otherUserId) => {
    socket.emit('get_private_messages', { otherUserId });
  };

  // Set typing status
  const setTyping = (isTyping) => {
    socket.emit('typing', isTyping);
  };

  // Update user status
  const updateStatus = (status) => {
    socket.emit('update_status', status);
  };

  // Show browser notification
  const showNotification = (title, message, avatar = null) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: avatar || '/chat-icon.png',
        badge: '/chat-icon.png',
      });

      setTimeout(() => notification.close(), 5000);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);

      // Show notification for new messages
      if (document.hidden) {
        showNotification(`New message from ${message.sender}`, message.message);
      }
    };

    const onPrivateMessage = (message) => {
      const conversationKey = [message.senderId, message.recipientId].sort().join('-');
      setPrivateMessages((prev) => ({
        ...prev,
        [conversationKey]: [...(prev[conversationKey] || []), message]
      }));

      // Show notification for private messages
      if (document.hidden) {
        showNotification(`Private message from ${message.sender}`, message.message);
      }
    };

    const onPrivateMessagesLoaded = ({ conversationKey, messages: loadedMessages }) => {
      setPrivateMessages((prev) => ({
        ...prev,
        [conversationKey]: loadedMessages
      }));
    };

    const onReactionUpdated = ({ messageId, reactions, isPrivate, conversationKey }) => {
      if (isPrivate && conversationKey) {
        setPrivateMessages((prev) => ({
          ...prev,
          [conversationKey]: prev[conversationKey]?.map(msg =>
              msg.id === messageId ? { ...msg, reactions } : msg
          ) || []
        }));
      } else {
        setMessages((prev) =>
            prev.map(msg => msg.id === messageId ? { ...msg, reactions } : msg)
        );
      }
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('private_messages_loaded', onPrivateMessagesLoaded);
    socket.on('reaction_updated', onReactionUpdated);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('private_messages_loaded', onPrivateMessagesLoaded);
      socket.off('reaction_updated', onReactionUpdated);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    privateMessages,
    users,
    typingUsers,
    notifications,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    addReaction,
    loadPrivateMessages,
    setTyping,
    updateStatus,
    showNotification,
    requestNotificationPermission,
  };
};

export default socket;