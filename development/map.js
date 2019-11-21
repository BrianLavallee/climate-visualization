
class Map {

	constructor() {
		this.blocksize = 5;
		this.width = 4800;
		this.height = 6000;
		this.rise = 0;
		this.svgwidth = 600;
		this.svgheight = 750;
	}

	change_map(name) {
		let that = this;
		let demreq = new XMLHttpRequest();
		demreq.open("GET", "./" + name + ".dem", true);
		demreq.responseType = "arraybuffer";

		demreq.onload = function (demevent) {
			let arrayBuffer = demreq.response; // Note: not oReq.responseText
			if (arrayBuffer) {
				let dem = new Int8Array(arrayBuffer);

				let srcreq = new XMLHttpRequest();
				srcreq.open("GET", "./" + name + ".src", true);
				srcreq.responseType = "arraybuffer";
				srcreq.onload = function(srcevent) {
					let buff = srcreq.response;
					if (buff) {
						let src = new Int8Array(buff);
						that.process(dem, src);
						that.draw(that.rise);
					}
				};

				srcreq.send(null);
			}
		};

		demreq.send(null);
	}

	process(dem, src) {
		let temp = new Int16Array(dem.length / 2);
		for (let i = 0; i < dem.length; i += 2) {
			let x = (dem[i] << 8) + dem[i+1];
			temp[i/2] = x;
		}

		this.dem = this.downselect(temp);
		this.src = this.downselect(src);
	}

	downselect(data) {
		let h = this.height;
		let w = this.width;
		let bs = this.blocksize;

		let dsdata = new Int16Array(h/bs * w/bs);
		for (let row = 0; row < h; row += bs) {
			for (let col = 0; col < w; col += bs) {
				let val = data[row * w + col];
				for (let i = 0; i < bs; i++) {
					for (let j = 0; j < bs; j++) {
						let index = ((row + i) * w) + (col + j);
						val = Math.max(val, data[index]);
					}
				}

				dsdata[row/bs * w/bs + col/bs] = val;
			}
		}

		return dsdata;
	}

	draw(rise) {
		this.rise = rise;
		let tempsrc = this.src.slice(0);

		let h = this.height;
		let w = this.width;
		let bs = this.blocksize;

		let visited = new Set();
		let stack = [];
		for (let row = 0; row < h/bs; row++) {
			for (let col = 0; col < w/bs; col++) {
				if (tempsrc[row * w/bs + col] == 0) {
					stack.push([row, col]);
				}
			}
		}

		while (stack.length > 0) {
			let x = stack.pop();
			let row = x[0];
			let col = x[1];

			let index = row * w/bs + col;
			if (visited.has(index)) {
				continue;
			}

			tempsrc[index] = 0;
			visited.add(index);

			let neighbors = [[row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1]];
			for (let n of neighbors) {
				let r = n[0];
				let c = n[1];
				if (r < h/bs && r >= 0 && col < w/bs & col >= 0) {
					let i = r * w/bs + c;
					if (this.dem[i] <= rise) {
						if (!visited.has(i)) {
							stack.push(n);
						}
					}
				}
			}
		}

		var basecontour = d3.contours()
			.size([w/bs, h/bs])
			.thresholds([1])
			(this.src);

		var risecontour = d3.contours()
			.size([w/bs, h/bs])
			.thresholds([1])
			(tempsrc);

		function scale (xscale, yscale) {
	        return d3.geoTransform({
	            point: function(x, y) {
	                this.stream.point(x * xscale, y  * yscale);
	            }
	        });
	    }

		let svg = d3.select("#map").attr("width", this.svgwidth).attr("height", this.svgheight);
		svg.selectAll("rect").data([0]).enter().append("rect").attr("fill", "#3e6e7a").attr("width", this.svgwidth).attr("height", this.svgheight);
		let path = d3.geoPath().projection(scale(bs/w*this.svgwidth, bs/h*this.svgheight));

		let base = svg.selectAll(".basemap").data(basecontour);
		base.enter().append("path").attr("class", "basemap").attr("d", d => path(d)).attr("fill", "#879ca3");
		base.attr("d", d => path(d));

		let top = svg.selectAll(".risemap").data(risecontour);
		top.enter().append("path").attr("class", "risemap").attr("d", d => path(d)).attr("fill", "#567d46");
		top.attr("d", d => path(d));
	}
}
