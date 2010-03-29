/**
 * Returns the specified geographical projection. The arguments to this
 * constructor are optional, and equivalent to calling {@link #projection}.
 *
 * @class Represents a geographical scale. A geographical scale represents the
 * mapping between longitude and latitude coordinates and their appropriate
 * positioning on the screen. By default the appropriate domain is inferred so
 * as to map the entire world onto the screen.
 *
 * @param {pv.Geo.Projection} [p] optional projection.
 * @returns {pv.Geo.Scale} a geographical scale.
 */
pv.Geo.scale = function(p) {
  var rmin = {x: 0, y: 0}, // default range minimum
      rmax = {x: 1, y: 1}, // default range maximum
      d = [], // default domain
      j = pv.Geo.projections.identity, // domain <-> normalized range
      x = pv.Scale.linear(-1, 1).range(0, 1), // normalized <-> range
      y = pv.Scale.linear(-1, 1).range(1, 0), // normalized <-> range
      lastLatLng, // cached latlng
      lastPoint; // cached point

  /** @private */
  function scale(latlng) {
    if (!lastLatLng
        || (latlng.lng != lastLatLng.lng)
        || (latlng.lat != lastLatLng.lat)) {
      lastLatLng = latlng;
      var p = j.project(latlng);
      lastPoint = {x: x(p.x), y: y(p.y)};
    }
    return lastPoint;
  }

  /** Returns the projected x-coordinate. */
  scale.x = function(latlng) {
    return scale(latlng).x;
  };

  /** Returns the projected y-coordinate. */
  scale.y = function(latlng) {
    return scale(latlng).y;
  };

  /** Tick functions. @namespace */
  scale.ticks = {

    /** Returns longitude ticks. */
    lng: function(m) {
      var lat, lng;
      if (d.length > 1) {
        var s = pv.Scale.linear();
        if (m == undefined) m = 10;
        lat = s.domain(d, function(d) { return d.lat; }).ticks(m);
        lng = s.domain(d, function(d) { return d.lng; }).ticks(m);
      } else {
        lat = pv.range(-80, 81, 10);
        lng = pv.range(-180, 181, 10);
      }
      return lng.map(function(lng) {
        return lat.map(function(lat) {
          return {lat: lat, lng: lng};
        });
      });
    },

    /** Returns latitude ticks. */
    lat: function(m) {
      return pv.transpose(scale.ticks.lng(m));
    }
  };

  /**
   * Inverts the specified value in the output range, returning the
   * corresponding value in the input domain. This is frequently used to convert
   * the mouse location (see {@link pv.Mark#mouse}) to a value in the input
   * domain. Inversion is only supported for numeric ranges, and not colors.
   *
   * <p>Note that this method does not do any rounding or bounds checking. If
   * the input domain is discrete (e.g., an array index), the returned value
   * should be rounded. If the specified <tt>y</tt> value is outside the range,
   * the returned value may be equivalently outside the input domain.
   *
   * @function
   * @name pv.Geo.scale.prototype.invert
   * @param {number} y a value in the output range (a pixel location).
   * @returns {number} a value in the input domain.
   */
  scale.invert = function(p) {
    return j.invert({x: x.invert(p.x), y: y.invert(p.y)});
  };

  /**
   * Sets or gets the input domain. Note that unlike quantitative scales, the
   * domain cannot be reduced to a simple rectangle (i.e., minimum and maximum
   * values for latitude and longitude). Instead, the domain values must be
   * projected to normalized space, effectively finding the domain in normalized
   * space rather than in terms of latitude and longitude. Thus, changing the
   * projection requires recomputing the normalized domain.
   *
   * <p>This method can be invoked several ways:
   *
   * <p>1. <tt>domain(values...)</tt>
   *
   * <p>Specifying the domain as a series of {@link pv.Geo.LatLng}s is the most
   * explicit and recommended approach. However, if the domain values are
   * derived from data, you may find the second method more appropriate.
   *
   * <p>2. <tt>domain(array, f)</tt>
   *
   * <p>Rather than enumerating the domain explicitly, you can specify a single
   * argument of an array. In addition, you can specify an optional accessor
   * function to extract the domain values (as {@link pv.Geo.LatLng}s) from the
   * array. If the specified array has fewer than two elements, this scale will
   * default to the full normalized domain.
   *
   * <p>2. <tt>domain()</tt>
   *
   * <p>Invoking the <tt>domain</tt> method with no arguments returns the
   * current domain as an array.
   *
   * @function
   * @name pv.Geo.scale.prototype.domain
   * @param {...} domain... domain values.
   * @returns {pv.Geo.scale} <tt>this</tt>, or the current domain.
   */
  scale.domain = function(array, f) {
    if (arguments.length) {
      d = (array instanceof Array)
          ? ((arguments.length > 1) ? pv.map(array, f) : array)
          : Array.prototype.slice.call(arguments);
      if (d.length > 1) {
        var n = d.map(j.project); // normalized domain
        x.domain(n, function(p) { return p.x; });
        y.domain(n, function(p) { return p.y; });
      } else {
        x.domain(-1, 1);
        y.domain(-1, 1);
      }
      lastLatLng = null; // invalidate the cache
      return this;
    }
    return d;
  };

  /**
   * Sets or gets the output range. This method can be invoked several ways:
   *
   * <p>1. <tt>range(min, max)</tt>
   *
   * <p>If two objects are specified, the arguments should be {@link pv.Vector}s
   * which specify the minimum and maximum values of the x- and y-coordinates
   * explicitly.
   *
   * <p>2. <tt>range(width, height)</tt>
   *
   * <p>If two numbers are specified, the arguments specify the maximum values
   * of the x- and y-coordinates explicitly; the minimum values are implicitly
   * zero.
   *
   * <p>3. <tt>range()</tt>
   *
   * <p>Invoking the <tt>range</tt> method with no arguments returns the current
   * range as an array of two {@link pv.Vector}s: the minimum (top-left) and
   * maximum (bottom-right) values.
   *
   * @function
   * @name pv.Geo.scale.prototype.range
   * @param {...} range... range values.
   * @returns {pv.Geo.scale} <tt>this</tt>, or the current range.
   */
  scale.range = function(min, max) {
    if (arguments.length) {
      if (typeof min == "object") {
        rmin = {x: Number(min.x), y: Number(min.y)};
        rmax = {x: Number(max.x), y: Number(max.y)};
      } else {
        rmin = {x: 0, y: 0};
        rmax = {x: Number(min), y: Number(max)};
      }
      x.range(rmin.x, rmax.x);
      y.range(rmax.y, rmin.y); // XXX flipped?
      lastLatLng = null; // invalidate the cache
      return this;
    }
    return [rmin, rmax];
  };

  /**
   * Sets or gets the projection. This method can be invoked several ways:
   *
   * <p>1. <tt>projection(string)</tt>
   *
   * <p>Specifying a string sets the projection to the given named projection in
   * {@link pv.Geo.projections}. If no such projection is found, the identity
   * projection is used.
   *
   * <p>2. <tt>projection(object)</tt>
   *
   * <p>Specifying an object sets the projection to the given custom projection,
   * which must implement the <i>forward</i> and <i>inverse</i> methods per the
   * {@link pv.Geo.Projection} interface.
   *
   * <p>3. <tt>projection()</tt>
   *
   * <p>Invoking the <tt>projection</tt> method with no arguments returns the
   * current object that defined the projection.
   *
   * @function
   * @name pv.Scale.geo.prototype.projection
   * @param {...} range... range values.
   * @returns {pv.Scale.geo} <tt>this</tt>, or the current range.
   */
  scale.projection = function(p) {
    if (arguments.length) {
      j = typeof p == "string"
          ? pv.Geo.projections[p] || pv.Geo.projections.identity
          : p;
      return this.domain(d); // recompute normalized domain
    }
    return p;
  };

  /**
   * Returns a view of this scale by the specified accessor function <tt>f</tt>.
   * Given a scale <tt>g</tt>, <tt>g.by(function(d) d.foo)</tt> is equivalent to
   * <tt>function(d) g(d.foo)</tt>. This method should be used judiciously; it
   * is typically more clear to invoke the scale directly, passing in the value
   * to be scaled.
   *
   * @function
   * @name pv.Geo.scale.prototype.by
   * @param {function} f an accessor function.
   * @returns {pv.Geo.scale} a view of this scale by the specified accessor
   * function.
   */
  scale.by = function(f) {
    function by() { return scale(f.apply(this, arguments)); }
    for (var method in scale) by[method] = scale[method];
    return by;
  };

  if (arguments.length) scale.projection(p);
  return scale;
};
