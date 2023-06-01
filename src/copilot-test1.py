import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import math

matplotlib.use('TkAgg')

# vertices is a list of vertex coordinates
# edges is a list of all mesh edges denoted as two indices into the vertices array and, if it's an external edge, a value that indicates which other edge the edge should match up with. If it's an internal edge the value will be -1.
# triangles is a list of all mesh triangles denoted as lists of indices into the vertices array
vertices = np.array([[-2, math.sqrt(3), 0], [0, math.sqrt(3), 0], [2, math.sqrt(3), 0], 
    [-1, 0, 0], [1, 0, 0], [0, -math.sqrt(3), 0]])
edges = np.array([[0, 1, 1], [1, 2, 0], [0, 3, 7], [1, 3, -1], [1, 4, -1],
    [2, 4, 8], [3, 4, -1], [3, 5, 2], [4, 5, 5]])
triangles = np.array([[0,1,3], [1,2,4], [1,4,3], [3,4,5]])

# compute the folding angles for each internal edge
folding_angles = np.zeros(len(edges))
for i in range(len(edges)):
    if edges[i, 2] == -1:
        folding_angles[i] = 0.0
    else:
        j = edges[i, 2]
        if j < i:
            folding_angles[i] = folding_angles[j]
        else:
            folding_angles[i] = np.random.uniform(0.0, np.pi)

# compute the folding angles for the external edges
for i in range(len(edges)):
    if edges[i, 2] != -1:
        continue
    for j in range(len(edges)):
        if i == j or edges[j, 2] == -1:
            continue
        if edges[i, 0] == edges[j, 0] or edges[i, 0] == edges[j, 1]:
            k = edges[i, 1] if edges[i, 0] == edges[j, 0] else edges[i, 0]
            l = edges[j, 1] if edges[j, 0] == edges[i, 0] else edges[j, 0]
            indices = np.where((edges[:, 0] == i) & (edges[:, 1] == j))[0]
            if indices.size > 0 and edges[indices[0], 2] != -1:
                folding_angles[i] = folding_angles[j] + np.pi - np.arccos(np.dot(vertices[k] - vertices[edges[i, 0]], vertices[l] - vertices[edges[j, 0]]) / (np.linalg.norm(vertices[k] - vertices[edges[i, 0]]) * np.linalg.norm(vertices[l] - vertices[edges[j, 0]])))
            break

# compute the new positions of the vertices
num_vertices = len(vertices)
new_vertices = np.zeros((num_vertices, 3))
for i in range(num_vertices):
    # compute the new position of the vertex
    new_pos = vertices[i]
    for j in range(num_vertices):
        if i == j:
            continue
        # compute the distance between the two vertices
        dist = np.linalg.norm(vertices[i] - vertices[j])
        # compute the folding angle for the edge
        if edges[np.where((edges[:, 0] == i) & (edges[:, 1] == j))[0], 2] != -1:
            angle = folding_angles[np.where((edges[:, 0] == i) & (edges[:, 1] == j))[0][0]]
        else:
            angle = 0.0
        # compute the new position of the vertex
        new_pos += (vertices[j] - vertices[i]) * (dist * np.tan(angle) / np.linalg.norm(vertices[j] - vertices[i]))
    new_vertices[i] = new_pos

# compute the angles between adjacent triangles
angles = np.zeros(len(triangles))
for i in range(len(triangles)):
    a = vertices[triangles[i, 1]] - vertices[triangles[i, 0]]
    b = vertices[triangles[i, 2]] - vertices[triangles[i, 0]]
    angles[i] = np.arccos(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# output the new vertex positions and the angles between adjacent triangles
print(new_vertices)
print(angles)

# create a new figure
fig, ax = plt.subplots()

# plot the edges
for i in range(len(edges)):
    if edges[i, 2] != -1:
        continue
    if edges[i, 0] >= len(vertices) or edges[i, 1] >= len(vertices):
        continue
    x = [vertices[edges[i, 0], 0], vertices[edges[i, 1], 0]]
    y = [vertices[edges[i, 0], 1], vertices[edges[i, 1], 1]]
    ax.plot(x, y, 'k-')
    
# plot the vertices
ax.plot(vertices[:, 0], vertices[:, 1], 'ro')

# plot the new vertices
ax.plot(new_vertices[:, 0], new_vertices[:, 1], 'bo')

# set the axis limits
ax.set_xlim([-2, 8])
ax.set_ylim([-4, 10])

# show the plot
plt.show()