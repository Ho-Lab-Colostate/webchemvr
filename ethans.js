window.playDemoRecording = function (spectate) {
  let l = document.querySelector('a-link, a-entity[link]');
  let s = document.querySelector('a-scene');
  let b = document.getElementById('replayer-button');
  b && b.setAttribute('visible', 'false');
  l && l.setAttribute('visible', 'false');
  s.addEventListener('replayingstopped', e => {
    let c = document.querySelector('[camera]');
    window.setTimeout(function () {
      c.setAttribute('position', '0 1.6 2');
      c.setAttribute('rotation', '0 0 0');
    });
  });
  s.setAttribute('avatar-replayer', {
    src: './demo-recording.json',
    spectatorMode: spectate === undefined ? true : spectate,
    spectatorPosition: { x: 0, y: 1.6, z: 2 }
  });
};

// keybinds for emitting common controller events
AFRAME.registerComponent('key-emit', {
  schema: {
    
  },
  
  init: function() {
    var self = this;
    document.addEventListener('keydown', function (evt) {
      //console.log(evt.keyCode);
      // <shift> + * for everything.
      if (!evt.shiftKey) { return; }
      //console.log(evt.keyCode);
      switch(evt.keyCode) {
        case 48: // 0
          //
          break;
        case 49: // 1
          //
          break;
        case 50: // 2
          // code block
          break;
        case 51: // 3
          // code block
          break;
        case 52: // 4
          // code block
          break;
        case 53: // 5
          // code block
          break;
        case 54: // 6
          // code block
          break;
        case 55: // 7
          // code block
          break;
        case 56: // 8
          // code block
          break;
        case 57: // 9
          // code block
          break;
        case 189: // -
          // code block
          break;
        case 187: // =
          // code block
          break;
      }
    });
  },

});

// Motion capture patch
AFRAME.registerComponent('mc-patch', {
    /*
    Hack for depricated motion controls component.
    Works with A-frame 0.8.2. Use avatar-recorder component
    as usual to record to IndexedDB, then press <shift> + \
    to download recording as JSON. Requires <a-scene mc-patch>
    */
    
    init: function () {
      // Get recording DB, should be IndexedDB
      // Then get the recording array promise object
      var recordingdb = this.el.systems.recordingdb;
      var recPromise = recordingdb.getRecording('default');
      
      // Get promise value `res`
      recPromise.then((res) => {
        if (typeof res !== 'undefined') {
          document.addEventListener('keydown', evt => {
            
            // <shift> + * for everything.
            if (!evt.shiftKey) { return; }

            // `\` for download to JSON
            if (evt.keyCode === 220) {
              console.log('Downloading JSON...');
              var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res));
              var dlAnchorElem = document.getElementById('downloadAnchorElem');
              dlAnchorElem.setAttribute("href", dataStr);
              dlAnchorElem.setAttribute("download", "scene.json");
              dlAnchorElem.click();
            }
          });
        } else {
          //console.log('isempty'); 
        }
      });   
    },
});

// Simple box component
AFRAME.registerComponent('box', {
  schema: {
    width: {type: 'number', default: 1},
    height: {type: 'number', default: 1},
    depth: {type: 'number', default: 1},
    color: {type: 'string', default: '#AAA'},
    visible: {type: 'boolean', default: true}
  },

  init: function() {
    var data = this.data;
    var el = this.el;
    
    //Create geometry
    this.geometry = new THREE.BoxBufferGeometry(data.width, data.height, data.depth); 

    this.material = new THREE.MeshStandardMaterial({color: data.color});
    
    //Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    //Tie mesh to entity
    el.setObject3D("mesh", this.mesh);
    /*
    if (data.visible) {
      el.getObject3D('mesh').material.transparent = false;
    } else {
      el.getObject3D('mesh').material.transparent = true;
    }*/
    
  },

  update: function(oldData) {
    var data = this.data;
    var el = this.el;

    // In initialization process. No need to update.
    if (Object.keys(oldData).length === 0) { return; }

    // Handle geometry changes
    if (data.width !== oldData.width ||
        data.height !== oldData.height ||
        data.depth !== oldData.depth) {
      el.getObject3D('mesh').geometry = new THREE.BoxBufferGeometry(data.width, data.height, data.depth); 
    }

    // Handle material changes
    if (data.color !== oldData.color) {
      el.getObject3D('mesh').material.color = new THREE.Color(data.color);  
    }

  },

  remove: function() {
    var el = this.el;
    el.removeObject3D('mesh');
  }

});