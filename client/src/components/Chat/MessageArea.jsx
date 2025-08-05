import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Paper,
    Chip,
    Fade,
    Zoom,
} from '@mui/material';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import TypingIndicator from './TypingIndicator';

const MessageArea = ({ messages, currentUser, typingUsers }) => {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle scroll to show/hide scroll-to-bottom button
    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    // Generate avatar color based on username
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

    // Get user initials
    const getUserInitials = (username) => {
        return username.substring(0, 2).toUpperCase();
    };

    // Format message timestamp
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);

        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return `Yesterday ${format(date, 'HH:mm')}`;
        } else {
            return format(date, 'MMM dd, HH:mm');
        }
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        const groups = {};

        messages.forEach(message => {
            const date = new Date(message.timestamp);
            const dateKey = format(date, 'yyyy-MM-dd');

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(message);
        });

        return groups;
    };

    // Format date separator
    const formatDateSeparator = (dateString) => {
        const date = new Date(dateString);

        if (isToday(date)) {
            return 'Today';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMMM dd, yyyy');
        }
    };

    const messageGroups = groupMessagesByDate(messages);

    if (!messages || messages.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    textAlign: 'center',
                    p: 3,
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Welcome to the chat room!
                </Typography>
                <Typography variant="body2">
                    Start a conversation by typing a message below.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', position: 'relative' }}>
            <Box
                ref={containerRef}
                onScroll={handleScroll}
                sx={{
                    height: '100%',
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}
            >
                {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
                    <Box key={dateKey}>
                        {/* Date Separator */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            <Chip
                                label={formatDateSeparator(dateKey)}
                                size="small"
                                variant="outlined"
                                sx={{ bgcolor: 'background.paper' }}
                            />
                        </Box>

                        {/* Messages for this date */}
                        {dateMessages.map((message, index) => {
                            const isCurrentUserMessage = message.sender === currentUser?.username;
                            const isSystemMessage = message.system;

                            if (isSystemMessage) {
                                return (
                                    <Fade in timeout={300} key={message.id}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                                            <Chip
                                                label={message.message}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'action.hover',
                                                    color: 'text.secondary',
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                        </Box>
                                    </Fade>
                                );
                            }

                            return (
                                <Fade in timeout={300 + (index * 50)} key={message.id}>
                                    <Box
                                        className="message-enter"
                                        sx={{
                                            display: 'flex',
                                            flexDirection: isCurrentUserMessage ? 'row-reverse' : 'row',
                                            alignItems: 'flex-start',
                                            gap: 1,
                                            mb: 2,
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: getAvatarColor(message.sender),
                                                width: 32,
                                                height: 32,
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {getUserInitials(message.sender)}
                                        </Avatar>

                                        <Box
                                            sx={{
                                                maxWidth: '70%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isCurrentUserMessage ? 'flex-end' : 'flex-start',
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
                                                {message.sender}
                                            </Typography>

                                            <Paper
                                                elevation={1}
                                                sx={{
                                                    p: 1.5,
                                                    background: isCurrentUserMessage
                                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                        : 'background.paper',
                                                    color: isCurrentUserMessage ? 'white' : 'text.primary',
                                                    borderRadius: 2,
                                                    borderTopLeftRadius: isCurrentUserMessage ? 2 : 0.5,
                                                    borderTopRightRadius: isCurrentUserMessage ? 0.5 : 2,
                                                    maxWidth: '100%',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                <Typography variant="body2">
                                                    {message.message}
                                                </Typography>
                                            </Paper>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    mt: 0.5,
                                                    color: 'text.disabled',
                                                    fontSize: '0.7rem',
                                                }}
                                            >
                                                {formatMessageTime(message.timestamp)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Fade>
                            );
                        })}
                    </Box>
                ))}

                {/* Typing Indicator */}
                {typingUsers && typingUsers.length > 0 && (
                    <TypingIndicator users={typingUsers} />
                )}

                <div ref={messagesEndRef} />
            </Box>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <Zoom in>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: 2,
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            },
                        }}
                        onClick={scrollToBottom}
                    >
                        ↓
                    </Box>
                </Zoom>
            )}
        </Box>
    );
};

export default MessageArea;