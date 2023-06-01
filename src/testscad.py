from solid import scad_render_to_file, cylinder, cube, translate, rotate, union, difference, intersection
from solid.utils import *
import math
import subprocess

center_width = 2.0
wall_thickness = 1.0
tab_length = 5.0
tab_gap = 2.0

shell_thickness = 0.2
tab_thickness = 1

centerline = cube([center_width, tab_length*5+(tab_length-1)*tab_gap, shell_thickness])

# Make tab
tab1 = cube([tab_length + wall_thickness, tab_length, tab_thickness])
#tab2 = cube([2*tab_length + 2*wall_thickness + center_width, tab_length, tab_thickness])
#tab3 = cube([2*tab_length + 2*wall_thickness + center_width, tab_length, tab_thickness])
#tab4 = cube([2*tab_length + 2*wall_thickness + center_width, tab_length, tab_thickness])
#tab5 = cube([2*tab_length + 2*wall_thickness + center_width, tab_length, tab_thickness])

# Translate flat tabs
ttab1 = translate([-1*(tab_length+wall_thickness), 0, 0])(tab1)
ttab2 = translate([-1*(tab_length+wall_thickness), tab_length+tab_gap, 0])(tab1)
ttab3 = translate([-1*(tab_length+wall_thickness), 2*(tab_length+tab_gap), 0])(tab1)
ttab4 = translate([-1*(tab_length+wall_thickness), 3*(tab_length+tab_gap), 0])(tab1)
ttab5 = translate([-1*(tab_length+wall_thickness), 4*(tab_length+tab_gap), 0])(tab1)
ttab6 = translate([center_width, 0, 0])(tab1)
ttab7 = translate([center_width, tab_length+tab_gap, 0])(tab1)
ttab8 = translate([center_width, 2*(tab_length+tab_gap), 0])(tab1)
ttab9 = translate([center_width, 3*(tab_length+tab_gap), 0])(tab1)
ttab10= translate([center_width, 4*(tab_length+tab_gap), 0])(tab1)

# Rotate tabs
rtab1 = translate([0,0,tab_thickness])(
    rotate(-90,[0,1,0])(
        translate([-(tab_length + wall_thickness),0,-tab_thickness])(tab1)))
rtab2 = translate([0,tab_length+tab_gap,0])(
    rotate(-105,[0,1,0])(
        translate([-(tab_length + wall_thickness),0,-tab_thickness])(tab1)))
rtab3 = translate([0,2*(tab_length+tab_gap),0])(
    rotate(-120,[0,1,0])(
        translate([-(tab_length + wall_thickness),0,-tab_thickness])(tab1)))
rtab4 = translate([0,3*(tab_length+tab_gap),0])(
    rotate(-135,[0,1,0])(
        translate([-(tab_length + wall_thickness),0,-tab_thickness])(tab1)))
rtab5 = translate([0,4*(tab_length+tab_gap),0])(
    rotate(-150,[0,1,0])(
        translate([-(tab_length + wall_thickness),0,-tab_thickness])(tab1)))

rtab6 = translate([center_width,0,0])(
    rotate(-15,[0,1,0])(
        translate([0,0,-tab_thickness])(tab1)))
rtab7 = translate([center_width,tab_length+tab_gap,0])(
    rotate(-30,[0,1,0])(
        translate([0,0,-tab_thickness])(tab1)))
rtab8 = translate([center_width,2*(tab_length+tab_gap),0])(
    rotate(-45,[0,1,0])(
        translate([0,0,-tab_thickness])(tab1)))
rtab9 = translate([center_width,3*(tab_length+tab_gap),0])(
    rotate(-60,[0,1,0])(
        translate([0,0,-tab_thickness])(tab1)))
rtab10= translate([center_width,4*(tab_length+tab_gap),0])(
    rotate(-75,[0,1,0])(
        translate([0,0,-tab_thickness])(tab1)))

# Final Geometry Union
final_geometry = union()(
    centerline,
    ttab1, rtab1,
    ttab2, rtab2,
    ttab3, rtab3,
    ttab4, rtab4,
    ttab5, rtab5,
    ttab6, #rtab6,
    ttab7, #rtab7,
    ttab8, #rtab8,
    ttab9, #rtab9,
    ttab10, #rtab10,
)

# Generate OpenSCAD script and save it to a file
scad_render_to_file(final_geometry, 'output.scad')

# Execute OpenSCAD CLI to generate STL file
openscad_command = ['openscad', '-o', 'output.stl', 'output.scad']
subprocess.run(openscad_command, check=True)
