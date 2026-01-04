const express = require('express');
const fs = require('fs');
const Docker = require('dockerode');
const path = require('path');

const app = express();
const port = 80;

// --- Configuration ---
const CADDYFILE_PATH = '/app/Caddyfile';
const DOCKER_SOCKET_PATH = '/var/run/docker.sock';
const CADDY_CONTAINER_NAME = 'caddy';
// -------------------

const docker = new Docker({ socketPath: DOCKER_SOCKET_PATH });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API to get Caddyfile content
app.get('/api/caddyfile', (req, res) => {
    fs.readFile(CADDYFILE_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading Caddyfile:', err);
            return res.status(500).json({ error: 'Failed to read Caddyfile.' });
        }
        res.json({ content: data });
    });
});

// API to save Caddyfile content
app.post('/api/caddyfile', (req, res) => {
    const { content } = req.body;
    if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid content.' });
    }

    fs.writeFile(CADDYFILE_PATH, content, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to Caddyfile:', err);
            return res.status(500).json({ error: 'Failed to save Caddyfile.' });
        }
        res.json({ message: 'Caddyfile saved successfully.' });
    });
});

// API to reload Caddy
app.post('/api/caddy/reload', async (req, res) => {
    try {
        const container = docker.getContainer(CADDY_CONTAINER_NAME);
        const exec = await container.exec({
            Cmd: ['caddy', 'reload', '--config', '/etc/caddy/Caddyfile'],
            AttachStdout: true,
            AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: true });
        
        let output = '';
        stream.on('data', chunk => output += chunk.toString('utf8'));
        
        stream.on('end', async () => {
            const inspect = await exec.inspect();
            if (inspect.ExitCode === 0) {
                console.log('Caddy reloaded successfully.');
                res.json({ message: 'Caddy reloaded successfully.', output: output });
            } else {
                console.error(`Caddy reload failed with exit code ${inspect.ExitCode}:`, output);
                res.status(500).json({ error: `Caddy reload failed.`, output: output });
            }
        });

    } catch (err) {
        console.error('Error reloading Caddy:', err);
        res.status(500).json({ error: 'Failed to execute Caddy reload command.', details: err.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Caddy GUI server listening at http://localhost:${port}`);
});
