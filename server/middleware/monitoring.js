// Performance monitoring middleware
const monitoringMiddleware = (req, res, next) => {
    const start = Date.now();

    // Add request ID for tracking
    req.id = Math.random().toString(36).substr(2, 9);

    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ID: ${req.id}`);

    // Monitor response time
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ID: ${req.id}`);

        // Log slow requests
        if (duration > 1000) {
            console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
        }
    });

    next();
};

// Memory usage monitoring
const logMemoryUsage = () => {
    const usage = process.memoryUsage();
    console.log('Memory Usage:', {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    });
};

// Log memory usage every 5 minutes
setInterval(logMemoryUsage, 5 * 60 * 1000);

module.exports = { monitoringMiddleware, logMemoryUsage };