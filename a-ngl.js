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
    interfaceAlgebra: {type: 'string', default: "none"},
    repAlgebra: {
      parse: function (raw) {
        return parseRepAlg(raw, {
          sele: "*",
          rep: "cartoon",
          color: "chainname",
          opacity: "1"
        });
      },
    },
    mutationAlgebra: {
      default: "",
      parse: function (raw) {
         return raw;
      }
    },
    debug: {type: 'boolean', default: false},
    reloadOnClick: {type: 'boolean', default: false},
	},
	  
	init: function () {
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
    if (this.data.debug) {
      this.clog("Adding development keybinds (<shift> + <number>)");
      this.addDevKeyBinds();
    }
    
    // Clicking on screen reloads all current
    // representations for mobile browsers
    if (this.el.sceneEl.isMobile || this.data.reloadOnClick) {
      this.clog("Representations will reload on click");
      this.addRebuildListener();
    }
	},

	update: function (oldData) {
    const self = this;
    //console.log("called ngl-mol update");
    
    // Need to make sure <a-scene>, specifically <a-camera>,
    // has finished loading before staging NGL scene
    if (self.el.sceneEl.hasLoaded) {
      renderNglScene();
    } else {
      self.el.sceneEl.addEventListener('loaded', renderNglScene);
    }
        
    function renderNglScene() { 
      if (!self.NGLstage) {
        // Instantiate an NGL stage if it doesn't exist
        var stageObj3D = self.el.object3D; //new THREE.Object3D();
        self.NGLstage = new NGL.Stage("viewport", stageObj3D);
        if (self.data.debug) {
          console.log("Debug mode on.");
          NGL.setDebug(true);
        }
      } else if (oldData.src != self.data.src) {
        console.error("Updating PDB code is no longer supported.");
        return;
      } else if (oldData.repAlgebra != self.data.repAlgebra) {
        // Representation algebra changed
        // Append new/repAlgebra representations to addReps
        var addReps = [];
        for (var key in self.data.repAlgebra) {
          addReps.push(self.data.repAlgebra[key].rawRA);
        }
        // Iterate over old/existing representations,
        // removing reps that are not in addReps from the stage
        // and splicing out unchanged reps from addReps
        self.NGLstage.eachRepresentation(r => {
          var oldidx = addReps.indexOf(r.repAlg.rawRA);
          if (oldidx == -1) {
            self.structComp.removeRepresentation(r);
            self.clog('Removing rep ' + r.repAlg.rawRA);
          } else {
            addReps.splice(oldidx, 1);
            self.clog('Keeping rep ' + r.repAlg.rawRA);
          }
        });
        // Add all remaining reps in addReps
        self.addRepsFromRepAlg(parseRepAlg(addReps.join("++")));
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
        var meshBuffer = new NGL.SurfaceBuffer( {
            position: new Float32Array([ 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1 ]),
            color: new Float32Array([ 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 ])
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
        self.centerNglInWrapper();
        self.addVoxelCollidersByRes();
        self.addRepsFromRepAlg();
        //self.removeVoxelColliders();
        //self.addInterface(sc, self);
      });
    }
	},
  
  /*
   * Calls console.log(msg) only if this.data.debug == true
   * Will also warn or throw error based on `type`
   */
  clog: function (msg, type="log") {
    if (this.data.debug) {
      switch(type) {
        case "log":
          console.log(msg);
          break;
        case "warn":
          console.warn(msg);
          break;
        case "error":
          console.error(msg);
          break;
      }
    }
  },
  
  /**
   * Adds reprentation components to structure component `sc`
   * based on parsed representation algebra `ra`.
   */
  addRepsFromRepAlg: function (ra=this.data.repAlgebra) {
    this.clog("Hello, molecule " + this.data.src + " with repAlgebra");
    this.clog(ra);
    // Add one RepresentationComponent to structureComponent
    // for each entry in ra
    for (var key in ra) {
      if (!ra[key].rawRA) {
        continue; // null entry
      }
      if (ra[key]["rep"] == "distance") {
        // transform atom1 and atom2 attributes into
        // NGL-type atomPair list
        ra[key].atomPair = [[ra[key].atom1, ra[key].atom2]];
      }
      // need a shallow copy of ra[key]
      var r = this.structComp.addRepresentation(ra[key]["rep"], Object.assign({}, ra[key]));
      r.repAlg = ra[key];
      this.clog("Adding rep " + ra[key].rawRA);
      this.clog(r);
    }
    //this.structComp.rebuildRepresentations();
  },
  
  /**
   * Centers structure component `sc` at origin of wrapper entity
   */
  centerNglInWrapper: function() { 
    // Get bounding box as Box3
    var boundingBox = this.structComp.structure.getBoundingBox();
    // Find center of box as Vector3. Same as struct.atomCenter()
    var center = boundingBox.getCenter();
    // Get inverse Vector3 for molecule translation
    var centInv = new THREE.Vector3();
    centInv.copy(center);
    centInv.multiplyScalar(-1);
    // Translate entire molecule to center of a-sphere wrapper
    this.structComp.setPosition(centInv.toArray());
    var attrClone = new THREE.Vector3();
    attrClone.copy(centInv);
    this.centerTransform = attrClone;
    return attrClone;
  },
  
  /**
   * Adds physics colliders for every selection in
   * str `sele`
   */
  addVoxelCollidersByRes: function(sele="*") {
    // In case this.centerNglInWrapper has not been called yet
    if (!this.centerTransform) {
      console.error("this.centerTransform is undefined. Please " + 
                    "call this.centerNglInWrapper first.")
      return;
    }
    var NGLsele = new NGL.Selection(sele);
    var self = this;
    // residue iterator
    this.structComp.structure.eachResidue(function(res) {
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
      // turn this sphere into part of the entity's physics body
      self.el.setAttribute("shape__" + res.chainIndex + "_" + res.index, {
        shape: "sphere",
        radius: 2,
        offset: resCenter.toArray().join(" ")
      });
    }, NGLsele);
  },
  
  /**
   * Removes all components with name shape__*
   * from this.el. Not currently supported by
   * A-frame physics component
   */
  removeVoxelColliders: function() {
    // get list of all components with name shape__*
    var compsArray = Object.entries(this.el.components);
    for (var i = 0; i < compsArray.length; i++) {
      var ca = compsArray[i][0].split("__");
      if (ca[1] && ca[0] == "shape") {
        var resid = ca[1].split("_");
        if (resid[1]) {
          // remove this component
          // not supported by physics component as of 5/9/2019
          this.el.removeAttribute(compsArray[i][0]);
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
  addDevKeyBinds: function() {
    var self = this;
    var tarEl = this.el;
    document.addEventListener('keydown', function (evt) {
      // <shift> + * for everything.
      if (!evt.shiftKey) { return; }
      //console.log(evt.keyCode);
      switch(evt.keyCode) {
        case 48: // 0
          break;
        case 49: // 1
          tarEl.setAttribute('ngl-mol',{repAlgebra: "sele=1-20,rep=cartoon,color=chainname"});
          break;
        case 50: // 2
          tarEl.setAttribute('ngl-mol',{repAlgebra: "sele=protein,rep=backbone++sele=dna,rep=backbone,color=atomindex++sele=dna,rep=base"});
          break;
        case 51: // 3
          tarEl.setAttribute('ngl-mol',{repAlgebra: "++sele=1-30,rep=surface,color=electrostatic++sele=dna,rep=licorice,color=element"});
          break;
        case 52: // 4
          tarEl.setAttribute('ngl-mol',{repAlgebra: "sele=protein,rep=rope,color=chainname++sele=ALA,rep=spacefill,color=element"});
          break;
        case 53: // 5
          tarEl.setAttribute('ngl-mol',{repAlgebra: "color=bactor++sele=charged,rep=licorice,color=element"});
          break;
        case 54: // 6
          tarEl.setAttribute('ngl-mol',{repAlgebra: ""});
          break;
        case 55: // 7
          break;
        case 56: // 8
          break;
        case 57: // 9
          self.structComp.rebuildRepresentations();
          break;
        case 189: // -
          break;
        case 187: // =
          break;
      }
    });
  },
  
  /*
   * Listen for rebuildNglRepsEvt event
   * and call this.structComp.rebuildRepresentations()
   */
  addRebuildListener: function() {
    var self = this;
    document.addEventListener('rebuildNglRepsEvt', function (evt) {
      self.clog("Rebuilding all NGL representations...");
      self.structComp.rebuildRepresentations();
    });
  }
  
});

/**
 * Determines whether `obj` is a non-array object
 */
function isObjNotArray(obj) {
  return obj && (typeof obj === "object") && !(obj instanceof Array);
}

/**
 * Parses str `raw` and returns as dictionary
 * First split by '++', second by '='
 * e.g. "sele=protein,rep=cartoon,color=bfactor
 * ++sele=dna,rep=ball+stick,color=atomindex"
 * returns {0: {sele: "protein", rep: "cartoon", color: "bfactor"},
 *          1: {sele: "dna", rep: "ball+stick", color: "atomindex"}}
 */
function parseRepAlg(raw, repDefault) {
  var parsed = {};
  var def = {};
  if (isObjNotArray(repDefault)) {
    Object.assign(def, repDefault);
  }
  var eachRep = raw.split('++');
  for (var i = 0; i < eachRep.length; i++) {
    var eachPair = eachRep[i].trim().split(',');
    parsed[i] = {};
    Object.assign(parsed[i], def);
    for (var j = 0; j < eachPair.length; j++) {
      var eachWord = eachPair[j].trim().split('=');
      if (eachWord[0]) {
        parsed[i][eachWord[0]] = eachWord[1].trim();
      }
    }
    parsed[i]["rawRA"] = unparseRepAlg(parsed[i]);
  }
  return parsed; 
}

/*
 * Represents a repAlgebra type object `obj` in string format,
 * as if it were defined in HTML inline. Sorts keys before
 * stringifying.
 */
function unparseRepAlg(obj) {
  var str  = "";
  Object.keys(obj).sort().forEach(function(key) {
    if (str) { str += ","; }
    str += key + "=" + obj[key];
  });
  return str;
}