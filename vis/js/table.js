

// Types of vis to appear in tds
let VisType = {
    Text: 'text'
}

class Table {

    constructor(countryViewRef, data, activeMeters) {
        this.countryViewRef = countryViewRef;
        this.activeMeters = activeMeters;

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

                return [
                    new TData(VisType.Text, d.Region, tableClassNames.region),
                    new TData(VisType.Text, d.Country, tableClassNames.country),
                    new TData(VisType.Text, d.CountryArea, tableClassNames.area),
                    new TData(VisType.Text, areaImpact, tableClassNames.areaImpact),
                    new TData(VisType.Text, percImpact, tableClassNames.percentImpact)
                ];
            })
            .join('td')
            .attr('class', tdata => tdata.className);

        // fill in table
        d3
            .selectAll('td')
            .filter(d => d.visType === VisType.Text)
            .text(d => d.value);

        rows.on('click', countryObj => this.countryViewRef.updateInfoBox(countryObj));
    }

    changeActiveMeters(activeMeters) {
        this.activeMeters = activeMeters;

        let rows = d3
            .select('#CountryTable tbody')
            .selectAll('tr')

        rows.each((x, i, nodes) => {

            let node = d3.select(nodes[i]);

            node.select(`.${tableClassNames.areaImpact}`)
                .text(td => {
                    return getAreaImpacted(td, this.activeMeters);
                });

            node.select(`.${tableClassNames.percentImpact}`)
                .text(td => getPercentImpacted(td, this.activeMeters));

        })
    }
}
