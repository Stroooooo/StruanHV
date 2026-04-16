const GuacamoleLite = require('guacamole-lite');

const websocketOptions = {
    port: 8081
};

const guacdOptions = {
    host: process.env.GUACD_HOST || 'guacd',
    port: parseInt(process.env.GUACD_PORT || '4822')
};

const clientOptions = {
    crypt: {
        cypher: 'AES-256-CBC',
        key: process.env.GUACAMOLE_SECRET_KEY || 'ThisIsA32CharacterLongSecretKey!'
    },
    log: {
        level: process.env.LOG_LEVEL || 'NORMAL'
    }
};

const guacServer = new GuacamoleLite(websocketOptions, guacdOptions, clientOptions);

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

console.log('Guacamole-lite websocket server running on port 8081');
