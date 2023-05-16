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
            lines.forEach((line:Line) => {
                // Find all other lines that include vertIndex[0],
                // Then find all other lines that include vertIndex[1],
                const vert0Lines:Line[] = [];
                const vert1Lines:Line[] = [];
                lines.forEach((line2:Line) => {
                    if (line2.vertIndex.includes(line.vertIndex[0])) {
                        vert0Lines.push(line2);
                    }
                    if (line2.vertIndex.includes(line.vertIndex[1])) {
                        vert1Lines.push(line2);
                    }
                });
                // Now find the triangles by iterating through the vert0Lines.
                //   We'll add the verts of line and of vert0Lines to a Set and then for each vert1Line,
                //   we'll make a new set and add those vert1Line verts to it. Then we'll check if the
                //   number of verts in the set is 3. If so, it's a triangle and we'll push it to the triangles array.
                vert0Lines.forEach((line0:Line) => {
                    vert1Lines.forEach((line1:Line) => {
                        const triangleVerts:Set<number> = new Set();
                        triangleVerts.add(line.vertIndex[0]);
                        triangleVerts.add(line.vertIndex[1]);
                        triangleVerts.add(line0.vertIndex[0]);
                        triangleVerts.add(line0.vertIndex[1]);
                        triangleVerts.add(line1.vertIndex[0]);
                        triangleVerts.add(line1.vertIndex[1]);
                        if (triangleVerts.size == 3) {
                            const triangleVertsArray = Array.from(triangleVerts);
                            triangles.push({
                                vertIndex: [triangleVertsArray[0], triangleVertsArray[1], triangleVertsArray[2]]
                            });
                        }
                    });
                });
            });
            
            // Add the object to the global ObjectList
            ObjectList.push({
                vertices: vertices,
                lines: lines,
                triangles: triangles
            });
        });

        let objDepth = 0;

        // Turn ObjectList objects into individual meshes
        const meshes:THREE.Mesh[] = [];
        ObjectList.forEach((object: FoldyObject) => {
            // Create an array to store the vertices
            let verticesArray:number[] = [];
            object.vertices.forEach((vertex: Vertex) => {
                verticesArray.push(vertex.x, vertex.y, objDepth);
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
            console.log(vertices);

            const indices = new Uint32Array(indicesArray);
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            console.log(indices);
            
            // Create the mesh
            const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });  // Adjust material as needed
            const mesh = new THREE.Mesh(geometry, faceMaterial);
            meshes.push(mesh);
            scene.add(mesh);

            // Increment the depth
            objDepth += 20;

        });

    })
	.catch((error) => {
		console.error(error)
	});
    console.log(ObjectList);


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

}
	
animate();
