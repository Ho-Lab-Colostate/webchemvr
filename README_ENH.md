a-ngl
=================

Prototype: WebVR implementation of molecular structure viewer NGL. Ethan's README section.

To do (remote dev):
-----------------
- Get surface representation working
  - For some reason, throwing an error in the async gets surfaces to work, but removing errors causes surface not to render
- Check if another component on molecule entity (new mol-physics component) can access shape_* component coordinates and radius
- intermol A-frame component
  - Electrostatic/hydrophobic in schema
  - Long term goal: remove physics entities and build CANNON.js direclty into ngl-mol component
- Electrostatic interaction (CANNON.js level)
  - Done for now. Works pretty well with stiffness=20, damping=100
- Finish updating a-ngl.js for "wrapper-less" physics body
  - Have addVoxelColliders store voxel radius and coords for addInterface
- More detailed/accurate sphere voxels
  - Voxel centers only at relevant/sidechain atoms
  - Variable radius
  - Cylinders/multi-sphere for long residues like ARG

To do (with headset):
-----------------


Change Log
-----------------
ENH 4/7/2019
- Representation algebra changes now use NGL handlers to add and remove representations, instead of reloading the entire stage

ENH 5/2/2019
- Bounding box changed to bounding sphere. Radius set to smallest of length, width, or height of the NGL scene bounding box

ENH 5/3/2019
- Bounding sphere shrinks to current representations instead of the entire structure.

ENH 5/6/2019
- Started working on putting in residue interfaces. My game plan is to have NGL find residue centers and radii, then transform those 
representative spheres into the A-frame scene as a-spheres
- Then add A-frame level CANNON.js interactions on spheres as separate component.
- Working on building the basic framework today. Residues selected as interface residues are indicated in the ngl-mol schema as 
interfaceAlgebra parameter. Getting the tranformation from
NGL to A-frame coordinate space figured out as well.

ENH 5/8/2019
- Removed wrapper entity entirely. The physics body that represents the structure is now defined using a compound body composed of many 
sphere__* components. Tested compatibility with superhands with multiple molecules. I was able to very intuitively grab two molecules, 
throw/bounce them (as before), and actually "dock" the proteins (sterics only, of course). I will now start to work on getting the a-ngl 
component cleaned up to correctly handle attribute changes. For instance, changing molecules does not yet work. I will consider removing 
the change PDB code altogether, since it might not be that relevant (user would probably just want to delete a molecule entity then add a 
new one).

ENH 5/10/2019
- Started working on electrostatic interactions in A-frame. Forked the spring interaction from A-frame physics, which is basically an 
abstraction of CANNON.Spring. So I also forked CANNON.Spring and changed the applied force from a harmonic oscillator to an electrostatic 
interaction (force goes by -k/r^2). Works pretty well, but I still need to remove all the attributes in CANNON and A-frame that are not 
necessary for an Electrostatic interaction, such as damping. I will also probably want to add multiple targets to the Electrostatic component, 
which I might rename Molecular so that I could include electrostatic/hydrophobic/VDW interactions as a schema parameter. First things first, I 
want to get CANNON.Electro working well:
  - Electro is not "on" until bodies are close enough
  - Electro is ignored at restLength
  - Coulomb's constant is replaced with the schema parameter for spring stiffness, k, at least for debugging purposes. k=-20 works pretty well 
  for dynamic body of mass 1 (kg?)

ENH 5/15/2019
- Electrostatic (or pseudo-electrostatic) CANNON.js physics work pretty well, and are currently tied to scene via intermol A-frame component
placed on a single entity. I will next re-write the intermol component to handle multiple CANNON.js interactions so that it can handle all the
intermolecular (electrostatic & hydrophobic) forces on the molecule entity.
- ngl-mol will detect when separate molecules collide. Then, ngl-mol emits addElectroBody events to mol-physics. 
- I could also move ngl-mol.addVoxelCollidersByRes to the new mol-physics component, so that all physics are handled separate from
ngl-mol. Still debating whether I should do this or keep it in the ngl-mol component.
  - Or, sequester physics bodies into a separate child or parent entity. This would allow for removal of shape_* components via removal of the
  entire entity.
- The mol-physics component outline:
  - schema
  - init
    - Add event listeners for addElectroBody and removeElectroBody

ENH 5/16/2019
- Got surface representations working. Need to set the representation component as an attribute of component instead of temp variable "r"

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

ENH 5/8/2019

- Physics components do not have update methods (or at least ones that work correctly). el.setAttribute cannot alter, but will correctly add, physics components.
In other words, do not define physics components in HTML inline, but rather through the ngl-mol component. Alternatively, use el.removeAttribute to completely remove
the component before re-adding it.

ENH 5/9/2019

- Physics shape components apparently cannot be removed currently (per console error from shape component). I'll have to find another way to
update/remove shape components

Meeting Notes:
-----------------

