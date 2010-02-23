JS_LANG_FILES = \
	src/lang/Array.js

JS_PV_FILES = \
	src/pv.js \
	src/pv-internals.js \
	src/text/Format.js \
	src/text/PadFormat.js \
	src/text/DateFormat.js \
	src/text/TimeFormat.js \
	src/text/NumberFormat.js \
	src/text/CsvFormat.js \
	src/data/Arrays.js \
	src/data/Numbers.js \
	src/data/Objects.js \
	src/data/Dom.js \
	src/data/Tree.js \
	src/data/Nest.js \
	src/data/Flatten.js \
	src/data/Vector.js \
	src/data/Matrix.js \
	src/data/Scale.js \
	src/data/LinearScale.js \
	src/data/LogScale.js \
	src/data/OrdinalScale.js \
	src/color/Color.js \
	src/color/Colors.js \
	src/color/Ramp.js \
	src/scene/svg/SvgScene.js \
	src/scene/svg/SvgArea.js \
	src/scene/svg/SvgBar.js \
	src/scene/svg/SvgDot.js \
	src/scene/svg/SvgImage.js \
	src/scene/svg/SvgLabel.js \
	src/scene/svg/SvgLine.js \
	src/scene/svg/SvgPanel.js \
	src/scene/svg/SvgRule.js \
	src/scene/svg/SvgWedge.js \
	src/mark/Mark.js \
	src/mark/Anchor.js \
	src/mark/Area.js \
	src/mark/Bar.js \
	src/mark/Dot.js \
	src/mark/Label.js \
	src/mark/Line.js \
	src/mark/Rule.js \
	src/mark/Panel.js \
	src/mark/Image.js \
	src/mark/Wedge.js \
	src/physics/Particle.js \
	src/physics/Simulation.js \
	src/physics/Quadtree.js \
	src/physics/Force.js \
	src/physics/ChargeForce.js \
	src/physics/DragForce.js \
	src/physics/SpringForce.js \
	src/physics/Constraint.js \
	src/physics/CollisionConstraint.js \
	src/physics/LinkConstraint.js \
	src/physics/PositionConstraint.js \
	src/layout/Layout.js \
	src/layout/Grid.js \
	src/layout/Stack.js \
	src/layout/Treemap.js \
	src/layout/Tree.js \
	src/layout/Indent.js \
	src/layout/Pack.js \
	src/layout/Force.js \
	src/layout/Cluster.js \
	src/layout/Partition.js \
	src/layout/Arc.js \
	src/behavior/Behavior.js \
	src/behavior/Drag.js \
	src/behavior/Select.js \
	src/behavior/Transform.js

#	src/data/PowerScale.js \

JS_FILES = \
	$(JS_LANG_FILES) \
	$(JS_PV_FILES) \
	src/lang/init.js

all: protovis-d3.2.js protovis-r3.2.js

protovis-d3.2.js: $(JS_FILES) Makefile
	grep '	' -Hn $(JS_FILES) && echo "ERROR: tab" && exit 1 || true
	grep '' -Hn $(JS_FILES) && echo "ERROR: dos newline" && exit 1 || true
	grep ' $$' -Hn $(JS_FILES) && echo "ERROR: trailing space" && exit 1 || true
	cat $(JS_FILES) > $@

protovis-r3.2.js: $(JS_FILES) Makefile
	rm -f $@
	cat $(JS_LANG_FILES) | java -jar lib/yuicompressor-2.4.2.jar --charset UTF-8 --type js >> $@
	cat $(JS_PV_FILES) | java -jar lib/yuicompressor-2.4.2.jar --charset UTF-8 --type js >> $@
	cat src/lang/init.js | java -jar lib/yuicompressor-2.4.2.jar --charset UTF-8 --type js >> $@

clean:
	rm -rf protovis-d3.2.js protovis-r3.2.js
