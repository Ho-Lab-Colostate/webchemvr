/**
 * Register Aframe Component
 * Color and structure representations can be found in NGL documentation:
 * http://nglviewer.org/ngl/api/manual/usage/molecular-representations.html
 * Adapted from Kaden Strand's component:
 * https://cdn.rawgit.com/KJStrand/ngl/AFRAME-NGL/dist/Aframe_component.js
 */

// ngl-mol helper function
// Parses ngl-mol.data.repAlgebra
function parseRepAlg(raw, repDefault) {
  /* Parses str `raw` and returns as 2D array
   * First split by '++', second by '='
   * e.g. "protein=cartoon=bfactor++dna=ball+stick=atomindex"
   * becomes [["protein", "cartoon", "bfactor"],
   *          ["dna", "ball+stick", "atomindex"]]
   * Any representation entry with < 3 values is filled
   * by array `repDefault` elements
   */
  
  var parsed = [];
  var eachRep = raw.split('++');
  for (var i = 0; i < eachRep.length; i++) {
    var eachWord = eachRep[i].split('=');
    for (var j = 0; j < repDefault.length; j++) {
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

/**
 * Returns A-frame element that satisfies [ngl-mol]
 * where ngl-mol.data.src = `src'
 */
function queryNglMol(src) {
  var sceneEl = document.querySelector("a-scene");
  var els = sceneEl.querySelectorAll("[ngl-mol]");
  for (var i = 0; i < els.length; i++) {
    if (els[i].getAttribute('ngl-mol').src == src) {
      return els[i];
    }
  }
}

AFRAME.registerComponent('ngl-mol', {
  schema: {
		src: {type: 'string', default: "rcsb://1crn"},
    interest: {type: 'string', default: ""},
    showWrapper: {type: 'boolean', default: false},
    devKeyBinds: {type: 'boolean', default: false},
    repAlgebra: {
      default: "all",
      parse: function (raw) {
        // The default value for each representation
        var repDefault = ["protein", "cartoon", "chainname"];
        return parseRepAlg(raw, repDefault);
      },
    },
    mutation_algebra: {
      default: "",
      parse: function (raw) {
         return raw;
      }
    },
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
    if (this.data.devKeyBinds) {
      this.addDevKeyBinds(); 
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
      } else if (oldData.src != self.data.src) {
        // NGL stage exists, but the PDB code changed
        // clobber the stage
        self.NGLstage.removeAllComponents();
      } else if (oldData.repAlgebra != self.data.repAlgebra) {
        // NGL stage exists and PDB code is same,
        // but the representations changed
        var addReps = unparseRepAlg(self.data.repAlgebra);
        // Iterate over all current reps
        // and remove any that are no longer in current repAlgebra
        self.NGLstage.eachRepresentation(r => {
          var rawRep = r.repAlg.join("=");
          if (addReps.indexOf(rawRep) == -1) {
            // this representation was removed
            //console.log('remove rep');
            self.structComp.removeRepresentation(r);
          } else {
            // this representation is already loaded in the stage
            //console.log('keep in stage');
            // remove from the addReps so that we know which
            // representations to add
            addReps.splice(addReps.indexOf(rawRep), 1);
          }
          //console.log(rawRep);
        });
        
        // error handling
        if (!self.structComp) { console.error("this.structComp is undefined"); }
        // re-parse addReps to resemble this.data.repAlgebra
        var parsedAddReps = parseRepAlg(addReps.join("++"), ["protein", "cartoon", "chainname"]);
        // add all the remaining representations
        //console.log("add reps");
        //console.log(parsedAddReps);
        self.addRepsFromRepAlg(self.structComp, parsedAddReps);
        return;
      } else {
        // Nothing important changed.
        return;
      }
      
      // sphere buffer instead of molecule if src is correct
      if (self.data.src == "sphere_test") {
        var shape = new NGL.Shape( "shape" );
        shape.addSphere( [ 0, 0, 0 ], [ 0, 0, 0 ], 5 );
        var shapeComp = self.NGLstage.addComponentFromObject( shape );
        shapeComp.addRepresentation( "buffer" );
        return;
      } else if (self.data.src == "surfacebuffer_test") {
        var shape = new NGL.Shape( "shape" );
        //shape.addSphere( [ 0, 0, 0 ], [ 0, 0, 0 ], 5 );
        var sphereBuffer = new NGL.SphereBuffer( {
            position: new Float32Array( [ 0, 0, 0, 4, 0, 0 ] ),
            color: new Float32Array( [ 1, 0, 0, 1, 1, 0 ] ),
            radius: new Float32Array( [ 1, 1.2 ] )
        });
        shape.addBuffer( sphereBuffer );
        var shapeComp = self.NGLstage.addComponentFromObject( shape );
        shapeComp.addRepresentation( "buffer" );
        return;
      }
      
      // load src into stage, add all necessary representations, etc.
      self.NGLstage.loadFile(self.data.src).then(sc => {
        self.structComp = sc;
        self.addRepsFromRepAlg(sc, self.data.repAlgebra);
        self.centerNglInWrapper(sc);
      });
    }
	},
  
  /**
   * Adds reprentation components to structure component `sc`
   * based on parsed representation algebra `ra`.
   */
  addRepsFromRepAlg: function (sc, ra) {
    //var ra = this.data.repAlgebra;
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
          //color: ra[i][2],
          surfaceType: "sas",
          smooth: false,
          //probeRadius: 1,
        });
        console.log(r.repr.getSurfaceParams());
        
      } else if (ra[i][1] == "distance") {
        console.error("Distance rep not supported yet");
      } else {
        var r = sc.addRepresentation(ra[i][1], {
          sele: ra[i][0],
          color: ra[i][2]
        });
      }
      r.repAlg = ra[i]
    }
    //sc.rebuildRepresentations();
  },
  
  /**
   * Centers structure component `sc` at origin of wrapper box
   * Also shrinks box wrapper dimensions to enclose structure.
   */
  centerNglInWrapper: function(sc) {
    
    // ********* center sc in wrapper ************
    
    // Get wrapped structure instance
    var struct = sc.structure;

    // Get bounding box as Box3
    var boundingBox = struct.getBoundingBox('all');

    // Find center of box as Vector3. Same as struct.atomCenter()
    var center = boundingBox.getCenter();

    // Get height, width, depth of box.
    var bbdims = boundingBox.getSize();

    // Scale the bbdims vectors to A-frame space
    var factor = this.el.getAttribute('scale')
    bbdims.multiply(factor);

    // Get inverse Vector3 for molecule translation
    var centInv = new THREE.Vector3();
    centInv.copy(center);
    centInv.multiplyScalar(-1);

    // Translate entire molecule to center of a-box wrapper
    sc.setPosition(centInv.toArray());
    
    // ********* shrink box wrapper ************

    // Shrink parent box wrapper to dims of bounding box
    var boxEl = this.el.parentEl;
    boxEl.setAttribute('width', bbdims.x);
    boxEl.setAttribute('height', bbdims.y);
    boxEl.setAttribute('depth', bbdims.z);

    // Generate wrapper box's mesh and set on its object3D
    boxEl.geometry = new THREE.BoxBufferGeometry(bbdims.x, bbdims.y, bbdims.z);
    boxEl.material = new THREE.MeshStandardMaterial({
      color: 'blue',//boxEl.getAttribute('color'),
      wireframe: true,
      visible: this.data.showWrapper,
    });
    boxEl.mesh = new THREE.Mesh(boxEl.geometry, boxEl.material);
    boxEl.setObject3D('mesh', boxEl.mesh);
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
    //var tarEl = this.el;
    var tarEl = document.querySelector("#mol1");
    document.addEventListener('keydown', function (evt) {
      // <shift> + * for everything.
      if (!evt.shiftKey) { return; }
      //console.log(evt.keyCode);
      switch(evt.keyCode) {
        case 48: // 0
          break;
        case 49: // 1
          tarEl.setAttribute('ngl-mol',{src: "rcsb://5GKP.mmtf",}, true);
          break;
        case 50: // 2
          tarEl.setAttribute('ngl-mol',{src: "rcsb://1crn",}, true);
          break;
        case 51: // 3
          tarEl.setAttribute('ngl-mol',{src: "rcsb://1Igt",}, true);
          break;
        case 52: // 4
          tarEl.setAttribute('ngl-mol',{src: "rcsb://1RUZ",}, true);
          break;
        case 53: // 5
          tarEl.setAttribute('ngl-mol',{src: "rcsb://4gnk",}, true);
          break;
        case 54: // 6
          tarEl.setAttribute('ngl-mol',{src: "rcsb://5gsk",}, true);
          break;
          break;
        case 55: // 7
          break;
        case 56: // 8
          break;
        case 57: // 9
          tarEl.setAttribute('ngl-mol',{repAlgebra: "protein=cartoon=chainname"});
          break;
        case 189: // -
          tarEl.setAttribute('ngl-mol',{repAlgebra: "protein=backbone++dna=backbone=atomindex++dna=base"});
          break;
        case 187: // =
          tarEl.setAttribute('ngl-mol',{repAlgebra: "all=cartoon=chainname++ARG=licorice=element++dna=licorice=element"});
          break;
      }
    });
  },
});