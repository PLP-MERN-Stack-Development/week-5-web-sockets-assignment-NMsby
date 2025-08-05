import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    Tooltip,
    Fade,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Gif as GifIcon,
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useSocketContext } from '../../context/SocketContext';
import CustomEmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import toast from 'react-hot-toast';

const MessageInput = ({ onSendMessage, disabled }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [fileUploadOpen, setFileUploadOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { setTyping } = useSocketContext();

    // Handle message submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!message.trim() || disabled) {
            return;
        }

        if (message.trim().length > 500) {
            toast.error('Message is too long (max 500 characters)');
            return;
        }

        // Send the message
        onSendMessage(message.trim());
        setMessage('');

        // Stop typing indicator
        if (isTyping) {
            setTyping(false);
            setIsTyping(false);
        }

        // Focus back to input
        inputRef.current?.focus();
    };

    // Handle typing indicator
    const handleTypingStart = () => {
        if (!isTyping && !disabled) {
            setIsTyping(true);
            setTyping(true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setTyping(false);
        }, 2000);
    };

    // Handle input change
    const handleInputChange = (e) => {
        setMessage(e.target.value);

        if (e.target.value.trim() && !disabled) {
            handleTypingStart();
        }
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Handle emoji click
    const handleEmojiClick = (emoji) => {
        setMessage(prev => prev + emoji);
        inputRef.current?.focus();
    };

    // Handle file upload
    const handleFileUploaded = (fileData) => {
        const fileMessage = fileData.type === 'image'
            ? `📷 Shared an image: ${fileData.originalName}`
            : `📎 Shared a file: ${fileData.originalName}`;

        onSendMessage(fileMessage, fileData.type, fileData);
        toast.success('File shared successfully!');
    };

    // Handle more options menu
    const handleMoreClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMoreClose = () => {
        setAnchorEl(null);
    };

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Stop typing when component unmounts or gets disabled
    useEffect(() => {
        if (disabled && isTyping) {
            setIsTyping(false);
            setTyping(false);
        }
    }, [disabled, isTyping, setTyping]);

    return (
        <>
            <Paper
                component="form"
                onSubmit={handleSubmit}
                elevation={0}
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    {/* Emoji Picker */}
                    <CustomEmojiPicker
                        onEmojiClick={handleEmojiClick}
                        disabled={disabled}
                    />

                    {/* Attachment Button */}
                    <Tooltip title="Attach file">
                        <IconButton
                            color="primary"
                            disabled={disabled}
                            onClick={() => setFileUploadOpen(true)}
                            sx={{ mb: 0.5 }}
                        >
                            <AttachFileIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Message Input */}
                    <TextField
                        ref={inputRef}
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder={disabled ? "Connecting..." : "Type a message..."}
                        value={message}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={disabled}
                        variant="outlined"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: 'background.default',
                                '& fieldset': {
                                    borderColor: 'divider',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'primary.main',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                        }}
                    />

                    {/* More Options */}
                    <Tooltip title="More options">
                        <IconButton
                            color="primary"
                            disabled={disabled}
                            onClick={handleMoreClick}
                            sx={{ mb: 0.5 }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Send Button */}
                    <Fade in={message.trim().length > 0}>
                        <Tooltip title="Send message">
                            <IconButton
                                type="submit"
                                color="primary"
                                disabled={!message.trim() || disabled}
                                sx={{
                                    mb: 0.5,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: 'action.disabledBackground',
                                        color: 'action.disabled',
                                    },
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                        </Tooltip>
                    </Fade>
                </Box>

                {/* Character Count */}
                {message.length > 400 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Tooltip title="Character limit: 500">
                            <Box
                                sx={{
                                    fontSize: '0.75rem',
                                    color: message.length > 500 ? 'error.main' : 'text.secondary',
                                    fontWeight: message.length > 480 ? 'bold' : 'normal',
                                }}
                            >
                                {message.length}/500
                            </Box>
                        </Tooltip>
                    </Box>
                )}
            </Paper>

            {/* More Options Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMoreClose}
                transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
            >
                <MenuItem onClick={() => {
                    setFileUploadOpen(true);
                    handleMoreClose();
                }}>
                    <ListItemIcon>
                        <AttachFileIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Attach File</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleMoreClose} disabled>
                    <ListItemIcon>
                        <GifIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>GIFs (Coming Soon)</ListItemText>
                </MenuItem>
            </Menu>

            {/* File Upload Dialog */}
            <FileUpload
                open={fileUploadOpen}
                onClose={() => setFileUploadOpen(false)}
                onFileUploaded={handleFileUploaded}
            />
        </>
    );
};

export default MessageInput;