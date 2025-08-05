import React from 'react';
import {
    Box,
    Chip,
    Tooltip,
    Zoom,
    ClickAwayListener,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';

const MessageReactions = ({
                              message,
                              isPrivate = false,
                              conversationKey = null
                          }) => {
    const { user } = useAuth();
    const { addReaction } = useSocketContext();

    const handleReactionClick = (reaction) => {
        if (!user) return;
        addReaction(message.id, reaction, isPrivate, conversationKey);
    };

    const getReactionTooltip = (reaction, users) => {
        if (users.length === 0) return '';

        if (users.length === 1) {
            return `${users[0]} reacted with ${reaction}`;
        } else if (users.length === 2) {
            return `${users[0]} and ${users[1]} reacted with ${reaction}`;
        } else {
            return `${users[0]}, ${users[1]} and ${users.length - 2} others reacted with ${reaction}`;
        }
    };

    const hasUserReacted = (users) => {
        return users.includes(user?.username);
    };

    if (!message.reactions || Object.keys(message.reactions).length === 0) {
        return null;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mt: 0.5,
                maxWidth: '100%',
            }}
        >
            {Object.entries(message.reactions).map(([reaction, users]) => (
                users.length > 0 && (
                    <Zoom in key={reaction} timeout={200}>
                        <Tooltip
                            title={getReactionTooltip(reaction, users)}
                            arrow
                            placement="top"
                        >
                            <Chip
                                label={`${reaction} ${users.length}`}
                                size="small"
                                onClick={() => handleReactionClick(reaction)}
                                variant={hasUserReacted(users) ? "filled" : "outlined"}
                                color={hasUserReacted(users) ? "primary" : "default"}
                                sx={{
                                    height: 24,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: 1,
                                    },
                                    bgcolor: hasUserReacted(users)
                                        ? 'primary.light'
                                        : 'background.paper',
                                    border: hasUserReacted(users)
                                        ? '1px solid'
                                        : '1px solid',
                                    borderColor: hasUserReacted(users)
                                        ? 'primary.main'
                                        : 'divider',
                                }}
                            />
                        </Tooltip>
                    </Zoom>
                )
            ))}
        </Box>
    );
};

export default MessageReactions;