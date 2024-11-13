
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');

    function show_asset_static_model_chunk(vertex_buffer: ArrayBuffer, index_buffer: ArrayBuffer){

    // Set up Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth - 50, window.innerHeight - 100);
    document.getElementById('content')?.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create geometry from buffers
    const geometry = new THREE.BufferGeometry();
    
    console.log(vertex_buffer.byteLength);
    // Assume vertex buffer contains float32 xyz positions
    const vertexData = new Float32Array(vertex_buffer);
    const numVertices = vertexData.length / 7;
    const positions = new Float32Array(numVertices * 3);
    for (let i = 0; i < numVertices; i++) {
        positions[i * 3] = vertexData[i * 7];     // x
        positions[i * 3 + 1] = vertexData[i * 7 + 1]; // y 
        positions[i * 3 + 2] = vertexData[i * 7 + 2]; // z
    }
    console.log(`positions: ${positions}`);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    console.log(index_buffer.byteLength);
    console.log(`index_buffer: ${index_buffer}`);
    // Set up indices
    const index_buffer_size = index_buffer.byteLength;
    const indices = new Uint16Array(
        (index_buffer_size%2==0)?
            index_buffer:
            index_buffer.slice(0, index_buffer_size-1)
    );
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    // Calculate normals
    geometry.computeVertexNormals();

    // Create mesh
    //const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const material = new THREE.MeshBasicMaterial({ color: 0x808080 , wireframe: true});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Position camera
    camera.position.z = 500;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth - 50, window.innerHeight - 100);
    });

    }


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

                                show_asset_static_model_chunk(vertex_buffer, index_buffer);

                            });
                    });
            }
        });


});