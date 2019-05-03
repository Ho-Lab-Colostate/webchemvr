a-ngl
=================

Prototype: WebVR implementation of molecular structure viewer NGL

To do (remote dev):
-----------------
- Tie surface and distance representations into repAlg
- (maybe) Wrapper box shrinks to current reps instead of entire structure (line 245)
- Move ball in A-frame and transform its coordinates to NGL coordinate space
- Bounding sphere instead of box, with physics
- Physics component to handle harmonic oscillator calculations

To do (with headset):
-----------------
- Get GUI menu working with superhands colliders
- Print current camera/player position to console both live and in motion capture recording

Change Log
-----------------
ENH 4/7/2019
- Representation algebra changes now use NGL handlers to add and remove representations, instead of reloading the entire stage

ENH 5/2/2019
- Bounding box changed to bounding sphere. Radius set to smallest of length, width, or height of the NGL scene bounding box