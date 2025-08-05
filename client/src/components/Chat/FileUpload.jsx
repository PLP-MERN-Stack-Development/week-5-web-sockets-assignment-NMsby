import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    LinearProgress,
    IconButton,
    Alert,
    Chip,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Close as CloseIcon,
    InsertDriveFile as FileIcon,
    Image as ImageIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const FileUpload = ({ open, onClose, onFileUploaded }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            toast.error('Invalid file type or size too large (max 5MB)');
            return;
        }

        const file = acceptedFiles[0];
        if (file) {
            setSelectedFile(file);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPreview(e.target.result);
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 5242880, // 5MB
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            'application/pdf': ['.pdf'],
        },
    });

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 100);

            setTimeout(() => {
                setUploadProgress(100);
                onFileUploaded({
                    ...result.file,
                    type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
                });
                handleClose();
                toast.success('File uploaded successfully!');
            }, 1000);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreview(null);
        setUploadProgress(0);
        setUploading(false);
        onClose();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Upload File</Typography>
                    <IconButton onClick={handleClose} edge="end">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {!selectedFile ? (
                    <Box
                        {...getRootProps()}
                        sx={{
                            border: 2,
                            borderStyle: 'dashed',
                            borderColor: isDragActive ? 'primary.main' : 'grey.300',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        <input {...getInputProps()} />
                        <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            or click to select files
                        </Typography>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Supported formats: Images (PNG, JPG, GIF), PDF • Max size: 5MB
                        </Alert>
                    </Box>
                ) : (
                    <Box>
                        {/* File Preview */}
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                            {preview ? (
                                <Box>
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: 200,
                                            borderRadius: 8,
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ p: 3 }}>
                                    <FileIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                                </Box>
                            )}
                        </Box>

                        {/* File Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            {selectedFile.type.startsWith('image/') ? (
                                <ImageIcon color="primary" />
                            ) : (
                                <FileIcon color="primary" />
                            )}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" noWrap>
                                    {selectedFile.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip label={formatFileSize(selectedFile.size)} size="small" />
                                    <Chip label={selectedFile.type} size="small" variant="outlined" />
                                </Box>
                            </Box>
                        </Box>

                        {/* Upload Progress */}
                        {uploading && (
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Uploading...</Typography>
                                    <Typography variant="body2">{uploadProgress}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={uploadProgress} />
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose} disabled={uploading}>
                    Cancel
                </Button>
                {selectedFile && (
                    <>
                        <Button
                            onClick={() => {
                                setSelectedFile(null);
                                setPreview(null);
                            }}
                            disabled={uploading}
                        >
                            Choose Different File
                        </Button>
                        <Button
                            onClick={handleUpload}
                            variant="contained"
                            disabled={uploading}
                            startIcon={<CloudUploadIcon />}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default FileUpload;