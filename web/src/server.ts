import express from 'express';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import { createServer } from 'http';

import * as frida from 'frida';

const app = express();
const port = 3000;
const app_name = 'Riptide GP';


async function connect_frida() {
  // Functions to be called from Frida script
  function handleAssetRead(data: any) {
      io.emit('asset_read', data);
  }

  try {
      // Connect to device
      const device = await frida.getUsbDevice();
      console.log('Connected to device:', device.name);

      const scriptFile = path.join(__dirname, '..', '..', 'frida', '_agent.js');

      const scriptContent = fs.readFileSync(scriptFile, 'utf8');


      //         // Export functions to be called from TypeScript
      //         rpc.exports = {
      //             getversion: getAppVersion,
      //             checkroot: isDeviceRooted
      //         };

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

      // Add socket handler for asset downloads
      // io.on('connection', (socket) => {
      //     socket.on('download_asset', async (data) => {
      //       const assetType = data.asset_type;
      //       const assetName = data.asset_name;
      //       const assetLang = data.asset_lang;
      //       const binary = await handleAssetDownload(assetType, assetName, assetLang);
      //       if (binary) {
      //           socket.emit('asset_binary', {
      //               assetType,
      //               assetName,
      //               assetLang,
      //               binary: binary
      //           });
      //       }
      //     });
      // });
      // const version = await script.exports.getversion();
      const sum = await script.exports.add(5 as any, 3 as any);
      console.log('5 + 3 =', sum);
      // const isRooted = await script.exports.checkroot();

  } catch (error) {
      console.error('Error:', error);
  }
}


// Serve static files from the dist/public directory instead of src/public
app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));


connect_frida();

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