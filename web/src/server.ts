import express from 'express';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import { createServer } from 'http';

import * as frida from 'frida';

const app = express();
const port = 3000;
const app_name = 'Riptide GP';

const fridaScriptFile = path.join(__dirname, '..', '..', 'frida', '_agent.js');


async function connect_frida() {
  // Functions to be called from Frida script
  function handleAssetRead(data: any) {
      io.emit('asset_read', data);
  }

  try {
      // Connect to device
      const device = await frida.getUsbDevice();
      console.log('Connected to device:', device.name);

      const scriptContent = fs.readFileSync(fridaScriptFile, 'utf8');

      // Get running processes
      const processes = await device.enumerateProcesses();
      
      // Find your target app process (replace with your app's name)
      const targetProcess = processes.find(p => p.name.includes(app_name));
      
      if (!targetProcess) {
          throw new Error('Target process not found');
      }

      // Attach to the process
      const session = await device.attach(targetProcess.pid);
      console.log('Attached to process:', targetProcess.name);

      // Create script
      const script = await session.createScript(scriptContent);

      // Handle script messages
      script.message.connect((message: any) => {
          if (message.type === 'send') {
              const payload = message.payload;
              switch (payload.type) {
                  case 'asset_read':
                      handleAssetRead(payload.data);
                      break;
                  default:
                      console.log('Message from script:', message);
              }
          }
      });

      // Load script
      await script.load();
      console.log('Frida Script loaded successfully');

      // Now you can call these functions from TypeScript like:
      // Add API to get asset binary
      const handleAssetDownload = async (assetType: string, assetName: string, assetLang: string) => {
          try {
            console.log(`get_asset_binary: ${assetType}, ${assetName}, ${assetLang}`);
            const binary = await script.exports.get_asset_binary(assetType, assetName, assetLang);
            return binary;
          } catch (error) {
              console.error('Error getting asset binary:', error);
              return null;
          }
      }

      // Add API endpoint for getting assets
      app.get('/api/asset', async (req, res) => {
          try {
            const { assetType, assetName, assetLang } = req.query;
            
            if (!assetType || !assetName) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const binary = await handleAssetDownload(
                assetType as string, 
                assetName as string, 
                (assetLang as string) || ''
            );

            if (!binary) {
                return res.status(404).json({ error: 'Asset not found' });
            }

            // Send binary data as response
            res.set('Content-Type', 'application/octet-stream');
            res.send(Buffer.from(binary));

        } catch (error) {
            console.error('Error in /api/asset:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
      });

    const ret = await script.exports.init();
    console.log('init:', ret);

  } catch (error) {
      console.error('Error:', error);
  }
}


// Serve static files from the dist/public directory instead of src/public
app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));

// Function to monitor changes and reconnect Frida
function monitorFridaScript() {
  fs.watch(fridaScriptFile, (eventType, filename) => {
    if (eventType === 'change') {
      console.log(`Detected change in ${filename}, reconnecting Frida...`);
      connect_frida();
    }
  });
}

// Initial connect and start monitoring
connect_frida();
monitorFridaScript();

// Set up Socket.IO
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Use httpServer instead of app.listen
const server = httpServer;

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 