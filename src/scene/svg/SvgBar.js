pv.SvgScene.bar = function(scenes) {
  var e = scenes.$g.firstChild;
  for (var i = 0; i < scenes.length; i++) {
    var s = scenes[i];

    /* visible */
    if (!s.visible) continue;
    var fill = s.fillStyle || pv.Color.none,
        stroke = s.strokeStyle || pv.Color.none;
    if (!fill.opacity && !stroke.opacity) continue;

    e = this.expect(e, "rect", {
        "shape-rendering": s.antialias ? null : "crispEdges",
        "cursor": s.cursor,
        "x": s.left,
        "y": s.top,
        "width": Math.max(1E-10, s.width),
        "height": Math.max(1E-10, s.height),
        "fill": fill.color,
        "fill-opacity": fill.opacity || null,
        "stroke": stroke.color,
        "stroke-opacity": stroke.opacity || null,
        "stroke-width": stroke.opacity ? s.lineWidth : null
      });
    e = this.append(e, scenes, i);
  }
  return e;
};
