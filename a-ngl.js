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

/**
 * annotation
 */
AFRAME.registerComponent('ngl-mol', {
  schema: {
		src: {type: 'string', default: "rcsb://1crn"},
    interest: {type: 'string', default: ""},
    wrapperOpacity: {type: 'float', default: 0.0},
    repAlgebra: {
      default: "all",
      parse: function (raw) {
        // The default value for each representation
        var repDefault = ["all", "cartoon", "chainname"]
        return parseRepAlg(raw, repDefault);
      },
    },
    mutation_algebra: {
      default: "",
      parse: function (raw) {
         return parseMutAlg(raw);
      }
    },
	},
	  
	init: function () {
    //console.log('called ngl-mol init');
    // Ensures that only one viewport is created
    // Necessary for ngl-dev.js compatibility
    if (!document.getElementById("viewport")) {
      var div = document.createElement("div");
      div.id = 'viewport';
      div.style.width = "0px";
      div.style.height = "0px";
      document.body.appendChild(div);
    }
	},

	update: function (oldData) {
    const self = this;
    var sceneEl = self.el.sceneEl;
    //console.log("called ngl-mol update");
    
    // Need to make sure <a-scene>, specifically <a-camera>,
    // has finished loading before staging NGL scene
    if (sceneEl.hasLoaded) {
      //console.log('scene is already loaded');
      renderNglScene();
    } else {
      //console.log('scene has not finished loading yet');
      sceneEl.addEventListener('loaded', renderNglScene);
    }
        
    function renderNglScene() {
      //console.log('called ngl-mol renderNglScene');
      //console.log(sceneEl.hasLoaded);
      
      if (!self.NGLstage) {
        // Instantiate an NGL stage if it doesn't exist
        var stageObj3D = new THREE.Object3D()
        self.NGLstage = new NGL.Stage("viewport", stageObj3D);//self.el.object3D);
        self.el.setObject3D('mesh', stageObj3D);
      } else if (oldData.src != self.data.src || 
                 oldData.repAlgebra != self.data.repAlgebra) {
        // NGL stage exists, but the PDB code or representations changed
        // Clear the stage
        console.log("Hello, new molecule " + self.data.src + 
                   " with representation " + self.data.repAlgebra);
        self.NGLstage.removeAllComponents();
      } else {
        // Nothing important changed.
        return;
      }
      
      // sphere buffer instead of molecule if src is correct
      if (self.data.src == "sphere_test") {
        var shape = new NGL.Shape( "shape" );
        shape.addSphere( [ 0, 0, 0 ], [ 0, 0, 0 ], 5 );
        /*
        shape.addMesh(
            [ 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1 ],
            [ 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 ],
            undefined, undefined, "My mesh"
        );
        shape.addSphere( [ 12, 5, 15 ], [ 1, 0.5, 0 ], 1 );
        shape.addEllipsoid( [ 6, 0, 0 ], [ 1, 0, 0 ], 1.5, [ 3, 0, 0 ], [ 0, 2, 0 ] );
        shape.addCylinder( [ 0, 2, 7 ], [ 0, 0, 9 ], [ 1, 1, 0 ], 0.5 );
        shape.addCone( [ 0, 2, 7 ], [ 0, 3, 3 ], [ 1, 1, 0 ], 1.5 );
        shape.addArrow( [ 1, 2, 7 ], [ 30, 3, 3 ], [ 1, 0, 1 ], 1.0 );
        shape.addArrow( [ 2, 2, 7 ], [ 30, -3, -3 ], [ 1, 0.5, 1 ], 1.0 );
        shape.addLabel( [ 15, -4, 4 ], [ 0.2, 0.5, 0.8 ], 2.5, "Hello" );*/
        var shapeComp = self.NGLstage.addComponentFromObject( shape );
        shapeComp.addRepresentation( "buffer" );
        return;
      }
      
      // load src into stage, add all necessary representations, etc.
      self.NGLstage.loadFile(self.data.src).then(function(sc) {
        self.structComp = sc;
        self.addRepsFromRepAlg(sc);
        self.centerNglInWrapper(sc);
      });
    }
    
	},
  
  /**
   * Adds reprentation components to structure component sc
   * based on parsed this.data.repAlgebra.
   */
  addRepsFromRepAlg: function (sc) {
    var ra = this.data.repAlgebra;
    // Add one RepresentationComponent to structureComponent
    // for each entry in this.data.repAlgebra
    for (var i = 0; i < ra.length; i++) {
      //console.log(ra[i][0]);
      sc.addRepresentation(ra[i][1], {
        sele: ra[i][0],
        color: ra[i][2]
      })
    }
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
      color: boxEl.getAttribute('color'),
      transparent: true,
      opacity: this.data.wrapperOpacity
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
  
});

/**
 * Scene level handler
 */
AFRAME.registerComponent('ngl-handler', {
	schema: {},
  
  init: function () {
    var self = this;
    var sceneEl = this.el;
    
    // add event listeners for 
    // add molecule
    // delete molecule
    // change representations
    // arrange molecules in a logical layout
    
    // Add keybind listeners for dev
    this.addDevListener();
    
    // Change representation listener
    //this.el.addEventListener('changerep', evt => this.emitChangeRep(evt, self));
    //console.log(document.querySelector('a-camera').hasLoaded);
  },
  
  /*
  emitChangeRep: function(evt, self) {
    var d = evt.detail;
    var tarEl = self.queryNglMol(d.src);
    tarEl.setAttribute('ngl-mol', {repAlgebra: "repAlgebra: protein=backbone++dna=backbone=atomindex++dna=base"});
  },
  */
  
  addDevListener: function() {
    var self = this;
    var tarEl = queryNglMol("rcsb://1crn");
    document.addEventListener('keydown', function (evt) {
      // <shift> + * for everything.
      if (!evt.shiftKey) { return; }
      console.log(evt.keyCode);
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
          break;
        case 189: // -
          tarEl.setAttribute(
            'ngl-mol',{
              repAlgebra: "rotein=backbone++dna=backbone=atomindex++dna=base"
          });
          break;
        case 187: // =
          tarEl.setAttribute(
            'ngl-mol',{
              repAlgebra: "protein=cartoon=bfactor++ARG=licorice=element++dna=licorice=element"
          });
          break;
      }
    });
  },
});