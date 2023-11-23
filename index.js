const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const e131 = require('e131');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

UNIVERSES = [0x01, 0x02]
const ESP32_IP_ADDRESS = '172.20.10.12';
const client = new e131.Client(ESP32_IP_ADDRESS);

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('e131Data', (data) => {
    console.log('Received E1.31 data:', data);
    const dataLength = data.length
    for (let i = 0; i < UNIVERSES.length; i++) {
        const universe = UNIVERSES[i];
        let slotsData = data.slice(i * 510, Math.min((i + 1) * 510, dataLength)); // Slice data for this universe

        // Update slotsData to 1/3 brightness
        slotsData = slotsData.map(value => Math.floor(value / 3));
        const packet = client.createPacket(slotsData.length);
        packet.setUniverse(universe);
        packet.setSourceName('WebSocketServer');
        packet.setOption(packet.Options.PREVIEW, true);  // don't really change any fixture
        packet.setPriority(packet.DEFAULT_PRIORITY); 
        packet.setSlotsData(slotsData);

        client.send(packet, (error) => {
        if (error) {
            console.error('Error sending E1.31 data:', error.message);
        } else {
            console.log('E1.31 data sent to ESP32');
        }
        });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});