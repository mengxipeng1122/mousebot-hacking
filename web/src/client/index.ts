import io from 'socket.io-client';

import { LogEntry, TextureInfo } from '../common';

document.addEventListener('DOMContentLoaded', () => {
    const logTableBody = document.getElementById('log') as HTMLTableElement;
    const selectedAssetDiv = document.getElementById('selected-asset') as HTMLDivElement;
    const clearButton = document.getElementById('clear') as HTMLButtonElement;

    function drawTexture(data: ArrayBuffer, width: number, height: number, pitch: number, glFormat: number, canvas: HTMLCanvasElement) {
    // Create WebGL context
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    // Enable required extension for DXT5 texture support
    const ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
    if (!ext) {
        console.error('WEBGL_compressed_texture_s3tc extension not supported');
        return;
    }


    // Check if format is DXT5 (GL_COMPRESSED_RGBA_S3TC_DXT5_EXT)
    if (glFormat === 0x83F3) { // GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
        gl.compressedTexImage2D(
            gl.TEXTURE_2D,
            0,
            ext.COMPRESSED_RGBA_S3TC_DXT5_EXT,
            width,
            height,
            0,
            new Uint8Array(data)
        );
    } else {
        console.error('Unsupported texture format:', glFormat);
        return;
    }


    // Create shader program
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, `
        attribute vec2 position;
        attribute vec2 texCoord;
        varying vec2 vTexCoord;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
            vTexCoord = texCoord;
        }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, `
        precision mediump float;
        varying vec2 vTexCoord;
        uniform sampler2D uSampler;
        void main() {
            gl_FragColor = texture2D(uSampler, vTexCoord);
        }
    `);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Create vertex buffer
    const vertices = new Float32Array([
        -1, -1,  0, 1,
         1, -1,  1, 1,
        -1,  1,  0, 0,
         1,  1,  1, 0
    ]);
    
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Set up attributes
    const positionLoc = gl.getAttribLocation(program, 'position');
    const texCoordLoc = gl.getAttribLocation(program, 'texCoord');

    gl.enableVertexAttribArray(positionLoc);
    gl.enableVertexAttribArray(texCoordLoc);

    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

    // Create and bind texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload texture data
    const pixelData = new Uint8Array(data);
    if ([
        ext.COMPRESSED_RGBA_S3TC_DXT5_EXT,
    ].includes(glFormat)) { // GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
        gl.compressedTexImage2D(
            gl.TEXTURE_2D,
            0,
            glFormat,
            width,
            height,
            0,
            new Uint8Array(data)
        );
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, glFormat, width, height, 0, glFormat, gl.UNSIGNED_BYTE, pixelData);
    }

    // Draw
    gl.viewport(0, 0, width, height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Initialize splitter functionality
    function initializeSplitter() {
        const container = document.querySelector('.container') as HTMLElement;
        const splitter = document.querySelector('.splitter') as HTMLElement;
        const leftPanel = document.querySelector('.left-panel') as HTMLElement;
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        splitter.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.pageX;
            startWidth = leftPanel.offsetWidth;
            
            container.classList.add('resizing');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const width = startWidth + (e.pageX - startX);
            const containerWidth = container.offsetWidth;
            
            // Limit the minimum and maximum width of the left panel
            if (width > 100 && width < (containerWidth - 100)) {
                leftPanel.style.width = `${width}px`;
                leftPanel.style.flex = 'none';
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            container.classList.remove('resizing');
        });
    }

    // Add column resizing functionality
    function initializeResizers() {
        const table = document.querySelector('table');
        const cols = table!.querySelectorAll('th');
        let isResizing = false;
        let currentTh: HTMLElement | null = null;
        let startX = 0;
        let startWidth = 0;

        document.querySelectorAll('.resizer').forEach((resizer) => {
            resizer.addEventListener('mousedown', function(e) {
                isResizing = true;
                //currentTh = this.parentElement as HTMLElement;
                //startX = e.pageX;
                //startWidth = currentTh.offsetWidth;
                
                document.body.classList.add('resizing');
            });
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const width = startWidth + (e.pageX - startX);
            if (currentTh && width > 50) {
                currentTh.style.width = `${width}px`;
            }
        });

        document.addEventListener('mouseup', function() {
            isResizing = false;
            currentTh = null;
            document.body.classList.remove('resizing');
        });
    }

    // Initialize both resizers
    initializeSplitter();
    // initializeResizers();

    function syntaxHighlight(json: any): string {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match: string) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    // Function to create a table row
    function createTableRow(entry: LogEntry): HTMLTableRowElement {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.assetType}</td>
            <td>${entry.assetName}</td>
            <td>${entry.assetLang}</td>
            <td>${entry.type}</td>
            <td>${entry.crc}</td>
            <td>${entry.size}</td>
        `;

        row.addEventListener('click', () => {
            document.querySelectorAll('tr.selected-row').forEach(tr => {
                tr.classList.remove('selected-row');
            });
            row.classList.add('selected-row');
            
            let name = `${entry.assetType}/${entry.assetName}`;
            if (entry.assetLang) {
                name += `/${entry.assetLang}`;
            }
            selectedAssetDiv.innerHTML = `
                <b>${name}</b><br>
                <span>Type: ${entry.type}</span><br>
                <span>CRC: ${entry.crc}</span><br>
                <span>Size: ${entry.size}</span>
            `;

            const {assetType, assetName, assetLang} = entry;

            const info = document.getElementById('selected-asset-info') as HTMLDivElement;
            info.innerHTML = '';

            if (['VuProjectAsset'].includes(assetType)) {
                fetch(`/api/asset_json?assetType=${assetType}&assetName=${assetName}&assetLang=${assetLang}`)
                    .then(res => res.json())
                    .then(data => {
                        console.log(data);
                        const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                        info.innerHTML = `
                            <div class="json-view">
                                ${syntaxHighlight(data)}
                            </div>
                        `;
                    })
                    .catch(error => {
                        const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                        info.innerHTML = `
                            <div class="json-view" style="color: #f44336;">
                                Error loading JSON data: ${error.message}
                            </div>
                        `;
                    });
            }
            else if (['VuTextureAsset'].includes(assetType)) {
                fetch(`/api/asset_texture_info?assetType=${assetType}&assetName=${assetName}&assetLang=${assetLang}`)
                    .then(res => res.json())
                    .then((textures: TextureInfo[]) => {
                        for (const texture of textures) {
                            const {level, width, height, pitch, glFormat} = texture;
                            fetch(`/api/asset_texture_binary?assetType=${assetType}&assetName=${assetName}&assetLang=${assetLang}&level=${level}`)
                                .then(res => res.arrayBuffer())
                                .then(data => {
                                    console.log(data.byteLength, width, height, pitch, glFormat);
                                    const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                                    const canvas = document.createElement('canvas');
                                    canvas.width = width;
                                    canvas.height = height;
                                    drawTexture(data, width, height, pitch, glFormat, canvas);
                                    info.appendChild(canvas);
                                });
                        }
                    });
            } else {
                const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                info.innerHTML = '';
            }
        });

        return row;
    }

    // Handle Socket.IO connection
    const socket = io();
    
    socket.on('asset_read', (entry: LogEntry) => {
        const row = createTableRow(entry);
        logTableBody.appendChild(row);
    });

    // Clear button handler
    clearButton.addEventListener('click', () => {
        logTableBody.innerHTML = '';
        selectedAssetDiv.textContent = 'No asset selected';
    });
}); 