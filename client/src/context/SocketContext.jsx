import React, { createContext, useContext, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketData = useSocket();

    // Connect/disconnect socket based on user authentication
    useEffect(() => {
        if (user && !socketData.isConnected) {
            socketData.connect(user.username);
            toast.success(`Welcome, ${user.username}!`);
        } else if (!user && socketData.isConnected) {
            socketData.disconnect();
        }

        return () => {
            if (socketData.isConnected) {
                socketData.disconnect();
            }
        };
    }, [user, socketData.isConnected]);

    // Handle connection status changes
    useEffect(() => {
        if (user) {
            if (socketData.isConnected) {
                toast.success('Connected to chat server');
            } else {
                toast.error('Disconnected from chat server');
            }
        }
    }, [socketData.isConnected, user]);

    return (
        <SocketContext.Provider value={socketData}>
            {children}
        </SocketContext.Provider>
    );
};