/**
 * Returns 1D array of a column (index `col`)
 * from `matrix`. Adapted from StackOverflow post
 * https://stackoverflow.com/questions/7848004/get-column-from-a-two-dimensional-array
 */
function getCol(matrix, col) {
   var column = [];
   for(var i=0; i<matrix.length; i++){
      column.push(matrix[i][col]);
   }
   return column;
}

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

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

/**
 * Shows download link for JSON data in localStorage or
 * this.el.systems.recordingdb
 */
AFRAME.registerComponent('avatar-downloader', {
  init: function() {
    document.addEventListener('keydown', evt => this.checkDB(evt));
  },

  checkDB: function (evt) {
    if (evt.shiftKey) { // <shift>
      // Get recording DB, should be IndexedDB
      // Then get the recording array promise object
      var recordingdb = this.el.systems.recordingdb;
      if (!recordingdb) { return; }
      var recPromise = recordingdb.getRecording('default');
      var linkEl = document.getElementById("dlJSON");

      // Get promise value `res`
      recPromise.then((res) => {
        if (typeof res !== 'undefined') {
          //console.log('not empty');
          linkEl.style.visibility = "visible";
          var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res));
          linkEl.setAttribute("href", dataStr);
          //linkEl.setAttribute("download", "scene.json");
        } else {
          //console.log('is empty'); 
        }
      });
    }
  }
});

AFRAME.registerComponent('teleporter', {
  init: function() {
    document.addEventListener('keydown', evt => this.teleport(evt));
  },
  
  teleport: function() {
    console.log('tele');
  }
  
});

// turn controller's physics presence on only while button held down
AFRAME.registerComponent('phase-shift', {
  init: function () {
    var el = this.el
    el.addEventListener('gripdown', function () {
      el.setAttribute('collision-filter', {collisionForces: true})
    })
    el.addEventListener('gripup', function () {
      el.setAttribute('collision-filter', {collisionForces: false})
    })
  }
});