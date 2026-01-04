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

/**
 * Helper function to run a command in a Docker container and get the result.
 * @param {import('dockerode').Container} container The dockerode container object.
 * @param {string[]} cmd The command and its arguments to execute.
 * @returns {Promise<{Output: string, ExitCode: number}>}
 */
const runCommandInContainer = async (container, cmd) => {
    const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
    });

    return new Promise((resolve, reject) => {
        exec.start({ hijack: true, stdin: true }, (err, stream) => {
            if (err) return reject(err);

            let output = '';
            stream.on('data', chunk => output += chunk.toString('utf8'));
            stream.on('end', async () => {
                try {
                    const inspect = await exec.inspect();
                    resolve({ Output: output, ExitCode: inspect.ExitCode });
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
};


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

// API to validate and reload Caddy
app.post('/api/caddy/reload', async (req, res) => {
    try {
        const container = docker.getContainer(CADDY_CONTAINER_NAME);

        // 1. Validate the configuration first
        console.log('Validating Caddyfile...');
        const validateCmd = ['caddy', 'validate', '--config', '/etc/caddy/Caddyfile'];
        const validateResult = await runCommandInContainer(container, validateCmd);

        if (validateResult.ExitCode !== 0) {
            console.error(`Caddyfile validation failed:\n${validateResult.Output}`);
            return res.status(400).json({ 
                error: 'Caddyfile validation failed. Please fix the errors.', 
                output: validateResult.Output 
            });
        }
        console.log('Caddyfile validation successful.');

        // 2. If validation is successful, then reload
        console.log('Reloading Caddy...');
        const reloadCmd = ['caddy', 'reload', '--config', '/etc/caddy/Caddyfile'];
        const reloadResult = await runCommandInContainer(container, reloadCmd);

        if (reloadResult.ExitCode === 0) {
            console.log('Caddy reloaded successfully.');
            res.json({ message: 'Caddyfile validated and reloaded successfully!', output: reloadResult.Output });
        } else {
            // This case is unlikely if validation passed, but good for safety
            console.error(`Caddy reload failed unexpectedly:\n${reloadResult.Output}`);
            res.status(500).json({ error: 'Caddy reload failed unexpectedly after successful validation.', output: reloadResult.Output });
        }

    } catch (err) {
        console.error('Error during Caddy reload process:', err);
        res.status(500).json({ error: 'Failed to execute Caddy command.', details: err.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Caddy GUI server listening at http://localhost:${port}`);
});
