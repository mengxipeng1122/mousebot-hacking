import express from 'express';
import path from 'path';
import fs from 'fs';
import { 
  LogEntry,
  TextureInfo,
  CompiledShader,
} from './common';
import { Server } from 'socket.io';
import { createServer } from 'http';

import * as frida from 'frida';

const app = express();
const port = 3000;
const app_name = 'Riptide GP';

const fridaScriptFile = path.join(__dirname, '..', '..', 'frida', '_agent.js');


async function connect_frida() {
  // Functions to be called from Frida script
  function handleAssetRead(data: LogEntry) {
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
                      handleAssetRead(payload.data as LogEntry);
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
      app.get('/api/get_asset_binary', async (req, res) => {
          try {
            const { name } = req.query;
            
            if (!name) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const binary = await script.exports.get_asset_binary(name as string);

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

      // Add API endpoint for getting assets
      app.get('/api/get_asset_json', async (req, res) => {
          try {
            const { name } = req.query;
            
            if (!name) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const json = await script.exports.get_asset_json(name as string);

            if (!json) {
                return res.status(404).json({ error: `Asset not found for ${name}` });
            }

            // Send binary data as response
            res.set('Content-Type', 'application/json');
            res.send(json);

        } catch (error) {
            console.error('Error in /api/asset:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
      });

      // Add API endpoint for getting assets
      app.get('/api/get_asset_texture_info', async (req, res) => {
          try {
            const { name } = req.query;

            const textures_info = await script.exports.get_asset_texture_info(name as string) as TextureInfo[];    

            res.set('Content-Type', 'application/json');
            res.send(JSON.stringify(textures_info));

        } catch (error) {
            console.error('Error in /api/asset_texture:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
      });

      app.get('/api/get_asset_texture_binary', async (req, res) => {
        try {
          const { name, level } = req.query;
          const level_num = parseInt(level as string);
          const binary = await script.exports.get_asset_texture_binary(name as string, level_num);

          res.set('Content-Type', 'application/octet-stream');
          res.send(binary);

        } catch (error) {
            console.error(`Error in /api/asset_texture_binary: `, error);
            res.status(500).json({ error: 'Internal server error' });   
        }
      });

      app.get('/api/asset_list', async (req, res) => {
        try {
          const assets = await script.exports.get_asset_list();
          res.set('Content-Type', 'application/json');
          res.send(JSON.stringify(assets));
        } catch (error) {
            console.error('Error in /api/asset_list:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
      });

      app.get('/api/read_asset_data', async (req, res) => {
        try {
          const data = await script.exports.read_asset_data();
          res.set('Content-Type', 'application/json');
          res.send(data);
        } catch (error) {
            console.error('Error in /api/read_asset_data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
      });

      app.get('/api/get_asset_compiled_shader', async (req, res) => {
        try {
          const { name } = req.query;
          const shader = await script.exports.get_asset_compiled_shader(name as string) as CompiledShader;
          res.set('Content-Type', 'application/json');
          res.send(JSON.stringify(shader));
        } catch (error) {
            console.error('Error in /api/get_asset_compiled_shader:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
      });

    const ret = await script.exports.invoke_init();
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
