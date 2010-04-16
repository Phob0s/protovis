/** @class Abstract layout for networks. */
pv.Layout.Network = function() {
  pv.Layout.call(this);
  var that = this;

  /**
   * The node prototype. This prototype is intended to be used with a Dot mark
   * in conjunction with the link prototype.
   *
   * @type pv.Mark
   * @name pv.Layout.Network.prototype.node
   */
  (this.node = new pv.Mark()
      .data(function() { return that.nodes(); })
      .strokeStyle("#1f77b4")
      .fillStyle("#fff")
      .left(function(n) { return n.x; })
      .top(function(n) { return n.y; })).parent = this;

  /**
   * The link prototype, which renders edges between source nodes and target
   * nodes. This prototype is intended to be used with a Line mark in
   * conjunction with the node prototype.
   *
   * @type pv.Mark
   * @name pv.Layout.Network.prototype.link
   */
  this.link = new pv.Mark()
      .extend(this.node)
      .data(function(p) { return [p.sourceNode, p.targetNode]; })
      .fillStyle(null)
      .lineWidth(function(d, p) { return p.linkValue * 1.5; })
      .strokeStyle("rgba(0,0,0,.2)");

  /** @private */
  this.link.add = function(type) {
      return that.add(pv.Panel)
          .data(function() { return that.links(); })
        .add(type)
          .extend(this);
    };

  /**
   * The node label prototype, which renders the node name adjacent to the node.
   * This prototype is provided as an alternative to using the anchor on the
   * node mark; it is primarily intended to be used with radial node-link
   * layouts, since it provides a convenient mechanism to set the text angle.
   *
   * @type pv.Mark
   * @name pv.Layout.Network.prototype.label
   */
  (this.label = new pv.Mark()
      .extend(this.node)
      .textMargin(7)
      .textBaseline("middle")
      .text(function(n) { return n.nodeName || n.nodeValue; })
      .textAngle(function(n) {
          var a = n.midAngle;
          return pv.Wedge.upright(a) ? a : (a + Math.PI);
        })
      .textAlign(function(n) {
          return pv.Wedge.upright(n.midAngle) ? "left" : "right";
        })).parent = this;
};

/** @private Transform nodes and links on cast. */
pv.Layout.Network.prototype = pv.extend(pv.Layout)
    .property("cache", Boolean)
    .property("nodes", function(v) {
        return v.map(function(d, i) {
            if (typeof d != "object") d = {nodeValue: d};
            d.index = i;
            d.linkDegree = 0;
            return d;
          });
      })
    .property("links", function(v) {
        return v.map(function(d) {
            if (isNaN(d.linkValue)) d.linkValue = isNaN(d.value) ? 1 : d.value;
            return d;
          });
      });

pv.Layout.Network.prototype.defaults = new pv.Layout.Network()
    .extend(pv.Layout.prototype.defaults)
    .cache(true);

/** @private Locks node and links after initialization. */
pv.Layout.Network.prototype.init = function() {
  var cache = this.scene.defs.cache;
  if (this.scene.$cache && cache.value) return true;
  this.scene.$cache = true;
  cache.id = 0; // unlock the cache property

  /* Compute link degrees; map source and target indexes to nodes. */
  var nodes = this.nodes();
  this.links().forEach(function(d) {
      var s = d.sourceNode || (d.sourceNode = nodes[d.source]),
          t = d.targetNode || (d.targetNode = nodes[d.target]),
          v = d.linkValue;
      s.linkDegree += v;
      t.linkDegree += v;
    });
};
