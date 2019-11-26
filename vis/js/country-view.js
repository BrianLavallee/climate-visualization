
class CountryView {

    constructor(activeMeters, UpdateTableActiveMeters) {

        this.blocksize = 5;
		this.width = 4800;
		this.height = 6000;
		this.svgwidth = 600;
		this.svgheight = 750;

        this.activeMeters = activeMeters;

        this.activeCountry = undefined;

        this.UpdateTableActiveMeters = UpdateTableActiveMeters;
        this.sliderWidthPX = 425;

        this.createInfoBox();
        this.drawYearBar();
    }

    createInfoBox() {

        d3
        .select('#CountryView')
        .append('div')
        .attr('id', 'CountryInfo');

        let infoBox = d3.select('#CountryInfo');

        infoBox.append('h2').classed('country-name', true);
        infoBox.append('h4').classed('country-region', true);
        infoBox.append('h4').classed('country-impacted-area', true);
        infoBox.append('h4').classed('country-percent-impacted', true);
    }

    update(countryObj) {
        this.countryObj = countryObj;
        this.updateInfoBox(countryObj);
        this.change_map("e020n40");
    }

    updateInfoBox(countryObj) {
        this.countryObj = countryObj;
        d3.select('.country-name').html(this.countryObj.Country);
        d3.select('.country-region').html(this.countryObj.Region);
        d3.select('.country-impacted-area').html('Impacted Area: ' + getAreaImpacted(this.countryObj, this.activeMeters) + ' km<sup>2</sup>');
        d3.select('.country-percent-impacted').html('Percent Area Impacted: ' + getPercentImpacted(this.countryObj, this.activeMeters) + '%');
    }

    drawYearBar() {

        d3
            .select('#CountryView')
            .append('div')
            .attr('id', 'CountryImage')
            .append("svg")
            .attr("id", "map");

        d3
            .select('#CountryView')
            .append('div')
            .attr('id', 'Slider');

        //Slider to change the activeYear of the data
        this.yearScale = d3.scaleLinear().domain([0, 5]).range([0, this.sliderWidthPX]);
        let sliderTextScale = d3.scaleLinear().domain([0, 5]).range([12, this.sliderWidthPX - 10]);

        let yearSlider = d3.select('#Slider')
            .append('div').classed('slider-wrap', true)
            .append('input').classed('slider', true)
            .attr('type', 'range')
            .attr('min', 0)
            .attr('max', 5)
            .attr('value', this.activeMeters);

        let sliderLabel = d3.select('.slider-wrap')
            .append('div').classed('slider-label', true)
            .append('svg');

        let sliderText = sliderLabel.append('text')
            .text(`${this.activeMeters}m`)
            .attr('id', 'SliderText');

        sliderText.attr('x', sliderTextScale(this.activeMeters));
        sliderText.attr('y', 25);

        yearSlider.on('input', (_, __, sliderArr) => {

            this.activeMeters = +(sliderArr[0].value);
			this.draw(this.activeMeters);

            this.UpdateTableActiveMeters(+this.activeMeters);
            this.updateInfoBox(this.countryObj);

            // update year slider text
            d3
                .select('#SliderText')
                .attr('x', sliderTextScale(this.activeMeters))
                .text(`${this.activeMeters}m`);
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    // map drawing
    change_map(name) {
		let that = this;
		let demreq = new XMLHttpRequest();
		demreq.open("GET", "./data/maps/" + name + ".dem", true);
		demreq.responseType = "arraybuffer";

		demreq.onload = function (demevent) {
			let arrayBuffer = demreq.response;
			if (arrayBuffer) {
				let dem = new Int8Array(arrayBuffer);

				let srcreq = new XMLHttpRequest();
				srcreq.open("GET", "./data/maps/" + name + ".src", true);
				srcreq.responseType = "arraybuffer";
				srcreq.onload = function(srcevent) {
					let buff = srcreq.response;
					if (buff) {
						let src = new Int8Array(buff);
						that.process(dem, src);
						that.draw(that.activeMeters);
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
		this.activeMeters = rise;
        rise *= 10;
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
