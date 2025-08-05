import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    useTheme,
    useMediaQuery,
    Badge,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    MoreVert as MoreVertIcon,
    People as PeopleIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';
import UsersList from './UsersList';
import MessageArea from './MessageArea';
import MessageInput from './MessageInput';
import toast from 'react-hot-toast';

const drawerWidth = 280;

const ChatRoom = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [darkMode, setDarkMode] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isConnected, users, messages, sendMessage, typingUsers } = useSocketContext();

    // Handle drawer toggle for mobile
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Handle user menu
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Handle logout
    const handleLogout = () => {
        handleMenuClose();
        logout();
        toast.success('Logged out successfully');
        navigate('/auth');
    };

    // Handle theme toggle
    const handleThemeToggle = () => {
        setDarkMode(!darkMode);
        handleMenuClose();
        toast.success(`Switched to ${darkMode ? 'light' : 'dark'} mode`);
    };

    // Close mobile drawer when screen size changes
    useEffect(() => {
        if (!isMobile) {
            setMobileOpen(false);
        }
    }, [isMobile]);

    // Show connection status
    useEffect(() => {
        if (!isConnected && user) {
            toast.error('Disconnected from chat server');
        }
    }, [isConnected, user]);

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    minHeight: '64px !important',
                }}
            >
                <PeopleIcon sx={{ mr: 2 }} />
                <Typography variant="h6" noWrap component="div">
                    Online Users
                </Typography>
                <Badge
                    badgeContent={users.length}
                    color="secondary"
                    sx={{ ml: 'auto' }}
                />
            </Toolbar>

            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <UsersList users={users} currentUser={user} />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <ChatIcon sx={{ mr: 2 }} />

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Socket.io Chat Room
                    </Typography>

                    {/* Connection Status */}
                    <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: isConnected ? '#4caf50' : '#f44336',
                                mr: 2,
                                boxShadow: `0 0 8px ${isConnected ? '#4caf50' : '#f44336'}`,
                            }}
                        />
                    </Tooltip>

                    {/* User Info */}
                    <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                        Welcome, {user?.username}
                    </Typography>

                    {/* More Options Menu */}
                    <IconButton
                        color="inherit"
                        onClick={handleMenuOpen}
                        aria-label="more options"
                    >
                        <MoreVertIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* User Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleThemeToggle}>
                    <ListItemIcon>
                        {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText>
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Settings</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                </MenuItem>
            </Menu>

            {/* Navigation Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Toolbar /> {/* Spacer for fixed AppBar */}

                {/* Messages Area */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
                    <MessageArea
                        messages={messages}
                        currentUser={user}
                        typingUsers={typingUsers}
                    />
                </Box>

                {/* Message Input */}
                <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <MessageInput
                        onSendMessage={sendMessage}
                        disabled={!isConnected}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default ChatRoom;