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
camera.position.z = 5;
scene.add(camera);

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Renderer
const renderer = new THREE.WebGLRenderer({
	canvas:canvas
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001);

const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const dlHelper = new THREE.DirectionalLightHelper(directionalLight, 0.1);
scene.add(dlHelper);

// Materials

// Create a new material
const cubeMaterial = new THREE.MeshStandardMaterial();
cubeMaterial.roughness = 0.4;
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

// Object geometry
const geometry = new THREE.BoxGeometry();
const cube = new THREE.Mesh(geometry, cubeMaterial);
scene.add(cube);

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
        // For each object in the data, make a new one in the global ObjectList
        data.objects.forEach((object:any) => {
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
                    vertIndex: [triangle[0], triangle[1], triangle[2]]
                    });
            });

            console.log(triangles.length);

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
                verticesArray.push(vertex.x, vertex.y, 0);
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
        mesh.position.set(((objNum % 8)-3) * 2*params.scale, (Math.floor(objNum / 8)-3) * 2*params.scale, 0);
        mesh.scale.set(params.scale, params.scale, params.scale);
        objNum++;
    });
    objNum = 0;
    lines.forEach((line:THREE.LineSegments) => {
        line.position.set(((objNum % 8)-3) * 2*params.scale, (Math.floor(objNum / 8)-3) * 2*params.scale, 0);
        line.scale.set(params.scale, params.scale, params.scale);
        objNum++;
    });


}
	
animate();
