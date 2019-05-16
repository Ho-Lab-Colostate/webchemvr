/**
 * A spring, connecting two bodies. Taken from cannon.js github
 *
 * @class Spring
 * @constructor
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {Object} [options]
 * @param {number} [options.restLength]   A number > 0. Default: 1
 * @param {number} [options.stiffness]    A number >= 0. Default: 100
 * @param {number} [options.damping]      A number >= 0. Default: 1
 * @param {Vec3}  [options.worldAnchorA] Where to hook the spring to body A, in world coordinates.
 * @param {Vec3}  [options.worldAnchorB]
 * @param {Vec3}  [options.localAnchorA] Where to hook the spring to body A, in local body coordinates.
 * @param {Vec3}  [options.localAnchorB]
 */
var Vec3 = CANNON.Vec3;
function Electrostatic(bodyA,bodyB,options){
  options = options || {};

  /**
   * Rest length of the spring.
   * @property restLength
   * @type {number}
   */
  this.restLength = typeof(options.restLength) === "number" ? options.restLength : 1;

  /**
   * Stiffness of the spring.
   * 
   * @property stiffness
   * @type {number}
   */
  this.stiffness = options.stiffness || 20;
  
  /**
   * Damping coefficient
   * @type {number}
   */
  this.damping = options.stiffness || 1;

  /**
   * First connected body.
   * @property bodyA
   * @type {Body}
   */
  this.bodyA = bodyA;

  /**
   * Second connected body.
   * @property bodyB
   * @type {Body}
   */
  this.bodyB = bodyB;
  
  /**
   * Charge of bodyA.
   * Pass bodies with charge attributes set
   * @property q1
   * @type {number}
   */
  this.q1 = bodyA.charge || 1;

  /**
   * Charge of bodyB.
   * Pass bodies with charge attributes set
   * @property q1
   * @type {number}
   */
  this.q2 = bodyA.charge || -1;

  /**
   * Anchor for bodyA in local bodyA coordinates.
   * @property localAnchorA
   * @type {Vec3}
   */
  this.localAnchorA = new Vec3();

  /**
   * Anchor for bodyB in local bodyB coordinates.
   * @property localAnchorB
   * @type {Vec3}
   */
  this.localAnchorB = new Vec3();

  if(options.localAnchorA){
      this.localAnchorA.copy(options.localAnchorA);
  }
  if(options.localAnchorB){
      this.localAnchorB.copy(options.localAnchorB);
  }
  if(options.worldAnchorA){
      this.setWorldAnchorA(options.worldAnchorA);
  }
  if(options.worldAnchorB){
      this.setWorldAnchorB(options.worldAnchorB);
  }
}

/**
 * Set the anchor point on body A, using world coordinates.
 * @method setWorldAnchorA
 * @param {Vec3} worldAnchorA
 */
Electrostatic.prototype.setWorldAnchorA = function(worldAnchorA){
    this.bodyA.pointToLocalFrame(worldAnchorA,this.localAnchorA);
};

/**
 * Set the anchor point on body B, using world coordinates.
 * @method setWorldAnchorB
 * @param {Vec3} worldAnchorB
 */
Electrostatic.prototype.setWorldAnchorB = function(worldAnchorB){
    this.bodyB.pointToLocalFrame(worldAnchorB,this.localAnchorB);
};

/**
 * Get the anchor point on body A, in world coordinates.
 * @method getWorldAnchorA
 * @param {Vec3} result The vector to store the result in.
 */
Electrostatic.prototype.getWorldAnchorA = function(result){
    this.bodyA.pointToWorldFrame(this.localAnchorA,result);
};

/**
 * Get the anchor point on body B, in world coordinates.
 * @method getWorldAnchorB
 * @param {Vec3} result The vector to store the result in.
 */
Electrostatic.prototype.getWorldAnchorB = function(result){
    this.bodyB.pointToWorldFrame(this.localAnchorB,result);
};

var applyForce_r =              new Vec3(),
    applyForce_r_unit =         new Vec3(),
    applyForce_u =              new Vec3(),
    applyForce_f =              new Vec3(),
    applyForce_worldAnchorA =   new Vec3(),
    applyForce_worldAnchorB =   new Vec3(),
    applyForce_ri =             new Vec3(),
    applyForce_rj =             new Vec3(),
    applyForce_ri_x_f =         new Vec3(),
    applyForce_rj_x_f =         new Vec3(),
    applyForce_tmp =            new Vec3();

/**
 * Apply the spring force to the connected bodies.
 * @method applyForce
 */
Electrostatic.prototype.applyForce = function(){
  var k = this.stiffness,
      l = this.restLength,
      d = this.damping,
      q1 = this.q1,
      q2 = this.q2,
      bodyA = this.bodyA,
      bodyB = this.bodyB,
      r = applyForce_r,
      r_unit = applyForce_r_unit,
      u = applyForce_u,
      f = applyForce_f,
      tmp = applyForce_tmp;
  var worldAnchorA = applyForce_worldAnchorA,
      worldAnchorB = applyForce_worldAnchorB,
      ri = applyForce_ri,
      rj = applyForce_rj,
      ri_x_f = applyForce_ri_x_f,
      rj_x_f = applyForce_rj_x_f;

  // Get world anchors
  this.getWorldAnchorA(worldAnchorA);
  this.getWorldAnchorB(worldAnchorB);

  // Get offset points
  worldAnchorA.vsub(bodyA.position,ri);
  worldAnchorB.vsub(bodyB.position,rj);

  // Compute distance vector between world anchor points
  worldAnchorB.vsub(worldAnchorA,r);
  var rlen = r.norm();
  r_unit.copy(r);
  r_unit.normalize();
  
  // Compute relative velocity of the anchor points, u
  bodyB.velocity.vsub(bodyA.velocity,u);
  
  // Add rotational velocity
  bodyB.angularVelocity.cross(rj,tmp);
  u.vadd(tmp,u);
  bodyA.angularVelocity.cross(ri,tmp);
  u.vsub(tmp,u);
  
  // Harmonic oscillator with damping
  // F = - k * ( x - L ) - D * ( u )
  //var scalar = -k*(rlen-l) - d*u.dot(r_unit);
  
  // Electrostatic force test
  // Power by 2*displacement to keep force from exploding
  // Also damping parameter scales power
  var disp = rlen - l;
  if (disp < 0) { disp = 0; } //always negative power
  var scalar = k*q1*q2/(Math.pow(disp, 2*disp/d));
  
  // catches NaN errors
  if (!scalar) {
    var scalar = 1;
  }
  
  // Multiply scalar force by difference vector
  r_unit.mult(scalar, f);

  // Add forces to bodies
  bodyA.force.vsub(f,bodyA.force);
  bodyB.force.vadd(f,bodyB.force);

  // Angular force
  ri.cross(f,ri_x_f);
  rj.cross(f,rj_x_f);
  bodyA.torque.vsub(ri_x_f,bodyA.torque);
  bodyB.torque.vadd(rj_x_f,bodyB.torque);
};

/**
 * Applies an intermolecular force (e.g. hydrophobic
 * interaction, electrostatic force, etc) between
 * the entity and the `target` entity.
 * Adapted from the spring component of the A-frame
 * physics Github.
 */
AFRAME.registerComponent('intermol', {
  multiple: true,
  schema: {
    // Interaction type, either "hydrophobic" or "electrostatic"
    interType: {type: 'string', default: 'electrostatic'},
    
    // Target (other) body for the constraint.
    target: {type: 'selector'},

    // Length of the spring, when no force acts upon it.
    restLength: {default: 1, min: 0},

    // How much will the spring suppress the force.
    stiffness: {default: 20, min: 0},

    // Stretch factor of the spring.
    damping: {default: 100, min: 0},

    // Offsets.
    localAnchorA: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    localAnchorB: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
  },

  init: function() {
    this.system = this.el.sceneEl.systems.physics;
    this.system.addComponent(this);
    this.isActive = true;
    this.spring = /* {CANNON.Spring} */ null;
  },

  update: function(oldData) {
    var el = this.el;
    var data = this.data;

    if (!data.target) {
      console.warn('Spring: invalid target specified.');
      return; 
    }
    
    // wait until the CANNON bodies is created and attached
    if (!el.body || !data.target.body) {
      (el.body ? data.target : el).addEventListener('body-loaded', this.update.bind(this, {}));
      return;
    }

    // create the spring if necessary
    this.createSpring();
    // apply new data to the spring
    this.updateSpring(oldData);
  },

  updateSpring: function(oldData) {
    if (!this.spring) {
      console.warn('Spring: Component attempted to change spring before its created. No changes made.');
      return;
    } 
    var data = this.data;
    var spring = this.spring;

    // Cycle through the schema and check if an attribute has changed.
    // if so, apply it to the spring
    Object.keys(data).forEach(function(attr) {
      if (data[attr] !== oldData[attr]) {
        if (attr === 'target') {
          // special case for the target selector
          spring.bodyB = data.target.body;
          return;
        }
        spring[attr] = data[attr];
      }
    })
  },

  createSpring: function() {
    if (this.spring) return; // no need to create a new spring
    // Instantiate new CANNON.js body depending on interType
    if (this.data.interType == "electrostatic") {
      this.spring = new Electrostatic(this.el.body);
    } else if (this.data.interType == "hydrophobic") {
      console.error("Hydrophobic interaction not yet supported.");
    } else {
      console.error("Invalid interType '" +
                    this.data.interType + "' for intermol component.");
    }
  },

  // If the spring is valid, update the force each tick the physics are calculated
  step: function(t, dt) {
    return this.spring && this.isActive ? this.spring.applyForce() : void 0;
  },

  // resume updating the force when component upon calling play()
  play: function() {
    this.isActive = true;
  },

  // stop updating the force when component upon calling stop()
  pause: function() {
    this.isActive = false;
  },

  //remove the event listener + delete the spring
  remove: function() {
    if (this.spring)
      delete this.spring;
      this.spring = null;
  }
});