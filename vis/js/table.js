
/**
 * Data for td elements
 */
class TData {
    /**
     * 
     * @param visType 
     * @param value 
     */
    constructor(visType, value) {
        this.visType = visType;
        this.value = value;
    }
}

// Types of vis to appear in tds
let VisType = {
    Text: 'text'
}

class Table {

    constructor() {

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

                // default is 1 meter
                let perc = d.percent_1m;

                return [
                    new TData(VisType.Text, d.Region),
                    new TData(VisType.Text, d.Country),
                    new TData(VisType.Text, d.CountryArea),
                    new TData(VisType.Text, perc)
                ];
            })
            .join('td');

        // write text
        d3
            .selectAll('td')
            .filter(d => d.visType === VisType.Text)
            .text(d => d.value);
    }
}