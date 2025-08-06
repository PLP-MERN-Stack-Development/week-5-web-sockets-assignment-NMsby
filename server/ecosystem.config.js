module.exports = {
    apps: [{
        name: 'socketio-chat-server',
        script: 'server.js',
        env: {
            NODE_ENV: 'development',
            PORT: 5000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        instances: 1, // For Socket.io, use 1 instance or configure sticky sessions
        exec_mode: 'fork',
        watch: false,
        max_memory_restart: '1G',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s'
    }]
};