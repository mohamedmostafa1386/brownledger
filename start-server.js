const { spawn } = require('child_process');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

// Ensure NEXTAUTH_URL is set
if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3001';
    console.log('Set NEXTAUTH_URL to http://localhost:3001');
}

console.log('Starting server with env:', {
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
});

const server = spawn('npx', ['next', 'start', '-p', '3001'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env } // Explicitly pass loaded env
});

server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
});
