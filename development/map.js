
class Map {

	constructor(dem, src) {
		let temp = new Int16Array(dem.length / 2);
		for (let i = 0; i < dem.length; i += 2) {
			let x = (dem[i] << 8) + dem[i+1];
			temp[i/2] = x;
		}

		let blocksize = 5;
		let width = 4800;
		let height = 6000;
		let rise = 0;

		this.dem = this.downselect(temp, width, height, blocksize);
		this.src = this.downselect(src, width, height, blocksize);

		let visited = new Set();
		let stack = [];
		for (let row = 0; row < height/blocksize; row++) {
			for (let col = 0; col < width/blocksize; col++) {
				if (this.src[row * width/blocksize + col] == 0) {
					stack.push([row, col]);
				}
			}
		}

		while (stack.length > 0) {
			let x = stack.pop();
			let row = x[0];
			let col = x[1];

			let index = row * width/blocksize + col;
			if (visited.has(index)) {
				continue;
			}

			this.src[index] = 0;
			visited.add(index);

			let neighbors = [[row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1]];
			for (let n of neighbors) {
				let r = n[0];
				let c = n[1];
				if (r < height/blocksize && r >= 0 && col < width/blocksize & col >= 0) {
					let i = r * width/blocksize + c;
					if (this.dem[i] <= rise) {
						if (!visited.has(i)) {
							stack.push(n);
						}
					}
				}
			}
		}


		// let visited = new Set();
		// for (let row = 0; row < height/blocksize; row++) {
		// 	for (let col = 0; col < width/blocksize; col++) {
		// 		if (this.src[row * width + col] == 0) {
		// 			this.dfs(this.dem, this.src, row, col, width/blocksize, height/blocksize, rise, visited);
		// 		}
		// 	}
		// }
		//
		// let mine = 1000000;
		// for (let row = 0; row < height/blocksize; row++) {
		// 	for (let col = 0; col < width/blocksize; col++) {
		// 		if (this.src[row * width/blocksize + col] > 0) {
		// 			mine = Math.min(mine, this.dem[row * width/blocksize + col]);
		// 		}
		// 	}
		// }
		//
		// for (let row = 0; row < height/blocksize; row++) {
		// 	for (let col = 0; col < width/blocksize; col++) {
		// 		if (this.src[row * width/blocksize + col] > 0) {
		// 			this.dem[row * width/blocksize + col] -= mine;
		// 		}
		// 	}
		// }

		var contours = d3.contours()
		    .size([width/blocksize, height/blocksize])
		    .thresholds([1])
		    (this.src);


		// contours.push(d3.contours().size([width/blocksize, height/blocksize]).thresholds([rise + 1])(this.dem)[0]);

		// console.log(contours);


		let svgwidth = 600;
		let svgheight = 750;

		function scale (xscale, yscale) {
	        return d3.geoTransform({
	            point: function(x, y) {
	                this.stream.point(x * xscale, y  * yscale);
	            }
	        });
	    }

		let svg = d3.select("#map").attr("width", svgwidth).attr("height", svgheight);
		let path = d3.geoPath().projection(scale(blocksize/width*svgwidth, blocksize/height*svgheight));

		svg.selectAll("path")
			.data(contours)
			.enter()
			.append("path")
			.attr("d", path);
			// .attr("fill", (d, i) => ["red", "black"][i]);
	}

	downselect(data, width, height, blocksize) {
		let dsdata = new Int16Array(height/blocksize * width/blocksize);
		for (let row = 0; row < height; row += blocksize) {
			for (let col = 0; col < width; col += blocksize) {
				let val = data[row * width + col];
				for (let i = 0; i < blocksize; i++) {
					for (let j = 0; j < blocksize; j++) {
						let index = ((row + i) * width) + (col + j);
						val = Math.max(val, data[index]);
					}
				}

				dsdata[row/blocksize * width/blocksize + col/blocksize] = val;
			}
		}

		return dsdata;
	}
}
