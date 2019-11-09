
d3.csv('data/area_impact.csv').then(data => {

    let countryView = new CountryView();

    let table = new Table(countryView, data)

});