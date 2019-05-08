a-ngl
=================

Prototype: WebVR implementation of molecular structure viewer NGL

To do (remote dev):
-----------------
- Physics component (custom CANNON.js interaction) to handle electrostatic interactions
- Physics representation of molecule as one sphere per residue, rather than a single bounding sphere
  - Wrapper sphere could interact with superhands, but physics will apply only to residue voxels
  - Find out how to make a physics body within the wrapper sphere composed of many spheres
    - Physics shape component
- More detailed/accurate sphere voxels
  - Voxel centers only at relevant/sidechain atoms
  - Variable radius

To do (with headset):
-----------------
- Try using superhands with residue voxel version

Change Log
-----------------
ENH 4/7/2019
- Representation algebra changes now use NGL handlers to add and remove representations, instead of reloading the entire stage

ENH 5/2/2019
- Bounding box changed to bounding sphere. Radius set to smallest of length, width, or height of the NGL scene bounding box

ENH 5/3/2019
- Bounding sphere shrinks to current representations instead of the entire structure.

ENH 5/6/2019
- Started working on putting in residue interfaces. My game plan is to have NGL find residue centers and radii, then transform those representative spheres into the A-frame scene as a-spheres
- Then add A-frame level CANNON.js interactions on spheres as separate component.
- Working on building the basic framework today. Residues selected as interface residues are indicated in the ngl-mol schema as interfaceAlgebra parameter. Getting the tranformation from
NGL to A-frame coordinate space figured out as well.

Known Issues
-----------------

ENH 5/3/2019
- When page loads, white cube appears and portions of the protein do not render correctly. When using dev keybinds, proteins usually load correctly, but sometimes these weird white
cubes appear and often protein does not appear
  - Likely crosstalk between NGL and A-frame is occurring before the other is ready
  - Is scene loaded yet? What about the NGL stage?
- Also, shrinkWrapper does not seem to set Object3D correctly on first load
  - Specifically an issue with making a new THREE.SphereBufferGeometry with Microsoft Edge only, not Chrome
  - As of 5/6, wrapper does render properly on Chrome

ENH 5/6/2019

- The wrapper entity physics body is defined by the HTML inline geometry, not by the wrapper geometry defined in ngl-mol component

ENH5/8/2019

- Physics components do not have update methods (or at least ones that work correctly). el.setAttribute cannot alter, but will correctly add, physics components.
In other words, do not define physics components in HTML inline, but rather through the ngl-mol component. Alternatively, use el.removeAttribute to completely remove
the component before re-adding it.