import './style.css';
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Types
interface Vertex {
    x: number;
    y: number;
};
interface Line {
    vertIndex: number[];
    connectorValue: number;
    direction: boolean;
};
interface Triangle {
    vertIndex:number[];
    lineIndex:number[];
    connectIndex:number[];
};
interface FoldyObject {
    vertices: Vertex[];
    lines: Line[];
    triangles: Triangle[];
};
const ObjectList: FoldyObject[] = [];

// GUI
const gui = new GUI();

// Canvas
const canvas:HTMLCanvasElement = <HTMLCanvasElement>document.querySelector('canvas.webgl');
canvas.style.zIndex = "-1";

// Scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0.5,7.2,9.1);
scene.add(camera);

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Renderer
const renderer = new THREE.WebGLRenderer({
	canvas:canvas,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Resize
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
});

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI/2;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);
gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001);

//const dlHelper = new THREE.DirectionalLightHelper(directionalLight, 0.1);
//scene.add(dlHelper);

//const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
//scene.add(shadowCameraHelper);

// Materials

// Create a new material
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
cubeMaterial.roughness = 0.4;
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

// Object geometry
const geometry = new THREE.BoxGeometry(1,1,1);
const cube = new THREE.Mesh(geometry, cubeMaterial);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

// Create a checkerboard texture with a specified size and color
function createCheckerboardTexture(size:number, color1:number, color2:number):THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Could not create 2D context for canvas');
    }
    context.fillStyle = `rgb(${color1}, ${color1}, 0)`;
    context.fillRect(0, 0, size, size);
    context.fillStyle = `rgb(${color2}, 0, ${color2})`;
    for (let y = 0; y < size; y += 16) {
        for (let x = 0; x < size; x += 16) {
            context.fillRect(x, y, 15, 15);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

// Create a tiled ground plane with a checkerboard on it and add it to the scene
const groundPlaneGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);
const groundPlaneMaterial = new THREE.MeshStandardMaterial({
    map: createCheckerboardTexture(256, 255, 127),
    side: THREE.DoubleSide,
    flatShading: false 
});
const groundPlane = new THREE.Mesh(groundPlaneGeometry, groundPlaneMaterial);
groundPlane.rotation.x = Math.PI / 2;
groundPlane.receiveShadow = true;
scene.add(groundPlane);

const clock = new THREE.Clock();

const meshes:THREE.Mesh[] = [];
const lines:THREE.LineSegments[] = [];

// Set up GUI parameters
const params = {
    scale: 1
};
gui.add(params, 'scale').min(0).max(10).step(0.01);

// Fetch the JSON file and parse the objects
fetch("combined_objects.json")
    .then((response) => response.json())
    .then((data) => {
        const numObjects = data.objects.length;
        console.log(`Found ${numObjects} objects`);

        // For each object in the data, make a new one in the global ObjectList
        data.objects.forEach((object:any, objIndex:number) => {
            // Get the vertices
            const vertices:Vertex[] = [];
            object.vertices.forEach((vertex:any) => {
                vertices.push({
                    x: vertex.x,
                    y: vertex.y
                });
            });
            // Get the lines
            const lines:Line[] = [];
            object.lines.forEach((line:any) => {
                lines.push({
                    vertIndex: [line[0], line[1]],
                    connectorValue: Math.abs(line[2]),
                    direction: (line[2] > 0)? true : false
                });
            });

            // Traverse object and find the triangles using the vertex connectivity
            const triangles:Triangle[] = [];
            object.triangles.forEach((triangle:any) => {
                triangles.push({
                    vertIndex: [triangle[0], triangle[1], triangle[2]],
                    lineIndex: [],
                    connectIndex: []
                    });
            });

            // Using the triangles vertIndex vertices, find the lines that make up the triangle
            //   and save them as a lineIndex array using lines indices
            triangles.forEach((triangle:Triangle) => {
                triangle.lineIndex = [];
                triangle.vertIndex.forEach((vertIndex:number, index:number) => {
                    let nextIndex = (index + 1) % 3;
                    let lineIndex = 0;
                    lines.forEach((line:Line, index:number) => {
                        if (line.vertIndex.includes(vertIndex) && line.vertIndex.includes(triangle.vertIndex[nextIndex])) {
                            lineIndex = index;
                        }
                    });
                    triangle.lineIndex.push(lineIndex);
                });
            });

            // Using the trilines array, find the triangle connectivity and save it as a connectIndex array.
            //   The connectIndex array is the index of the triangle that shares the line.
            //   If there is no other triangle that shares the line, the connectIndex is -1.
            triangles.forEach((triangle:Triangle) => {
                triangle.connectIndex = [];
                triangle.lineIndex.forEach((lineIndex:number, index:number) => {
                    let nextIndex = (index + 1) % 3;
                    let connectIndex = -1;
                    triangles.forEach((tri:Triangle, index:number) => {
                        if (tri == triangle) {
                            return;
                        }
                        if (tri.lineIndex.includes(lineIndex)) {
                            connectIndex = index;
                        }
                    });
                    triangle.connectIndex.push(connectIndex);
                });
            });

            // Log the vertices, lines, and triangles of the last object
            if (objIndex == numObjects - 1) {
                console.log(vertices);
                console.log(lines);
                console.log(triangles);
            }

            // Add the object to the global ObjectList
            ObjectList.push({
                vertices: vertices,
                lines: lines,
                triangles: triangles
            });
        });

        let objNum = 0;

        // Turn ObjectList objects into individual meshes
        ObjectList.forEach((object: FoldyObject) => {
            // Create an array to store the vertices
            let verticesArray:number[] = [];

            // Find the centerpoint of the object
            let centerPoint:Vertex = {x:0, y:0};
            object.vertices.forEach((vertex: Vertex) => {
                centerPoint.x += vertex.x;
                centerPoint.y += vertex.y;
            });
            centerPoint.x /= object.vertices.length;
            centerPoint.y /= object.vertices.length;
            
            // Find the vertex at maximum distance from the centerpoint
            let maxDistance = 0;
            let maxDistanceVertex:Vertex = {x:0, y:0};
            object.vertices.forEach((vertex: Vertex) => {
                const distance = Math.sqrt(Math.pow(vertex.x - centerPoint.x, 2) + Math.pow(vertex.y - centerPoint.y, 2));
                if (distance > maxDistance) {
                    maxDistance = distance;
                    maxDistanceVertex = vertex;
                }
            });

            // Add the vertices to the array, but translate them so that centerPoint is at the origin, and scale them so maxDistanceVertex is 1 unit away from the origin
            object.vertices.forEach((vertex: Vertex) => {
                vertex.x -= centerPoint.x;
                vertex.y -= centerPoint.y;
                vertex.x /= maxDistance;
                vertex.y /= maxDistance;
                verticesArray.push(vertex.x, 0, vertex.y);
            });

            // Create an array to store the faces (indices)
            let indicesArray:number[] = [];
            object.triangles.forEach((triangle: Triangle) => {
                indicesArray.push(triangle.vertIndex[0], triangle.vertIndex[1], triangle.vertIndex[2]);
            });

            // Create the BufferGeometry
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array(verticesArray);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

            const indices = new Uint32Array(indicesArray);
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            
            // Create the mesh
            const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });  // Adjust material as needed
            const mesh = new THREE.Mesh(geometry, faceMaterial);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            meshes.push(mesh);
            scene.add(mesh);

            // Create edges for the mesh
            const edges = new THREE.WireframeGeometry(geometry);
            const line = new THREE.LineSegments(edges, lineMaterial);
            lines.push(line);
            scene.add(line);

            // Increment the object number
            objNum++;
        });

    })
	.catch((error) => {
		console.error(error)
	});


// Animation loop
function animate() {
	const elapsedTime = clock.getElapsedTime();

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call animate again on the next frame
	window.requestAnimationFrame(animate);

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

    // Adjust positions of all meshes
    let objNum = 0;
    meshes.forEach((mesh:THREE.Mesh) => {
        mesh.position.set(((objNum % 8)-3) * 2*params.scale, 0.25, (Math.floor(objNum / 8)-3) * 2*params.scale);
        mesh.scale.set(params.scale, params.scale, params.scale);
        objNum++;
    });
    objNum = 0;
    lines.forEach((line:THREE.LineSegments) => {
        line.position.set(((objNum % 8)-3) * 2*params.scale, 0.25, (Math.floor(objNum / 8)-3) * 2*params.scale);
        line.scale.set(params.scale, params.scale, params.scale);
        objNum++;
    });

    //shadowCameraHelper.update();
}
	
animate();
