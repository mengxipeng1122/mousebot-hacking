

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');

    function draw_texture_in_canvas(canvas: HTMLCanvasElement, texture: any) {
        const width = texture.width;
        const height = texture.height;
        const level = texture.level;
        const gl_format = texture.gl_format;

        fetch(`/api/asset_texture_binary?assetType=${assetType}&assetName=${assetName}&assetLang=${assetLang}&level=${level}`)
            .then(response => response.arrayBuffer())
            .then(data => {
                const texture = new Uint8Array(data);
                console.log(texture);
                {
                const gl = canvas.getContext('webgl');
                if (!gl) {
                    console.error('Unable to initialize WebGL. Your browser may not support it.');
                    return;
                }

                // Create a texture
                const webglTexture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, webglTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                // Check for support of S3TC DXT5 compressed textures
                const ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
                if (!ext) {
                    console.error('S3TC DXT5 compression is not supported by your browser.');
                    return;
                }
                
                console.log(gl_format, ext.COMPRESSED_RGBA_S3TC_DXT5_EXT);

                // Load the texture data
                if ([
                    ext.COMPRESSED_RGBA_S3TC_DXT5_EXT
                ].includes(gl_format)) {
                    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, gl_format, width, height, 0, texture);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, texture);
                }

                // Set up vertex data (two triangles)
                // each vertex has 2D position and 2D uv
                // uv is in the range of [0, 1]
                const vertexData = new Float32Array([
                    -1.0, -1.0, 0.0, 0.0,
                    1.0, -1.0, 1.0, 0.0,
                    -1.0, 1.0, 0.0, 1.0,

                    -1.0, 1.0, 0.0, 1.0,
                    1.0, -1.0, 1.0, 0.0,
                    1.0, 1.0, 1.0, 1.0
                ]);
                const vertexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

                // Create vertex shader
                const vertexShader = gl.createShader(gl.VERTEX_SHADER);
                const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                if(!vertexShader || !fragmentShader) {
                    console.error('Failed to create shader');
                    return;
                }
                gl.shaderSource(vertexShader, `
                    attribute vec2 position;
                    attribute vec2 uv;
                    varying vec2 v_uv;
                    void main() {
                        v_uv = uv;
                        gl_Position = vec4(position, 0.0, 1.0);
                    }
                `);
                gl.compileShader(vertexShader);

                // Create fragment shader
                gl.shaderSource(fragmentShader, `
                    precision mediump float;
                    uniform sampler2D texture;
                    varying vec2 v_uv;
                    void main() {
                        gl_FragColor = texture2D(texture, v_uv);
                    }
                `);
                gl.compileShader(fragmentShader);

                // Create shader program
                const program = gl.createProgram();
                if(!program) {
                    console.error('Failed to create program');
                    return;
                }
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);
                console.log(gl.getProgramInfoLog(program));
                gl.useProgram(program);

                // Bind vertex buffer to attribute
                const positionLocation = gl.getAttribLocation(program, 'position');
                if(positionLocation === -1) {
                    console.error('Failed to get position location');
                    return;
                }

                const uvLocation = gl.getAttribLocation(program, 'uv');
                if(uvLocation === -1) {
                    console.error('Failed to get uv location');
                    return;
                }

                const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
                gl.enableVertexAttribArray(positionLocation);
                gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
                gl.enableVertexAttribArray(uvLocation);
                gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

                // Set the texture uniform
                const textureLocation = gl.getUniformLocation(program, 'texture');
                if(textureLocation === -1) {
                    console.error('Failed to get texture location');
                    return;
                }
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, webglTexture);
                gl.uniform1i(textureLocation, 0);

                // Draw the triangles
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                }
            });
    }

    // read query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const assetType = urlParams.get('assetType');
    const assetName = urlParams.get('assetName');
    const assetLang = urlParams.get('assetLang');


    fetch(`/api/asset_texture_info?assetType=${assetType}&assetName=${assetName}&assetLang=${assetLang}`)
        .then(response => response.json())
        .then(textures => {
            for (const texture of textures) {
                console.log(texture, JSON.stringify(texture));
                const width = texture.width;
                const height = texture.height;
                const level = texture.level;
                const gl_format = texture.gl_format;

                const info = `width: ${width}, height: ${height}, level: ${level}, gl_format: ${gl_format}`;
                const div = document.createElement('div');
                div.textContent = info;
                document.body.appendChild(div);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                draw_texture_in_canvas(canvas, texture);
                document.body.appendChild(canvas);
            }
        });


});
