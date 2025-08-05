import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
    Box,
    IconButton,
    Popover,
    Tooltip,
    Badge,
} from '@mui/material';
import {
    EmojiEmotions as EmojiIcon,
    AddReaction as AddReactionIcon,
} from '@mui/icons-material';

const CustomEmojiPicker = ({
                               onEmojiClick,
                               trigger = 'input', // 'input' or 'reaction'
                               disabled = false,
                               reactionCount = 0
                           }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        if (!disabled) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEmojiClick = (emojiData) => {
        onEmojiClick(emojiData.emoji);
        handleClose();
    };

    const renderTrigger = () => {
        if (trigger === 'reaction') {
            return (
                <Tooltip title="Add reaction">
                    <IconButton
                        size="small"
                        onClick={handleClick}
                        disabled={disabled}
                        sx={{
                            opacity: 0.7,
                            '&:hover': {
                                opacity: 1,
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        <Badge badgeContent={reactionCount > 0 ? reactionCount : null} color="primary">
                            <AddReactionIcon fontSize="small" />
                        </Badge>
                    </IconButton>
                </Tooltip>
            );
        }

        return (
            <Tooltip title="Add emoji">
                <IconButton
                    color="primary"
                    disabled={disabled}
                    onClick={handleClick}
                    sx={{ mb: 0.5 }}
                >
                    <EmojiIcon />
                </IconButton>
            </Tooltip>
        );
    };

    return (
        <Box>
            {renderTrigger()}

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: trigger === 'reaction' ? 'top' : 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: trigger === 'reaction' ? 'bottom' : 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        boxShadow: 3,
                        border: 1,
                        borderColor: 'divider',
                    },
                }}
            >
                <Box sx={{ p: 1 }}>
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={350}
                        height={400}
                        previewConfig={{
                            showPreview: false,
                        }}
                        searchPlaceHolder="Search emojis..."
                        defaultSkinTone="neutral"
                    />
                </Box>
            </Popover>
        </Box>
    );
};

export default CustomEmojiPicker;