import io from 'socket.io-client';

import { TextureInfo } from '../common';

document.addEventListener('DOMContentLoaded', () => {
    const assetsTableBody = document.getElementById('assets') as HTMLTableElement;
    const selectedAssetDiv = document.getElementById('selected-asset') as HTMLDivElement;

    function get_hexdump_from_arraybuffer(data: ArrayBuffer) {
        // Convert ArrayBuffer to hex dump
        const bytes = new Uint8Array(data);
        let hexDump = '';
        let asciiDump = '';
        
        for (let i = 0; i < bytes.length; i++) {
            // Add offset at start of each line
            if (i % 16 === 0) {
                if (i > 0) {
                    hexDump += `  ${asciiDump}\n`;
                    asciiDump = '';
                }
                hexDump += `${i.toString(16).padStart(8, '0')}: `;
            }
            
            // Add hex value
            hexDump += `${bytes[i].toString(16).padStart(2, '0')} `;
            
            // Add ASCII character if printable, otherwise add dot
            asciiDump += bytes[i] >= 32 && bytes[i] <= 126 ? 
                String.fromCharCode(bytes[i]) : '.';
        }
        
        // Add padding and final ASCII section for last line
        const remaining = bytes.length % 16;
        if (remaining > 0) {
            hexDump += '   '.repeat(16 - remaining);
            hexDump += `  ${asciiDump}`;
        }
        return hexDump;
    }



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

            const downloadButton = document.createElement('button');
            downloadButton.innerHTML = 'Download';
            downloadButton.addEventListener('click', () => {
                fetch(`/api/get_asset_binary?name=${name}`)
                    .then(res => res.arrayBuffer())
                    .then(data => {
                        const blob = new Blob([data], { type: 'application/octet-stream' });
                        const filename = name.replace(/\//g, '_')+'.bin';
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                    });
            });
            selectedAssetDiv.appendChild(downloadButton);

            const assetType = name.split('/')[0];

            if ([
                'VuStaticModelAsset',
            ].includes(assetType)) {
                const link = document.createElement('a');
                link.href = `./show_asset_static_model.html?name=${name}`;
                link.innerHTML = 'Link';
                selectedAssetDiv.appendChild(link);
            }


            const info = document.getElementById('selected-asset-info') as HTMLDivElement;
            info.innerHTML = '';

            if (name === 'Assets/AssetData') {
                fetch('/api/read_asset_data')
                    .then(res => res.json())
                    .then(data => {
                        console.log(data);
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
                    'VuShaderAsset',
                    'VuStringAsset',
                    'VuPfxAsset',
                    'VuTemplateAsset',
                ].includes(assetType)
            ) {
                fetch(`/api/get_asset_json?name=${name}`)
                    .then(res => res.json())
                    .then(data => {
                        console.log(data);
                        info.innerHTML = `
                            <div class="json-view">
                                ${syntaxHighlight(data)}
                            </div>
                        `;
                    })
                    .catch(error => {
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
            } else if ([
                'VuCompiledShaderAsset',
            ].includes(assetType)) {
                fetch(`/api/get_asset_compiled_shader?name=${name}`)
                    .then(res => res.json())
                    .then(shader => {
                        info.innerHTML = `
                            <p>Vertex Shader</p>
                            <div class="json-view">
                                ${shader.vertex_shader}
                            </div>
                            <p>Fragment Shader</p>
                            <div class="json-view">
                                ${shader.fragment_shader}
                            </div>
                        `;
                    });
            } else if ([
                'VuStaticModelAsset',
            ].includes(assetType)) {

                fetch(`/api/get_asset_static_model_chunk_count?name=${name}`)
                    .then(res => res.json())
                    .then(count => {
                        console.log(count);

                        if(count>0){
                            const i = 0;
                            fetch(`/api/get_asset_static_model_chunk_vertex_buffer?name=${name}&chunk_index=${i}`)
                                .then(res => res.arrayBuffer())
                                .then(vertex_buffer => {
                                    console.log(vertex_buffer.byteLength);
                                    fetch(`/api/get_asset_static_model_chunk_index_buffer?name=${name}&chunk_index=${i}`)
                                        .then(res => res.arrayBuffer())
                                        .then(index_buffer => {
                                            console.log(index_buffer.byteLength);
                                        });
                                });
                        }


                        info.innerHTML = `
                            <p>Chunk Count: ${count}</p>
                        `;
                    });

            } else {
                const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                info.innerHTML = '';

                fetch(`/api/get_asset_binary?name=${name}`)
                    .then(res => res.arrayBuffer())
                    .then(data => {
                        // Convert ArrayBuffer to hex dump

                        const hexDump = get_hexdump_from_arraybuffer(data);

                        info.innerHTML = `<pre>${hexDump}</pre>`;
                    });
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
                assetsTableBody.appendChild(row);
            }
        });

}); 