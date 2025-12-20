module.exports = {
    apps: [{
        name: "pepplanner-api",
        script: "./index.js",
        watch: false,
        env: {
            NODE_ENV: "production",
        },
        // PM2 will automatically restart the app if it crashes
        autorestart: true,
        // Optional: Restart if memory usage goes above 200MB
        max_memory_restart: '200M',
        // Delay between restarts to prevent thrashing if it crashes immediately
        restart_delay: 1000,
    }]
};
