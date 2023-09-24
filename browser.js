// WebSocket server URL (replace with the actual server URL)
const serverUrl = `wss://${window.config.hostname}`;

// Create a new WebSocket connection
const socket = new WebSocket(serverUrl);

// Function to handle incoming messages
socket.onmessage = function(event) {
    const output = document.getElementById('output');
    output.innerHTML = `<p>Received: ${event.data}</p>` + output.innerHTML;
};

// Function to handle WebSocket connection opened
socket.onopen = function(event) {
    console.log('Connected to WebSocket server');
};

// Function to handle WebSocket errors
socket.onerror = function(error) {
    console.error(`WebSocket error: ${error.message}`);
};

// Function to handle WebSocket connection closure
socket.onclose = function(event) {
    if (event.wasClean) {
        console.log(`WebSocket connection closed cleanly, code: ${event.code}, reason: ${event.reason}`);
    } else {
        console.error('WebSocket connection abruptly closed');
    }
};
