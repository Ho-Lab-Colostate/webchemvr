/**
 * Register Aframe Component
 * Color and structure representations can be found in NGL documentation:
 * http://nglviewer.org/ngl/api/manual/usage/molecular-representations.html
 * Adapted from Kaden Strand's component:
 * https://cdn.rawgit.com/KJStrand/ngl/AFRAME-NGL/dist/Aframe_component.js
 */

AFRAME.registerComponent('ngl-mol', {
  schema: {
		src: {type: 'string', default: "rcsb://1crn"},
    interest: {type: 'string', default: ""},
    devKeyBinds: {type: 'boolean', default: false},
    interfaceAlgebra: {type: 'string', default: "none"},
    repAlgebra: {
      parse: function (raw) {
        return parseRepAlg(raw, ["protein", "cartoon", "chainname", 1]);
      },
    },
    mutationAlgebra: {
      default: "",
      parse: function (raw) {
         return raw;
      }
    },
    debug: {type: 'boolean', default: false},
	},
	  
	init: function () {
    console.log(this.data.repAlgebra);
    // Ensures that only one viewport is created
    // Necessary for ngl-dev.js compatibility
    if (!document.getElementById("viewport")) {
      var div = document.createElement("div");
      div.id = 'viewport';
      div.style.width = "0px";
      div.style.height = "0px";
      document.body.appendChild(div);
    }
    
    // Development <shift> + {number} keybinds
    // for a number of setAttribute updates
    if (this.data.devKeyBinds) {
      this.addDevKeyBinds(this); 
    }
	},

	update: function (oldData) {
    const self = this;
    var sceneEl = self.el.sceneEl;
    //console.log("called ngl-mol update");
    
    // Need to make sure <a-scene>, specifically <a-camera>,
    // has finished loading before staging NGL scene
    if (sceneEl.hasLoaded) {
      renderNglScene();
    } else {
      sceneEl.addEventListener('loaded', renderNglScene);
    }
        
    function renderNglScene() { 
      if (!self.NGLstage) {
        // Instantiate an NGL stage if it doesn't exist
        var stageObj3D = self.el.object3D; //new THREE.Object3D();
        self.NGLstage = new NGL.Stage("viewport", stageObj3D);
        //self.el.setObject3D('mesh', stageObj3D);
        if (self.data.debug) {
          console.log("Debug mode on.");
          NGL.setDebug(true);
        }
      } else if (oldData.src != self.data.src) {
        // NGL stage exists, but the PDB code changed
        // clobber the stage
        console.error("Updating PDB code is no longer supported.");
        //self.NGLstage.removeAllComponents();
        return;
      } else if (oldData.repAlgebra != self.data.repAlgebra) {
        // NGL stage exists and PDB code is same, but the representations changed
        var addReps = unparseRepAlg(self.data.repAlgebra);
        // Iterate over all current reps and remove 
        // any that are no longer in current repAlgebra
        self.NGLstage.eachRepresentation(r => {
          var rawRep = r.repAlg.join("=");
          if (addReps.indexOf(rawRep) == -1) {
            self.structComp.removeRepresentation(r);
          } else {
            addReps.splice(addReps.indexOf(rawRep), 1);
          }
        });
        // error handling
        if (!self.structComp) { console.error("this.structComp is undefined"); }
        // re-parse addReps to resemble this.data.repAlgebra
        var parsedAddReps = parseRepAlg(addReps.join("++"), 
                                        ["protein", "cartoon", "chainname"]);
        // add all the remaining representations
        self.addRepsFromRepAlg(self.structComp, parsedAddReps);
        // re-render physics body to the current repAlgebra
        // NOT YET SUPPORTED
        //self.addVoxelCollidersByRes(self.structComp, self, self.getSeleFromRepAlg());
        return;
      } else {
        // Nothing important changed.
        return;
      }
      
      // some debugging options for src
      if (self.data.src == "sphere_test") {
        var shape = new NGL.Shape( "shape" );
        shape.addSphere( [ 4, 6, 0 ], [ 100, 0, 0 ], 1 );
        var shapeComp = self.NGLstage.addComponentFromObject( shape );
        shapeComp.addRepresentation( "buffer" );
        return;
      } else if (self.data.src == "surfacebuffer_test") {
        
        // Basic mesh
        /*
        var shape = new NGL.Shape( "shape" );
        shape.addMesh(
          [ 0, 0, 0, 0, 10, 0, 0, 0, 7, 0, 1, -5, 0, 1, 0, 0, 0, 1 ],
          [ 0, 1, 0, 0, 10, 0, 20, 1, 0, 0, 15, 0, 0, -8, 0, 0, 1, 0 ],
          undefined, undefined, "My mesh"
        );
        var shapeComp = self.NGLstage.addComponentFromObject( shape );
        shapeComp.addRepresentation( "buffer" );
        */
        
        // Double-sided buffer
        /*
        var sphereGeometryBuffer = new NGL.SphereGeometryBuffer( {
            position: new Float32Array( [ 0, 0, 0 ] ),
            color: new Float32Array( [ 1, 0, 0 ] ),
            radius: new Float32Array( [ 1 ] )
        } );
        var doubleSidedBuffer = new NGL.DoubleSidedBuffer( sphereGeometryBuffer );
        */
        
        // Spheres buffer
        /*
        var shape = new NGL.Shape( "shape" );
        var sphereBuffer = new NGL.SphereBuffer( {
            position: new Float32Array( [ 0, 0, 0, 4, 0, 0 ] ),
            color: new Float32Array( [ 1, 0, 0, 1, 1, 0 ] ),
            radius: new Float32Array( [ 1, 1.2 ] )
        } );
        */
        
        var meshBuffer = new NGL.SurfaceBuffer( {
            position: new Float32Array(
                [ 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1 ]
            ),
            color: new Float32Array(
                [ 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 ]
            )
        } );
        
        // add whatever buffer to stage
        var shape = new NGL.Shape( "shape" );
        shape.addBuffer( meshBuffer );
        var shapeComp = self.NGLstage.addComponentFromObject( shape );
        shapeComp.addRepresentation( "buffer" );

        return;
      }
      
      // load src into stage, add all necessary representations, etc.
      self.NGLstage.loadFile(self.data.src).then(function (sc) {
        self.structComp = sc; 
        // store translation vector as attribute
        self.centerTransform = self.centerNglInWrapper(sc);
        self.addRepsFromRepAlg(sc, self.data.repAlgebra);
        self.addVoxelCollidersByRes(sc, self);
        //self.removeVoxelColliders(self);
        //self.addInterface(sc, self);
      });
    }
	},
  
  /**
   * Adds reprentation components to structure component `sc`
   * based on parsed representation algebra `ra`.
   */
  addRepsFromRepAlg: function (sc, ra) {
    console.log("Hello, molecule " + this.data.src + 
                " with representation " + ra.join("; "));
    // Add one RepresentationComponent to structureComponent
    // for each entry in this.data.repAlgebra
    for (var i = 0; i < ra.length; i++) {
      // Parse each representation into selection,
      // rep type, color split by =
      if (ra[i][1] == "surface") {
        var r = sc.addRepresentation("surface", {
          sele: ra[i][0],
          color: ra[i][2],
          opacity: ra[i][3],
          surfaceType: "sas",//ra[i][4],
          probeRadius: ra[i][5]
        });
        console.log(r.repr.getColorParams());
      } else if (ra[i][1] == "distance") {
        console.error("Distance rep not supported yet");
      } else {
        var r = sc.addRepresentation(ra[i][1], {
          sele: ra[i][0],
          color: ra[i][2],
          opacity: ra[i][3],
        });
        console.log(r);
      }
      r.repAlg = ra[i]
    }
    //sc.rebuildRepresentations();
  },
  
  /**
   * Centers structure component `sc` at origin of wrapper entity
   */
  centerNglInWrapper: function(sc) {    
    // Get bounding box as Box3
    var boundingBox = sc.structure.getBoundingBox();
    // Find center of box as Vector3. Same as struct.atomCenter()
    var center = boundingBox.getCenter();
    // Get inverse Vector3 for molecule translation
    var centInv = new THREE.Vector3();
    centInv.copy(center);
    centInv.multiplyScalar(-1);
    // Translate entire molecule to center of a-sphere wrapper
    sc.setPosition(centInv.toArray());
    var attrClone = new THREE.Vector3();
    attrClone.copy(centInv);
    return attrClone;
  },
  
  /**
   * Adds physics colliders for every selection in
   * NGL Selection instance `sele`
   */
  addVoxelCollidersByRes: function(sc, self, sele="*") {
    var NGLsele = new NGL.Selection(sele);
    // residue iterator
    sc.structure.eachResidue(function(res) {
      // sum atom coordinate vectors...
      var resCenter = new THREE.Vector3();
      var atomCt = 0;
      res.eachAtom(function(atom) {
        resCenter.add(atom.positionToVector3());
        atomCt += 1;
      }); //apply NGL selection on this line to weight mean to specific atoms
      // ...then divide by the atom count to get the residue center
      resCenter.divideScalar(atomCt);
      // add the transformation that was applied in this.centerNglInWrapper
      resCenter.add(self.centerTransform);
      // round coords to 2 decimals
      resCenter.multiplyScalar(100);
      resCenter.round();
      resCenter.divideScalar(100);

      // user friendly
      //console.log("Exported <a-sphere> to A-frame scene for residue " + 
      //           res.qualifiedName());
      
      // turn this sphere into part of the entity's physics body
      //console.log(resCenter.toArray().join(" "));
      self.el.setAttribute("shape__" + res.chainIndex + "_" + res.index, {
        shape: "sphere",
        radius: 2,
        offset: resCenter.toArray().join(" "),});
    }, NGLsele);
  },
  
  /**
   * Removes all components with name shape__*
   * from this.el
   */
  removeVoxelColliders: function(self) {
    // get list of all components with name shape__*
    var compsArray = Object.entries(self.el.components)
    for (var i = 0; i < compsArray.length; i++) {
      var ca = compsArray[i][0].split("__");
      if (ca[1] && ca[0] == "shape") {
        var resid = ca[1].split("_");
        if (resid[1]) {
          // remove this component
          // not supported by physics component as of 5/9/2019
          self.el.removeAttribute(compsArray[i][0]);
        }
      }
    }
  },
  
  /**
   * docs
   */
  addInterface: function(sc, self, quiet=true) {
    const ia = this.data.interfaceAlgebra;
    var NGLsele = new NGL.Selection(ia);
    
    // DEV: show interface residues as spacefill
    //this.addRepsFromRepAlg(sc, [[this.data.interfaceAlgebra, "spacefill", "element"]]);
    
    // residue iterator
    sc.structure.eachResidue(function(res) {
      // sum atom coordinate vectors...
      var resCenter = new THREE.Vector3();
      var atomCt = 0;
      res.eachAtom(function(atom) {
        resCenter.add(atom.positionToVector3());
        atomCt += 1;
      }); //apply NGL selection on this line to weight mean to specific atoms
      // ...then divide by the atom count to get the residue center
      resCenter.divideScalar(atomCt);
      // add the transformation that was applied in
      // this.centerNglInWrapper
      resCenter.add(self.centerTransform);
      // round coords to 2 decimals
      resCenter.multiplyScalar(100);
      resCenter.round();
      resCenter.divideScalar(100);
      
      // add A-frame level sphere collider as child of
      // ngl-mol entity
      var resEl = document.createElement('a-sphere');
      self.el.appendChild(resEl);
      resEl.setAttribute("color", "purple");
      resEl.setAttribute("opacity", "0.5");
      resEl.setAttribute("radius", "2");
      //resEl.setAttribute("static-body", "");
      resEl.object3D.position.copy(resCenter);
      
      // user friendly
      //console.log("Exported <a-sphere> to A-frame scene for residue " + 
      //           res.qualifiedName());
    }, NGLsele);
  },
  
  /**
   * Returns repAlg selections as an NGL selection algebra
   */
  getSeleFromRepAlg: function(ra=this.data.repAlgebra) {
    return getCol(ra,0).join(" OR ");
  },
  
  /**
   * Placeholder/development method for testing other NGL representations
   */
  addOtherReps: function(sc) {
    
    // the distance representation
    //sc.addRepresentation('distance', {atomPair: [ [ "3.CA", "14.O" ] ]});
    
    // show spheres, within 5 of Vector3 controller_pos
    /*
    var controller_pos = new THREE.Vector3(5,5,5);
    var atomSet = sc.structure.getAtomSetWithinPoint( controller_pos, 5 );
    sc.addRepresentation( "spacefill", { sele: atomSet.toSeleString() } );
    */
    
    // show sticks, byres atom 10 around 5
    var sele = new NGL.Selection("@10");
    var atomSet = sc.structure.getAtomSetWithinSelection( sele, 5 );
    var atomSet2 = sc.structure.getAtomSetWithinGroup( atomSet );
    sc.addRepresentation( "licorice", { sele: atomSet2.toSeleString() } );
    sc.addRepresentation( "cartoon" , {sele: "all"});
    sc.addRepresentation( "spacefill" , {sele: "@10"});
    
    // basic residue iterator
    /*
    sc.structure.eachResidue(function (rp) {
      //console.log(rp.index);
    }, atomSele);*/

  },
  
  /**
   * Develoment keybinds <shift> + {number} for a series
   * of different attribute chnages
   */
  addDevKeyBinds: function(self) {
    //var tarEl = this.el;
    var tarEl = self.el;
    document.addEventListener('keydown', function (evt) {
      // <shift> + * for everything.
      if (!evt.shiftKey) { return; }
      //console.log(evt.keyCode);
      switch(evt.keyCode) {
        case 48: // 0
          break;
        case 49: // 1
          tarEl.setAttribute('ngl-mol',{repAlgebra: "1-20=cartoon=chainname"});
          break;
        case 50: // 2
          tarEl.setAttribute('ngl-mol',{repAlgebra: "protein=backbone++dna=backbone=atomindex++dna=base"});
          break;
        case 51: // 3
          tarEl.setAttribute('ngl-mol',{repAlgebra: "all=cartoon=chainname++ARG=licorice=element++dna=licorice=element"});
          break;
        case 52: // 4
          tarEl.setAttribute('ngl-mol',{repAlgebra: "protein=rope=chainname++ALA=spacefill=element"});
          break;
        case 53: // 5
          tarEl.setAttribute('ngl-mol',{repAlgebra: "all=cartoon=bactor++charged=licorice=element"});
          break;
        case 54: // 6
          break;
        case 55: // 7
          break;
        case 56: // 8
          break;
        case 57: // 9
          break;
        case 189: // -
          break;
        case 187: // =
          break;
      }
    });
  },
});

/**
 * Parses str `raw` and returns as 2D array
 * First split by '++', second by '='
 * e.g. "protein=cartoon=bfactor++dna=ball+stick=atomindex"
 * becomes [["protein", "cartoon", "bfactor"],
 *          ["dna", "ball+stick", "atomindex"]]
 * Any representation entry with < 3 values is filled
 * by array `repDefault` elements
 */
function parseRepAlg(raw, repDefault) {
  var parsed = [];
  var eachRep = raw.split('++');
  for (var i = 0; i < eachRep.length; i++) {
    var eachWord = eachRep[i].split('=');
    var repLen = Math.max(repDefault.length, eachWord.length);
    for (var j = 0; j < repLen; j++) {
      if (!eachWord[j]) {
        eachWord[j] = repDefault[j];
      }
    }
    parsed.push(eachWord);
  }
  return parsed; 
}

function unparseRepAlg(a) {
  /**
   * For 2D array `a`, joins along the second
   * dimension with ,
   */
  var r = [];
  for (var i = 0; i < a.length; i++) {
     r.push(a[i].join("="));
  }
  return r;
}

// ngl-mol helper function
// Parses ngl-mol.data.mutation_algebra
function parseMutAlg(raw) {
  if (raw == "") { return raw; }
  //
}