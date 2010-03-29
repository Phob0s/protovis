pv.SvgScene.line = function(scenes) {
  var e = scenes.$g.firstChild;
  if (scenes.length < 2) return e;
  var s = scenes[0];

  /* segmented */
  if (s.segmented) return this.lineSegment(scenes);

  /* visible */
  if (!s.visible) return e;
  var fill = s.fillStyle, stroke = s.strokeStyle;
  if (!fill.opacity && !stroke.opacity) return e;

  /* points */
  var d = "M" + s.left + "," + s.top;
  if (s.interpolate == "basis" && scenes.length > 2) {
    var s0 = scenes[0],
        s1 = s0,
        s2 = s0,
        s3 = scenes[1];
    d += this.pathBasis(s0, s1, s2, s3);
    for (var i = 2; i < scenes.length; i++) {
      s0 = s1;
      s1 = s2;
      s2 = s3;
      s3 = scenes[i];
      d += this.pathBasis(s0, s1, s2, s3);
    }
    for (var j = 0; j < 2; j++) {
      s0 = s1;
      s1 = s2;
      s2 = s3;
      d += this.pathBasis(s0, s1, s2, s3);
    }
  } else if (s.interpolate == "cardinal" && scenes.length > 2) {
    var a = (1 - s.tension) / 2,
        s0 = scenes[0],
        s1 = scenes[1],
        s2 = scenes[2];
    d += "C" + (s0.left + (s2.left - s0.left) * a)
        + "," + (s0.top + (s2.top - s0.top) * a)
        + "," + (s1.left + (s0.left - s2.left) * a)
        + "," + (s1.top + (s0.top - s2.top) * a)
        + "," + s1.left + "," + s1.top;
    for (var i = 3; i < scenes.length; i++) {
      s0 = s1;
      s1 = s2;
      s2 = scenes[i];
      d += "S" + (s1.left + (s0.left - s2.left) * a)
          + "," + (s1.top + (s0.top - s2.top) * a)
          + "," + s1.left + "," + s1.top;
    }
    d += "S" + (s2.left - (s2.left - s0.left) * a)
        + "," + (s2.top - (s2.top - s0.top) * a)
        + "," + s2.left + "," + s2.top;
  } else {
    for (var i = 1; i < scenes.length; i++) {
      d += this.pathSegment(scenes[i - 1], scenes[i]);
    }
  }

  e = this.expect(e, "path", {
      "shape-rendering": s.antialias ? null : "crispEdges",
      "pointer-events": s.events,
      "cursor": s.cursor,
      "d": d,
      "fill": fill.color,
      "fill-opacity": fill.opacity || null,
      "stroke": stroke.color,
      "stroke-opacity": stroke.opacity || null,
      "stroke-width": stroke.opacity ? s.lineWidth / this.scale : null,
      "stroke-linejoin": s.lineJoin
    });
  return this.append(e, scenes, 0);
};

/**
 * @private Converts the specified b-spline curve segment to a bezier curve
 * compatible with SVG "C".
 *
 * @param s0 the first control point.
 * @param s1 the second control point.
 * @param s2 the third control point.
 * @param s3 the fourth control point.
 */
pv.SvgScene.pathBasis = (function() {

  /**
   * Matrix to transform basis (b-spline) control points to bezier control
   * points. Derived from FvD 11.2.8.
   */
  var basis = [
    [ 1/6, 2/3, 1/6,   0 ],
    [   0, 2/3, 1/3,   0 ],
    [   0, 1/3, 2/3,   0 ],
    [   0, 1/6, 2/3, 1/6 ]
  ];

  /**
   * Returns the point that is the weighted sum of the specified control points,
   * using the specified weights. This method requires that there are four
   * weights and four control points.
   */
  function weight(w, s1, s2, s3, s4) {
    return {
      x:(w[0] * s1.left + w[1] * s2.left + w[2] * s3.left + w[3] * s4.left),
      y:(w[0] * s1.top  + w[1] * s2.top  + w[2] * s3.top  + w[3] * s4.top )
    };
  }

  return function(s0, s1, s2, s3) {
      var b1 = weight(basis[1], s0, s1, s2, s3),
          b2 = weight(basis[2], s0, s1, s2, s3),
          b3 = weight(basis[3], s0, s1, s2, s3);
      return "C" + b1.x + "," + b1.y
          + "," + b2.x + "," + b2.y
          + "," + b3.x + "," + b3.y;
    };
})();

pv.SvgScene.lineSegment = function(scenes) {
  var e = scenes.$g.firstChild;
  for (var i = 0, n = scenes.length - 1; i < n; i++) {
    var s1 = scenes[i], s2 = scenes[i + 1];

    /* visible */
    if (!s1.visible || !s2.visible) continue;
    var stroke = s1.strokeStyle, fill = pv.Color.transparent;
    if (!stroke.opacity) continue;

    /* interpolate */
    var d;
    if ((s1.interpolate == "linear") && (s1.lineJoin == "miter")) {
      fill = stroke;
      stroke = pv.Color.transparent;
      d = this.pathJoin(scenes[i - 1], s1, s2, scenes[i + 2]);
    } else {
      d = "M" + s1.left + "," + s1.top + this.pathSegment(s1, s2);
    }

    e = this.expect(e, "path", {
        "shape-rendering": s1.antialias ? null : "crispEdges",
        "pointer-events": s1.events,
        "cursor": s1.cursor,
        "d": d,
        "fill": fill.color,
        "fill-opacity": fill.opacity || null,
        "stroke": stroke.color,
        "stroke-opacity": stroke.opacity || null,
        "stroke-width": stroke.opacity ? s1.lineWidth / this.scale : null,
        "stroke-linejoin": s1.lineJoin
      });
    e = this.append(e, scenes, i);
  }
  return e;
};

/** @private Returns the path segment for the specified points. */
pv.SvgScene.pathSegment = function(s1, s2) {
  var l = 1; // sweep-flag
  switch (s1.interpolate) {
    case "polar-reverse":
      l = 0;
    case "polar": {
      var dx = s2.left - s1.left,
          dy = s2.top - s1.top,
          e = 1 - s1.eccentricity,
          r = Math.sqrt(dx * dx + dy * dy) / (2 * e);
      if ((e <= 0) || (e > 1)) break; // draw a straight line
      return "A" + r + "," + r + " 0 0," + l + " " + s2.left + "," + s2.top;
    }
    case "step-before": return "V" + s2.top + "H" + s2.left;
    case "step-after": return "H" + s2.left + "V" + s2.top;
  }
  return "L" + s2.left + "," + s2.top;
};

/** @private Line-line intersection, per Akenine-Moller 16.16.1. */
pv.SvgScene.lineIntersect = function(o1, d1, o2, d2) {
  return o1.plus(d1.times(o2.minus(o1).dot(d2.perp()) / d1.dot(d2.perp())));
}

/** @private Returns the miter join path for the specified points. */
pv.SvgScene.pathJoin = function(s0, s1, s2, s3) {
  /*
   * P1-P2 is the current line segment. V is a vector that is perpendicular to
   * the line segment, and has length lineWidth / 2. ABCD forms the initial
   * bounding box of the line segment (i.e., the line segment if we were to do
   * no joins).
   */
  var p1 = pv.vector(s1.left, s1.top),
      p2 = pv.vector(s2.left, s2.top),
      p = p2.minus(p1),
      v = p.perp().norm(),
      w = v.times(s1.lineWidth / (2 * this.scale)),
      a = p1.plus(w),
      b = p2.plus(w),
      c = p2.minus(w),
      d = p1.minus(w);

  /*
   * Start join. P0 is the previous line segment's start point. We define the
   * cutting plane as the average of the vector perpendicular to P0-P1, and
   * the vector perpendicular to P1-P2. This insures that the cross-section of
   * the line on the cutting plane is equal if the line-width is unchanged.
   * Note that we don't implement miter limits, so these can get wild.
   */
  if (s0 && s0.visible) {
    var v1 = p1.minus(s0.left, s0.top).perp().norm().plus(v);
    d = this.lineIntersect(p1, v1, d, p);
    a = this.lineIntersect(p1, v1, a, p);
  }

  /* Similarly, for end join. */
  if (s3 && s3.visible) {
    var v2 = pv.vector(s3.left, s3.top).minus(p2).perp().norm().plus(v);
    c = this.lineIntersect(p2, v2, c, p);
    b = this.lineIntersect(p2, v2, b, p);
  }

  return "M" + a.x + "," + a.y
      + "L" + b.x + "," + b.y
      + " " + c.x + "," + c.y
      + " " + d.x + "," + d.y;
};
