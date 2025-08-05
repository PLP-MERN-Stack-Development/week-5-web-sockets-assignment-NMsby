import React, { useState } from 'react';
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
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Badge,
} from '@mui/material';
import {
    Person as PersonIcon,
    Circle as CircleIcon,
    Message as MessageIcon,
    MoreVert as MoreVertIcon,
    Block as BlockIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import PrivateMessageDialog from './PrivateMessageDialog';

const UsersList = ({ users, currentUser }) => {
    const [privateMessageOpen, setPrivateMessageOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuUser, setMenuUser] = useState(null);

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

    // Handle private message
    const handlePrivateMessage = (user) => {
        setSelectedUser(user);
        setPrivateMessageOpen(true);
        handleMenuClose();
    };

    // Handle user menu
    const handleMenuClick = (event, user) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuUser(user);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuUser(null);
    };

    // Handle user item click
    const handleUserClick = (user) => {
        if (!user.self) {
            handlePrivateMessage(user);
        }
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
        <>
            <List sx={{ width: '100%', bgcolor: 'background.paper', py: 0 }}>
                {users.map((user, index) => {
                    const isCurrentUser = user.username === currentUser?.username;

                    return (
                        <Fade in timeout={300 + (index * 100)} key={user.id || user.username}>
                            <ListItem
                                sx={{
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    cursor: isCurrentUser ? 'default' : 'pointer',
                                    '&:hover': {
                                        bgcolor: isCurrentUser ? 'transparent' : 'action.hover',
                                    },
                                    position: 'relative',
                                }}
                                onClick={() => handleUserClick(user)}
                            >
                                <ListItemAvatar>
                                    <Tooltip title={`${user.username}${isCurrentUser ? ' (You)' : ''}`}>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            badgeContent={
                                                <CircleIcon
                                                    sx={{
                                                        fontSize: 12,
                                                        color: user.status === 'online' ? '#4caf50' : '#ff9800',
                                                    }}
                                                />
                                            }
                                        >
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
                                        </Badge>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {user.joinedAt
                                                    ? `Joined ${formatDistanceToNow(new Date(user.joinedAt))} ago`
                                                    : user.status === 'online' ? 'Online' : 'Away'
                                                }
                                            </Typography>
                                        </Box>
                                    }
                                />

                                {/* Action Buttons */}
                                {!isCurrentUser && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Tooltip title="Send private message">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePrivateMessage(user);
                                                }}
                                                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                            >
                                                <MessageIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="More options">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuClick(e, user)}
                                                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </ListItem>
                        </Fade>
                    );
                })}
            </List>

            {/* User Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => handlePrivateMessage(menuUser)}>
                    <ListItemIcon>
                        <MessageIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography>Send Private Message</Typography>
                </MenuItem>

                <MenuItem onClick={handleMenuClose} disabled>
                    <ListItemIcon>
                        <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography>View Profile</Typography>
                </MenuItem>

                <MenuItem onClick={handleMenuClose} disabled>
                    <ListItemIcon>
                        <BlockIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography>Block User</Typography>
                </MenuItem>
            </Menu>

            {/* Private Message Dialog */}
            <PrivateMessageDialog
                open={privateMessageOpen}
                onClose={() => {
                    setPrivateMessageOpen(false);
                    setSelectedUser(null);
                }}
                recipient={selectedUser}
            />
        </>
    );
};

export default UsersList;