document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('caddyfile-editor');
    const saveButton = document.getElementById('save-button');
    const statusMessage = document.getElementById('status-message');

    // --- Functions ---

    const showStatus = (message, isError = false, details = '') => {
        statusMessage.textContent = message;
        if (details) {
            statusMessage.textContent += `

Details:
${details}`;
        }
        statusMessage.className = isError ? 'error' : 'success';
    };

    const loadCaddyfile = async () => {
        try {
            const response = await fetch('/api/caddyfile');
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const data = await response.json();
            editor.value = data.content;
        } catch (error) {
            showStatus('Error loading Caddyfile.', true, error.message);
        }
    };

    const saveAndReload = async () => {
        saveButton.disabled = true;
        saveButton.textContent = 'Processing...';
        statusMessage.className = '';
        statusMessage.textContent = '';

        try {
            // 1. Save the file
            const saveResponse = await fetch('/api/caddyfile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editor.value }),
            });

            const saveData = await saveResponse.json();
            if (!saveResponse.ok) {
                throw new Error(saveData.error || 'Failed to save.');
            }
            showStatus('Caddyfile saved. Now reloading Caddy...', false);

            // 2. Reload Caddy
            const reloadResponse = await fetch('/api/caddy/reload', {
                method: 'POST',
            });
            
            const reloadData = await reloadResponse.json();
            if (!reloadResponse.ok) {
                throw new Error(reloadData.error, { cause: reloadData.output });
            }

            showStatus('Caddyfile saved and Caddy reloaded successfully!', false, reloadData.output);

        } catch (error) {
            console.error(error);
            showStatus(error.message, true, error.cause);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save and Reload';
        }
    };

    // --- Initial Load and Event Listeners ---

    saveButton.addEventListener('click', saveAndReload);
    loadCaddyfile();
});
