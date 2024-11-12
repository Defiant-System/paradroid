
let Raycaster = (() => {

	let RC = {
		run(arena, blocks, ctx) {
			let origin = arena.player.position;
			let endpoints = this.loadMap(blocks, origin);
			this.visibility = this.calculateVisibility(origin, endpoints);
			this.arena = arena;
			this.origin = origin;
		},
		drawVisibilityTriangles(ctx) {
			if (!this.arena) return;
			ctx.save();
			ctx.translate(this.arena.viewport.x, this.arena.viewport.y);
			ctx.fillStyle = '#ccc';
			ctx.strokeStyle = '#222';
			this.visibility.map(seg => {
				let [p1, p2] = seg;
				ctx.beginPath();
				ctx.moveTo(this.origin.x, this.origin.y);
				ctx.lineTo(p1.x, p1.y);
				ctx.lineTo(p2.x, p2.y);
				ctx.closePath()
				ctx.stroke();
				ctx.fill();
			});
			ctx.restore();
		},
		loadMap(blocks, origin) {
			let blockSegments = [];
			blocks.map(b => blockSegments = blockSegments.concat(blocksToSegments(b)));
			let segments = this.processSegments(origin, blockSegments);
			let endpoints = flatMap(getSegmentEndPoints, segments);
			return endpoints;
		},
		processSegments(origin, segments) {
			segments.map(seg => {
				this.calculateEndPointAngles(origin, seg);
				setSegmentBeginning(seg);
			});
			return segments;
		},
		calculateEndPointAngles(origin, segment) {
			let { x, y } = origin;
			let dx = 0.5 * (segment.p1.x + segment.p2.x) - x;
			let dy = 0.5 * (segment.p1.y + segment.p2.y) - y;
			segment.d = (dx * dx) + (dy * dy);
			segment.p1.angle = Math.atan2(segment.p1.y - y, segment.p1.x - x);
			segment.p2.angle = Math.atan2(segment.p2.y - y, segment.p2.x - x);
		},
		getTrianglePoints(origin, angle1, angle2, segment) {
			let p1 = origin;
			let p2 = Point(origin.x + Math.cos(angle1), origin.y + Math.sin(angle1));
			let p3 = Point(0, 0);
			let p4 = Point(0, 0);

			if (segment) {
				p3.x = segment.p1.x;
				p3.y = segment.p1.y;
				p4.x = segment.p2.x;
				p4.y = segment.p2.y;
			} else {
				p3.x = origin.x + Math.cos(angle1) * 200;
				p3.y = origin.y + Math.sin(angle1) * 200;
				p4.x = origin.x + Math.cos(angle2) * 200;
				p4.y = origin.y + Math.sin(angle2) * 200;
			}

			let pBegin = lineIntersection(p3, p4, p1, p2);
			p2.x = origin.x + Math.cos(angle2);
			p2.y = origin.y + Math.sin(angle2);
			let pEnd = lineIntersection(p3, p4, p1, p2);

			return [pBegin, pEnd];
		},
		calculateVisibility(origin, endpoints) {
			let openSegments = [];
			let output = [];
			let beginAngle = 0;

			endpoints.sort(endpointCompare);

			for (let pass=0; pass<2; pass+=1) {
				for (let i=0; i<endpoints.length; i+=1) {
					let endpoint = endpoints[i];
					let openSegment = openSegments[0];
					
					if (endpoint.beginsSegment) {
						let index = 0
						let segment = openSegments[index];
						while (segment && segmentInFrontOf(endpoint.segment, segment, origin)) {
							index += 1;
							segment = openSegments[index]
						}

						if (!segment) {
							openSegments.push(endpoint.segment);
						} else {
							openSegments.splice(index, 0, endpoint.segment);
						}
					} else {
						let index = openSegments.indexOf(endpoint.segment)
						if (index > -1) openSegments.splice(index, 1);
					}
					
					if (openSegment !== openSegments[0]) {
						if (pass === 1) {
							let trianglePoints = this.getTrianglePoints(origin, beginAngle, endpoint.angle, openSegment);
							output.push(trianglePoints);
						}
						beginAngle = endpoint.angle;
					}
				}
			}

			return output;
		}
	};



	let endpointCompare = (pointA, pointB) => {
		if (pointA.angle > pointB.angle) return 1;
		if (pointA.angle < pointB.angle) return -1;
		if (!pointA.beginsSegment && pointB.beginsSegment) return 1;
		if (pointA.beginsSegment && !pointB.beginsSegment) return -1;
		return 0;
	};

	let leftOf = (segment, point) => {
		let cross = (segment.p2.x - segment.p1.x) * (point.y - segment.p1.y)
					- (segment.p2.y - segment.p1.y) * (point.x - segment.p1.x);
		return cross < 0;
	};

	let interpolate = (pointA, pointB, f) => {
		return Point(
			pointA.x * (1-f) + pointB.x * f,
			pointA.y * (1-f) + pointB.y * f
		);
	};

	let segmentInFrontOf = (segmentA, segmentB, relativePoint) => {
		let A1 = leftOf(segmentA, interpolate(segmentB.p1, segmentB.p2, 0.01));
		let A2 = leftOf(segmentA, interpolate(segmentB.p2, segmentB.p1, 0.01));
		let A3 = leftOf(segmentA, relativePoint);
		let B1 = leftOf(segmentB, interpolate(segmentA.p1, segmentA.p2, 0.01));
		let B2 = leftOf(segmentB, interpolate(segmentA.p2, segmentA.p1, 0.01));
		let B3 = leftOf(segmentB, relativePoint);
		if (B1 === B2 && B2 !== B3) return true;
		if (A1 === A2 && A2 === A3) return true;
		if (A1 === A2 && A2 !== A3) return false;
		if (B1 === B2 && B2 === B3) return false;
		return false;
	};

	let lineIntersection = (point1, point2, point3, point4) => {
		let s = (
				(point4.x - point3.x) * (point1.y - point3.y) -
				(point4.y - point3.y) * (point1.x - point3.x)
			) / (
				(point4.y - point3.y) * (point2.x - point1.x) -
				(point4.x - point3.x) * (point2.y - point1.y)
			);
		return Point(
			point1.x + s * (point2.x - point1.x),
			point1.y + s * (point2.y - point1.y)
		);
	};

	let blocksToSegments = block => {
		return [
			Segment(block[0].x, block[0].y, block[1].x, block[1].y),
			Segment(block[1].x, block[1].y, block[2].x, block[2].y),
			Segment(block[2].x, block[2].y, block[3].x, block[3].y),
			Segment(block[3].x, block[3].y, block[0].x, block[0].y),
		];
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
			let p1 = EndPoint(x1, y1),
				p2 = EndPoint(x2, y2),
				segment = { p1, p2, d: 0 };
			p1.segment = segment;
			p2.segment = segment;
			return segment;
		};

	return RC;

})();
