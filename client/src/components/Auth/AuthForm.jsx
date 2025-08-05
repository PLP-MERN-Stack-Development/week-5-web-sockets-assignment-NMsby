import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Avatar,
    InputAdornment,
    IconButton,
    Fade,
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    Visibility,
    VisibilityOff,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AuthForm = () => {
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            toast.error('Please enter a username');
            return;
        }

        if (username.trim().length < 2) {
            toast.error('Username must be at least 2 characters');
            return;
        }

        if (username.trim().length > 30) {
            toast.error('Username must be less than 30 characters');
            return;
        }

        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
            login(username.trim());
            navigate('/chat');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Failed to join chat');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Fade in timeout={800}>
                    <Paper
                        elevation={24}
                        sx={{
                            padding: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            maxWidth: 400,
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <Avatar
                            sx={{
                                m: 1,
                                bgcolor: 'primary.main',
                                width: 64,
                                height: 64,
                            }}
                        >
                            <ChatIcon sx={{ fontSize: 32 }} />
                        </Avatar>

                        <Typography component="h1" variant="h4" gutterBottom>
                            Join Chat
                        </Typography>

                        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            Enter your username to start chatting with others in real-time
                        </Typography>

                        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoComplete="username"
                                autoFocus
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonAddIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: '1.1rem',
                                    textTransform: 'none',
                                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #1976D2 30%, #0BBBF1 90%)',
                                    },
                                }}
                            >
                                {loading ? 'Joining...' : 'Join Chat Room'}
                            </Button>

                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No registration required • Start chatting instantly
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Fade>
            </Box>
        </Container>
    );
};

export default AuthForm;