
let Raycaster = (() => {

	let RC = {
		run(origin, blocks, ctx) {
			let endpoints = this.loadMap(blocks, origin);
			let visibility = this.calculateVisibility(origin, endpoints);
		},
		loadMap(blocks, origin) {
			let segments = this.processSegments(origin, blocks);
			let endpoints = flatMap(getSegmentEndPoints, segments);
			return endpoints;
		},
		processSegments(origin, segments) {
			for (let i = 0; i < segments.length; i += 1) {
				let segment = segments[i];
				this.calculateEndPointAngles(origin, segment);
				setSegmentBeginning(segment);
			}
			return segments;
		},
		calculateVisibility(origin, endpoints) {
			
		},
		calculateEndPointAngles(origin, segment) {
			let { x, y } = origin;
			let dx = 0.5 * (segment.p1.x + segment.p2.x) - x;
			let dy = 0.5 * (segment.p1.y + segment.p2.y) - y;
			segment.d = (dx * dx) + (dy * dy);
			segment.p1.angle = Math.atan2(segment.p1.y - y, segment.p1.x - x);
			segment.p2.angle = Math.atan2(segment.p2.y - y, segment.p2.x - x);
		}
	};

	let flatMap = (cb, array) => array.reduce((flatArray, item) => flatArray.concat(cb(item)), []);
	let getSegmentEndPoints = segment => [segment.p1, segment.p2];

	let setSegmentBeginning = segment => {
			let dAngle = segment.p2.angle - segment.p1.angle;
			if (dAngle <= -Math.PI) dAngle += Math.TAU;
			if (dAngle >   Math.PI) dAngle -= Math.TAU;
			segment.p1.beginsSegment = dAngle > 0;
			segment.p2.beginsSegment = !segment.p1.beginsSegment;
		};

	let Point = (x, y) => ({ x, y });
	let EndPoint = (x, y, beginsSegment, segment, angle) => ({ ...Point(x, y), beginsSegment, segment, angle });
	let Segment = (x1, y1, x2, y2) => {
			let p1 = EndPoint(x1, y1);
			let p2 = EndPoint(x2, y2);
			let segment = { p1, p2, d: 0 };
			p1.segment = segment;
			p2.segment = segment;
			return segment;
		};

	return RC;

})();
