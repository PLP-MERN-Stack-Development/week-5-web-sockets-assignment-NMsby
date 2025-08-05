import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const TypingIndicator = ({ users }) => {
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

    const getUserInitials = (username) => {
        return username.substring(0, 2).toUpperCase();
    };

    if (!users || users.length === 0) return null;

    const typingText = users.length === 1
        ? `${users[0]} is typing...`
        : users.length === 2
            ? `${users[0]} and ${users[1]} are typing...`
            : `${users[0]} and ${users.length - 1} others are typing...`;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                opacity: 0.8,
            }}
        >
            <Avatar
                sx={{
                    bgcolor: getAvatarColor(users[0]),
                    width: 32,
                    height: 32,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                }}
            >
                {getUserInitials(users[0])}
            </Avatar>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    {typingText}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Box
                        className="typing-dot"
                        sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                        }}
                    />
                    <Box
                        className="typing-dot"
                        sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                        }}
                    />
                    <Box
                        className="typing-dot"
                        sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default TypingIndicator;