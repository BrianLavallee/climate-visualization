

// Types of vis to appear in tds
let VisType = {
    Text: 'text',
    Bar: 'bar'
};

let Cell = {
    Width: 100,
    Height: 40
};

class Table {

    constructor(countryViewRef, data, activeMeters) {
        this.countryViewRef = countryViewRef;
        this.activeMeters = activeMeters;

        let max = d3.max(data.map(d => {
            return Math.max(d.pop_density_5m, d.pop_density_4m, d.pop_density_3m, d.pop_density_2m, d.pop_density_1m)
        }));

        this.impactScale = d3
            .scaleLinear()
            .domain([0, max])
            .range([0, 100]);

        this.createTable(data);
    }

    createTable(data) {

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
                let popDensity = getPopDensityImpacted(d, this.activeMeters);

                return [
                    new TData(VisType.Text, [d.Region], tableClassNames.region),
                    new TData(VisType.Text, [d.Country], tableClassNames.country),
                    new TData(VisType.Text, [areaImpact], tableClassNames.areaImpact),
                    new TData(VisType.Text, [percImpact], tableClassNames.percentImpact),
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

        rows.on('click', countryObj => this.countryViewRef.update(countryObj));

        // populate with default
        this.countryViewRef.update(data[0]);
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
            
            node.select('g')
                .append('rect')
                .attr('height', Cell.Height)
                .attr('width', td => {
                    let popDens = getPopDensityImpacted(td, this.activeMeters);
                    return this.impactScale(popDens);
                });

        })
    }
}
