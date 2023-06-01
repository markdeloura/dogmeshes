import numpy as np
import math
from scipy.spatial.transform import Rotation as R

import pyvista as pv

# your data
vertices = np.array([[-2, math.sqrt(3), 0], [0, math.sqrt(3), 0], [2, math.sqrt(3), 0], 
	[-1, 0, 0], [1, 0, 0], [0, -math.sqrt(3), 0]])
edges = np.array([[0, 1, 1, 90], [1, 2, 0, 90], [0, 3, 7, 90], [1, 3, -1, 90], [1, 4, -1, 90],
	[2, 4, 8, 90], [3, 4, -1, 90], [3, 5, 2, 90], [4, 5, 5, 90]])
triangles = np.array([[0,1,3], [1,2,4], [1,4,3], [3,4,5]])

# compute center of gravity for each triangle
centers = np.array([vertices[triangle].mean(axis=0) for triangle in triangles])

# fold each triangle along its internal edges
for edge in edges:
    if edge[2] == -1:  # internal edge
        # find the two triangles that share this edge
        t1, t2 = [i for i in range(len(triangles)) if set(edge[:2]).issubset(triangles[i])]
        
        # compute the axis of rotation (the edge)
        axis = vertices[edge[0]] - vertices[edge[1]]
        
        # compute the angle of rotation (given by the fold angle)
        angle = edge[3]
        
        # compute the rotation matrix
        rotation = R.from_rotvec(np.radians(angle) * axis / np.linalg.norm(axis))
        
        # rotate the triangles around their center of gravity
        vertices[triangles[t1]] = rotation.apply(vertices[triangles[t1]] - centers[t1]) + centers[t1]
        vertices[triangles[t2]] = rotation.apply(vertices[triangles[t2]] - centers[t2]) + centers[t2]

# align external edges
for edge in edges:
    if edge[2] != -1:  # external edge
        # find the edge to align with
        target_edge = edges[edge[2]]
        
        # compute the translation vector
        translation = vertices[target_edge[0]] - vertices[edge[0]]
        
        # translate the vertex
        vertices[edge[0]] += translation
        vertices[edge[1]] += translation

print(vertices)

# Create a new plotter
plotter = pv.Plotter()

# Create PolyData
mesh = pv.PolyData(vertices, np.hstack((np.full((len(triangles), 1), 3), triangles)))

# Add the mesh to the plotter
plotter.add_mesh(mesh, color="tan", show_edges=True)

# Show the plotter
plotter.show()
