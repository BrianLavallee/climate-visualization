

// Types of vis to appear in tds
let VisType = {
    Text: 'text',
    Bar: 'bar'
};

let Cell = {
    Width: 100,
    Height: 40
};

let Columns = {
    Region: 'region',
    Country: 'country',
    Area: 'impacted-area',
    AreaPercent: 'percent-impact',
    Population: 'population-impact',
    Density: 'population-density'
};

class Table {

    constructor(countryViewRef, data, activeMeters) {
        this.countryViewRef = countryViewRef;
        this.activeMeters = activeMeters;

        let max = d3.max(data.map(d => {
            return Math.max(d.pop_density_5m, d.pop_density_4m, d.pop_density_3m, d.pop_density_2m, d.pop_density_1m)
        }));

        let tableHeaders = ['region', 'country', 'impacted-area', 'percent-impact', 'population-impact', 'population-density'];

        let headerData = tableHeaders.map(x => {
            return { head: x, sorted: false}
        });

        this.data = data;

        this.selectedCountry = data[0];

        this.impactScale = d3
            .scaleLinear()
            .domain([0, max])
            .range([0, 100]);

        this.createTable(data, headerData);

        // tooltip
        d3
            .select('#CountryTableWrap')
            .append('div')
            .attr("class", "tooltip")
            .style("opacity", 0);
    }

    createTable(data, headerData) {

        let headers = d3
            .select('.header-row')
            .selectAll('th')
            .data(headerData)
            .classed('reverse-sort', d => d.sorted);

        d3
            .select('#CountryTable tbody')
            .selectAll('tr')
            .remove();

        let rows = d3
            .select('#CountryTable tbody')
            .selectAll('tr')
            .data(data)
            .join('tr');

        let cells = rows
            .selectAll('td')
            .data(d => {

                let areaImpact = getAreaImpacted(d, this.activeMeters);
                let percImpact = getPercentImpacted(d, this.activeMeters);
                let population = getPopulationImpacted(d, this.activeMeters).toLocaleString();
                let popDensity = getPopDensityImpacted(d, this.activeMeters);

                return [
                    new TData(VisType.Text, [d.Region], tableClassNames.region),
                    new TData(VisType.Text, [d.Country], tableClassNames.country),
                    new TData(VisType.Text, [areaImpact], tableClassNames.areaImpact),
                    new TData(VisType.Text, [percImpact], tableClassNames.percentImpact),
                    new TData(VisType.Text, [population], tableClassNames.population),
                    new TData(VisType.Bar, [popDensity], tableClassNames.populationDensity)
                ];
            })
            .join('td')
            .attr('class', tdata => tdata.className);

        // fill in table
        let textCells = d3
            .selectAll('td')
            .filter(d => d.visType === VisType.Text);
        textCells.text(d => d.value[0]);

        let barCells = d3
            .selectAll('td')
            .filter(d => d.visType == VisType.Bar);
        barCells.each((d, i, n) => {
            d3
                .select(n[i])
                .append('svg')
                .attr('class', 'density-bar')
                .attr('width', Cell.Width)
                .attr('height', Cell.Height)
        });

        let barGroups = barCells
            .selectAll('svg')
            .append('g')
            .attr('height', Cell.Height);
        barGroups.append('rect')
            .attr('height', Cell.Height)
            .attr('width', d => this.impactScale(d.value[0]));

        this.addTooltip();

        rows.on('click', countryObj => {
            this.selectedCountry = countryObj;
            this.countryViewRef.update(this.selectedCountry);
        });

        this.countryViewRef.update(this.selectedCountry);

        headers.on('click', d => {

            let key = undefined;
            switch(d.head) {
                case Columns.Region:
                    key = 'Region';
                    break;
                case Columns.Country:
                    key = 'Country';
                    break;
                case Columns.Area:
                    key = `area_${this.activeMeters}m`
                    break;
                case Columns.AreaPercent:
                    key = `percent_${this.activeMeters}m`;
                    break;
                case Columns.Population:
                    key = `pop_${this.activeMeters}m`;
                    break;
                case Columns.Density:
                    key = `pop_density_${this.activeMeters}m`;
                    break;
                default:
                    key = 'Region';
                    break;
            }

            let newData = data;
            if(key === 'Region' || key === 'Country') {
                newData = this.sort(data, key, d.sorted);
            }
            else {
                newData = this.sortNumeric(data, key, d.sorted);
            }

            d.sorted = !d.sorted;
            this.createTable(newData, headerData);
        });
    }

    changeActiveMeters(activeMeters) {
        this.activeMeters = activeMeters;

        let rows = d3
            .select('#CountryTable tbody')
            .selectAll('tr')

        let rects = d3
            .selectAll(`.${tableClassNames.populationDensity}`)
            .selectAll('rect')
            .remove();

        rows.each((x, i, nodes) => {

            let node = d3.select(nodes[i]);

            node.select(`.${tableClassNames.areaImpact}`)
                .text(td => {
                    return getAreaImpacted(td, this.activeMeters);
                });

            node.select(`.${tableClassNames.percentImpact}`)
                .text(td => {
                    return getPercentImpacted(td, this.activeMeters);
                });

            node.select(`.${tableClassNames.population}`)
                .text(td => {
                    return getPopulationImpacted(td, this.activeMeters).toLocaleString();
                });

            node.select('g')
                .append('rect')
                .attr('height', Cell.Height)
                .attr('width', td => {
                    let popDens = getPopDensityImpacted(td, this.activeMeters);
                    return this.impactScale(popDens);
                });
        })
    }

    getCountry(code) {
        for (let country of this.data) {
            if (country.CountryCode === code) {
                return country;
            }
        }

        return null;
    }

    addTooltip() {
        let bars = d3.selectAll('.density-bar');
        bars.on('mouseover', function(d) {
            let tooltip = d3.select('.tooltip');
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<h2>${Math.floor(d.value)} people/km<sup>2</sup> </h2>` + "<br/>")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 300) + "px");
        });
        bars.on("mouseout", function() {
            let tooltip = d3.select('.tooltip');
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    }


    sort(data, key, reverse) {
        if(!reverse) {
            return data.sort((a, b) => {
                if(a[key] === b[key]) {
                    // fall back is to sort by country
                    return a.Country > b.Country ? -1 : 1;
                }
                else {
                    return a[key] > b[key] ? -1 : 1;
                }
            });
        }
        else {
            return data.sort((a, b) => {
                if(a[key] === b[key]) {
                    // fall back is to sort by country
                    return a.Country > b.Country ? 1 : -1;
                }
                else {
                    return a[key] > b[key] ? 1 : -1;
                }
            });
        }
    }

    sortNumeric(data, key, reverse) {
        if(!reverse) {
            return data.sort((a, b) => {
                if(a[key] === b[key]) {
                    // fall back is to sort by country
                    return +(a.Country) > +(b.Country) ? -1 : 1;
                }
                else {
                    return +(a[key]) > +(b[key]) ? -1 : 1;
                }
            });
        }
        else {
            return data.sort((a, b) => {
                if(a[key] === b[key]) {
                    // fall back is to sort by country
                    return +(a.Country) > +(b.Country) ? 1 : -1;
                }
                else {
                    return +(a[key]) > +(b[key]) ? 1 : -1;
                }
            });
        }
    }
}
