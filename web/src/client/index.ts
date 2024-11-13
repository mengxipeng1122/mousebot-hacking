import io from 'socket.io-client';

import { LogEntry, TextureInfo } from '../common';

document.addEventListener('DOMContentLoaded', () => {
    const logTableBody = document.getElementById('log') as HTMLTableElement;
    const selectedAssetDiv = document.getElementById('selected-asset') as HTMLDivElement;

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

    // Enable ETC1 texture support
    const etc1ext = gl.getExtension('WEBGL_compressed_texture_etc1');
    if (!etc1ext) {
        console.error('WEBGL_compressed_texture_etc1 extension not supported');
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
        ext.COMPRESSED_RGBA_S3TC_DXT5_EXT as number,
        etc1ext.COMPRESSED_RGB_ETC1_WEBGL as number, 
    ].includes(glFormat)) {
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

    initializeSplitter();

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
    function createTableRow(asset: string): HTMLTableRowElement {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset}</td>
        `;

        row.addEventListener('click', () => {
            document.querySelectorAll('tr.selected-row').forEach(tr => {
                tr.classList.remove('selected-row');
            });
            row.classList.add('selected-row');
            
            let name = asset;
            selectedAssetDiv.innerHTML = `
                <b>${name}</b><br>
            `;

            const assetType = name.split('/')[0];

            const info = document.getElementById('selected-asset-info') as HTMLDivElement;
            info.innerHTML = '';

            if (name === 'Assets/AssetData') {
                fetch('/api/read_asset_data')
                    .then(res => res.json())
                    .then(data => {
                        console.log(data);
                        const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                        info.innerHTML = `
                            <div class="json-view">
                                ${syntaxHighlight(data)}
                            </div>
                        `;
                    });
            }
            else if (
                [
                    'VuProjectAsset',
                    'VuDBAsset',
                ].includes(assetType)
            ) {
                fetch(`/api/get_asset_json?name=${name}`)
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
            else if ([
                'VuTextureAsset',
            ].includes(assetType)) {
                console.log(`${name} ${assetType}`);
                fetch(`/api/get_asset_texture_info?name=${name}`)
                    .then(res => res.json())
                    .then((textures: TextureInfo[]) => {
                        console.log(textures.length);
                        for (const texture of textures) {
                            const {level, width, height, pitch, glFormat} = texture;
                            fetch(`/api/get_asset_texture_binary?name=${name}&level=${level}`)
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

    fetch('/api/asset_list')
        .then(res => res.json())
        .then((assets   : string[]) => {
            for (const asset of assets) {
                const row = createTableRow(asset);
                logTableBody.appendChild(row);
            }
        });

    fetch('/api/read_asset_data')   
        .then(res => res.json())
        .then(data => {
            console.log(data);
        });


    // Clear button handler
}); 