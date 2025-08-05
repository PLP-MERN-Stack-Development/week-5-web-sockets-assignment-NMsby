import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Avatar,
    Paper,
    TextField,
    Button,
    Divider,
    Fade,
    Tooltip,
} from '@mui/material';
import {
    Close as CloseIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';
import MessageReactions from './MessageReactions';
import CustomEmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';

const PrivateMessageDialog = ({ open, onClose, recipient }) => {
    const [message, setMessage] = useState('');
    const [fileUploadOpen, setFileUploadOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    const {
        privateMessages,
        sendPrivateMessage,
        loadPrivateMessages,
        isConnected
    } = useSocketContext();

    const conversationKey = recipient ?
        [user?.username, recipient.username].sort().join('-') : null;

    const messages = conversationKey ?
        privateMessages[conversationKey] || [] : [];

    // Load private messages when dialog opens
    useEffect(() => {
        if (open && recipient && user) {
            loadPrivateMessages(recipient.id);
        }
    }, [open, recipient, user, loadPrivateMessages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!message.trim() || !recipient || !isConnected) return;

        sendPrivateMessage(recipient.id, message.trim());
        setMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEmojiClick = (emoji) => {
        setMessage(prev => prev + emoji);
    };

    const handleFileUploaded = (fileData) => {
        if (!recipient) return;

        const fileMessage = fileData.type === 'image'
            ? `📷 Shared an image: ${fileData.originalName}`
            : `📎 Shared a file: ${fileData.originalName}`;

        sendPrivateMessage(recipient.id, fileMessage, fileData.type, fileData);
    };

    const getAvatarColor = (username) => {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#f44336', '#e91e63', '#9c27b0', '#673ab7',
            '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
            '#009688', '#4caf50', '#8bc34a', '#cddc39',
            '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
        ];
        return colors[Math.abs(hash) % colors.length];
    };

    const getUserInitials = (username) => {
        return username.substring(0, 2).toUpperCase();
    };

    const formatTime = (timestamp) => {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    };

    if (!recipient) return null;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
                }}
            >
                {/* Header */}
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                bgcolor: getAvatarColor(recipient.username),
                                width: 40,
                                height: 40,
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                            }}
                        >
                            {getUserInitials(recipient.username)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6">{recipient.username}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Private conversation
                            </Typography>
                        </Box>
                        <IconButton onClick={onClose} edge="end">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <Divider />

                {/* Messages */}
                <DialogContent
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1,
                        overflowY: 'auto',
                    }}
                >
                    {messages.length === 0 ? (
                        <Box sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'text.secondary',
                            textAlign: 'center',
                        }}>
                            <Typography variant="body2">
                                No messages yet. Start the conversation!
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ flexGrow: 1 }}>
                            {messages.map((msg, index) => {
                                const isCurrentUser = msg.sender === user?.username;

                                return (
                                    <Fade in timeout={300} key={msg.id}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                                                alignItems: 'flex-start',
                                                gap: 1,
                                                mb: 2,
                                                px: 1,
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    bgcolor: getAvatarColor(msg.sender),
                                                    width: 32,
                                                    height: 32,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {getUserInitials(msg.sender)}
                                            </Avatar>

                                            <Box
                                                sx={{
                                                    maxWidth: '75%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        mb: 0.5,
                                                        color: 'text.secondary',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {msg.sender}
                                                </Typography>

                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 1.5,
                                                        background: isCurrentUser
                                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                            : 'background.paper',
                                                        color: isCurrentUser ? 'white' : 'text.primary',
                                                        borderRadius: 2,
                                                        borderTopLeftRadius: isCurrentUser ? 2 : 0.5,
                                                        borderTopRightRadius: isCurrentUser ? 0.5 : 2,
                                                        position: 'relative',
                                                        '&:hover .reaction-button': {
                                                            opacity: 1,
                                                        },
                                                    }}
                                                >
                                                    {/* File/Image content */}
                                                    {msg.fileData && (
                                                        <Box sx={{ mb: msg.message ? 1 : 0 }}>
                                                            {msg.fileData.type === 'image' ? (
                                                                <img
                                                                    src={`${import.meta.env.VITE_SOCKET_URL}${msg.fileData.url}`}
                                                                    alt={msg.fileData.originalName}
                                                                    style={{
                                                                        maxWidth: '100%',
                                                                        maxHeight: 200,
                                                                        borderRadius: 8,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Box
                                                                    sx={{
                                                                        p: 2,
                                                                        border: 1,
                                                                        borderColor: 'divider',
                                                                        borderRadius: 1,
                                                                        bgcolor: 'background.default',
                                                                    }}
                                                                >
                                                                    <Typography variant="body2">
                                                                        📎 {msg.fileData.originalName}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    )}

                                                    <Typography variant="body2">
                                                        {msg.message}
                                                    </Typography>

                                                    {/* Reaction Button */}
                                                    <Box
                                                        className="reaction-button"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: -12,
                                                            right: isCurrentUser ? 'auto' : -12,
                                                            left: isCurrentUser ? -12 : 'auto',
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                        }}
                                                    >
                                                        <CustomEmojiPicker
                                                            trigger="reaction"
                                                            onEmojiClick={(emoji) => {
                                                                // Handle reaction - will be implemented with socket
                                                            }}
                                                        />
                                                    </Box>
                                                </Paper>

                                                {/* Message Reactions */}
                                                <MessageReactions
                                                    message={msg}
                                                    isPrivate={true}
                                                    conversationKey={conversationKey}
                                                />

                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        mt: 0.5,
                                                        color: 'text.disabled',
                                                        fontSize: '0.7rem',
                                                    }}
                                                >
                                                    {formatTime(msg.timestamp)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Fade>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Box>
                    )}
                </DialogContent>

                <Divider />

                {/* Message Input */}
                <DialogActions sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, width: '100%' }}>
                        {/* Emoji Picker */}
                        <CustomEmojiPicker
                            onEmojiClick={handleEmojiClick}
                            disabled={!isConnected}
                        />

                        {/* File Upload */}
                        <Tooltip title="Attach file">
                            <IconButton
                                color="primary"
                                disabled={!isConnected}
                                onClick={() => setFileUploadOpen(true)}
                                sx={{ mb: 0.5 }}
                            >
                                <AttachFileIcon />
                            </IconButton>
                        </Tooltip>

                        {/* Message Input */}
                        <TextField
                            fullWidth
                            multiline
                            maxRows={3}
                            placeholder={!isConnected ? "Connecting..." : "Type a private message..."}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={!isConnected}
                            variant="outlined"
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                },
                            }}
                        />

                        {/* Send Button */}
                        <Tooltip title="Send message">
                            <IconButton
                                color="primary"
                                onClick={handleSendMessage}
                                disabled={!message.trim() || !isConnected}
                                sx={{
                                    mb: 0.5,
                                    bgcolor: message.trim() ? 'primary.main' : 'action.disabledBackground',
                                    color: message.trim() ? 'white' : 'action.disabled',
                                    '&:hover': {
                                        bgcolor: message.trim() ? 'primary.dark' : 'action.disabledBackground',
                                    },
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* File Upload Dialog */}
            <FileUpload
                open={fileUploadOpen}
                onClose={() => setFileUploadOpen(false)}
                onFileUploaded={handleFileUploaded}
            />
        </>
    );
};

export default PrivateMessageDialog;