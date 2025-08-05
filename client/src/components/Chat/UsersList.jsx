import React from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Box,
    Chip,
    Tooltip,
    Fade,
} from '@mui/material';
import {
    Person as PersonIcon,
    Circle as CircleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const UsersList = ({ users, currentUser }) => {
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

    if (!users || users.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                    color: 'text.secondary'
                }}
            >
                <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2">No users online</Typography>
            </Box>
        );
    }

    return (
        <List sx={{ width: '100%', bgcolor: 'background.paper', py: 0 }}>
            {users.map((user, index) => {
                const isCurrentUser = user.username === currentUser?.username;

                return (
                    <Fade in timeout={300 + (index * 100)} key={user.id || user.username}>
                        <ListItem
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                                position: 'relative',
                            }}
                        >
                            <ListItemAvatar>
                                <Tooltip title={`${user.username}${isCurrentUser ? ' (You)' : ''}`}>
                                    <Avatar
                                        sx={{
                                            bgcolor: getAvatarColor(user.username),
                                            width: 40,
                                            height: 40,
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {getUserInitials(user.username)}
                                    </Avatar>
                                </Tooltip>
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: isCurrentUser ? 'bold' : 'normal',
                                                color: isCurrentUser ? 'primary.main' : 'text.primary',
                                            }}
                                        >
                                            {user.username}
                                        </Typography>

                                        {isCurrentUser && (
                                            <Chip
                                                label="You"
                                                size="small"
                                                color="primary"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Typography variant="caption" color="text.secondary">
                                        {user.joinedAt
                                            ? `Joined ${formatDistanceToNow(new Date(user.joinedAt))} ago`
                                            : 'Online'
                                        }
                                    </Typography>
                                }
                            />

                            {/* Online indicator */}
                            <CircleIcon
                                sx={{
                                    fontSize: 12,
                                    color: '#4caf50',
                                    position: 'absolute',
                                    top: 12,
                                    right: 8,
                                }}
                            />
                        </ListItem>
                    </Fade>
                );
            })}
        </List>
    );
};

export default UsersList;