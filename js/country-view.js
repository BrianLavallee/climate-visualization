
class CountryView {

    /**
     * Creates the coutnry view that contains the info box, map, and slider
     * @param {The default selected meters} activeMeters
     * @param borders
     * @param {Callback to update the table after the slider moves} UpdateTableActiveMeters
     * @param getCountry
     */
    constructor(activeMeters, borders, UpdateTableActiveMeters, getCountry) {
		this.width = 960;
		this.height = 1200;
		this.svgwidth = 520;
		this.svgheight = 650;

        this.drawn = false;

        this.currentmap == undefined;

        this.activeMeters = activeMeters;

        this.borders = topojson.feature(borders, borders.objects.countries);

        this.UpdateTableActiveMeters = UpdateTableActiveMeters;
        this.getCountry = getCountry;
        this.sliderWidthPX = 425;

        this.createInfoBox();
        this.drawYearBar();
    }

    /**
     * Creates the elements for the info box
     */
    createInfoBox() {

        d3
        .select('#CountryView')
        .append('div')
        .attr('id', 'CountryInfo');

        let infoBox = d3.select('#CountryInfo');

        infoBox.append('h2').classed('country-name', true);
        infoBox.append('h5').classed('country-region', true);
        infoBox.append('h5').classed('country-impacted-area', true);
        infoBox.append('h5').classed('country-percent-impacted', true);
        infoBox.append('h5').classed('country-population-impacted', true);
    }

    /**
     * Updates the view with the specified country
     * @param countryObj
     */
    update(countryObj) {
        if (this.countryObj) {
            d3.select("#" + this.countryObj.CountryCode).classed("highlight", false);
        }
        this.countryObj = countryObj;
        this.updateInfoBox(countryObj);
        if (this.currentmap === countryObj.MapName) {
            // update highlight
            this.draw_outline();
        }
        else {
            this.change_map(countryObj.MapName);
        }
        this.currentmap = countryObj.MapName;
    }

    /**
     * Updates the info box with the specified country
     * @param {*} countryObj
     */
    updateInfoBox(countryObj) {
		this.countryObj = countryObj;
        d3.select('.country-name').html(this.countryObj.Country);
        d3.select('.country-region').html(this.countryObj.Region);
        d3.select('.country-impacted-area').html('Impacted Area: ' + getAreaImpacted(this.countryObj, this.activeMeters) + ' km<sup>2</sup>');
		d3.select('.country-percent-impacted').html('Percent Area Impacted: ' + getPercentImpacted(this.countryObj, this.activeMeters) + '%');
		d3.select('.country-population-impacted').html('Total Population Impacted: ' + getPopulationImpacted(this.countryObj, this.activeMeters).toLocaleString() + ' people');
    }

    /**
     * Creates the elements for the slider
     */
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

        // Set up callback for slider events
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
    /**
     *  Loads the data to draw the chosen region, downselects the data, and draws the map
     */
    change_map(name) {
		let that = this;
		let demreq = new XMLHttpRequest();
		demreq.open("GET", "./data/maps/" + name + ".dem", true);
		demreq.responseType = "arraybuffer";

		demreq.onload = function (demevent) {
			let arrayBuffer = demreq.response;
			if (arrayBuffer) {
				that.dem = new Int16Array(arrayBuffer);

				let srcreq = new XMLHttpRequest();
				srcreq.open("GET", "./data/maps/" + name + ".src", true);
				srcreq.responseType = "arraybuffer";
				srcreq.onload = function(srcevent) {
					let buff = srcreq.response;
					if (buff) {
						that.src = new Int8Array(buff);
                        that.draw(that.activeMeters);
                        that.draw_outline();
					}
				};

				srcreq.send(null);
			}
		};

		demreq.send(null);
	}

    /**
     *  Draws the map for a given rise
     */
	draw(rise) {
		this.activeMeters = rise;
        rise *= 5;
		let tempsrc = this.src.slice(0);

		let h = this.height;
		let w = this.width;

        // keeps track of cells that have been determined to avoid repeated work
		let visited = new Set();
		let stack = [];

        // finds all ocean cells to seed dfs process
		for (let row = 0; row < h; row++) {
			for (let col = 0; col < w; col++) {
				if (tempsrc[row * w + col] == 0) {
					stack.push([row, col]);
				}
			}
		}

        // dfs
		while (stack.length > 0) {
			let x = stack.pop();
			let row = x[0];
			let col = x[1];

			let index = row * w + col;
			if (visited.has(index)) {
				continue;
			}

            // if can reach the current cell from ocean, set to ocean
			tempsrc[index] = 0;
			visited.add(index);

            // all 4 neighbors in the cardinal directions
			let neighbors = [[row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1]];
			for (let n of neighbors) {
				let r = n[0];
				let c = n[1];

                // check bounds
				if (r < h && r >= 0 && col < w & col >= 0) {
					let i = r * w + c;
                    // set to ocean if elevation is less than the given amount of sea level rise
					if (this.dem[i] <= rise) {
						if (!visited.has(i)) {
							stack.push(n);
						}
					}
				}
			}
		}

        // determine the countours for 0 sea level rise
		var basecontour = d3.contours()
			.size([w, h])
			.thresholds([1])
			(this.src);

        // determine the countours for given sea level rise
		var risecontour = d3.contours()
			.size([w, h])
			.thresholds([1])
			(tempsrc);

		function scale(xscale, yscale) {
	        return d3.geoTransform({
	            point: function(x, y) {
	                this.stream.point(x * xscale, y  * yscale);
	            }
	        });
	    }

        // sets svg attributes and draws background
		let svg = d3.select("#map").attr("width", this.svgwidth).attr("height", this.svgheight);
		svg.selectAll("rect").data([0]).enter().append("rect").attr("fill", "#3e6e7a").attr("width", this.svgwidth).attr("height", this.svgheight);


		let path = d3.geoPath().projection(scale(this.svgwidth/w, this.svgheight/h));

        // draws contours (just geojson)
		let base = svg.selectAll(".basemap").data(basecontour);
		base.enter().append("path").attr("class", "basemap").attr("d", d => path(d)).attr("fill", "#879ca3");
		base.attr("d", d => path(d));

		let top = svg.selectAll(".risemap").data(risecontour);
		top.enter().append("path").attr("class", "risemap").attr("d", d => path(d)).attr("fill", "#567d46");
		top.attr("d", d => path(d));
	}

    /**
     * Draws the outline of the countries on top of the map
     */
    draw_outline() {
        // creates the svg elements necessary if not yet created
        if (!this.drawn) {
            this.drawn = true;
            let svg = d3.select("#map");
            let group = svg.append("g");

            let projection = d3.geoEquirectangular().scale(744.07).translate([0, 0]);
            let path = d3.geoPath().projection(projection);

            let outline = group.selectAll(".outline").data(this.borders.features);
            outline.enter().append("path").attr("class", "outline").attr("d", d => path(d.geometry)).attr("fill", "none").attr("stroke", "black").attr("id", d => d.id);

            let that = this;

            let click = group.selectAll(".click").data(this.borders.features);
            click.enter().append("path").attr("d", d => path(d.geometry)).attr("opacity", 0).on("click", function(d) {
                let co = that.getCountry(d.id);
                if (co) {
                    that.update(co);
                }
            });
        }

        // repositions the map so that it aligns with the selected region
        this.position_outline();
    }

    /**
     *  Positions the country outline so that it matches the map view
     */
    position_outline() {
        let group = d3.select("#map").select("g");

        // parses the filename to determine the lat long of 0,0 in the svg
        let x = parseInt(this.countryObj.MapName.substring(1, 4));
        let y = parseInt(this.countryObj.MapName.substring(5));
        x *= this.countryObj.MapName[0] === "w" ? 1 : -1;
        y *= this.countryObj.MapName[4] == "s" ? -1 : 1;

        // width 960
        // height 480
        // scale 152.63
        // uses d3 projection to determine the proper offset
        let projection = d3.geoEquirectangular().scale(744.07).translate([0, 0]);
        let pos = projection([x, y]);

        // translates the group containing the outlines
        group.attr("transform", "translate(" + pos[0] + ", " + (-1 * pos[1]) + ")");

        // ensures the correct country is highlighted
        d3.select("#" + this.countryObj.CountryCode).classed("highlight", true);
    }
}
