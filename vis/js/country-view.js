
class CountryView {

    constructor() {
        this.activeMeters = 0;
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

    updateInfoBox(countryRegion, country, impactedArea, percentImpact) {

        d3.select('.country-name').html(country);
        d3.select('.country-region').html(countryRegion);
        d3.select('.country-impacted-area').html('Impacted Area: ' + impactedArea);
        d3.select('.country-percent-impacted').html('Percent Area Impacted: ' + percentImpact);
    }

    drawYearBar() {

        this.activeMeters = 2;


        d3
            .select('#CountryView')
            .append('div')
            .attr('id', 'CountryImage');

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

            // TODO update table data

            this.activeMeters = sliderArr[0].value;

            // update year slider text
            d3
                .select('#SliderText')
                .attr('x', sliderTextScale(this.activeMeters))
                .text(`${this.activeMeters}m`);
        });
    }
}



