
d3.csv('data/area_impact.csv').then(data => {

    let countryView = undefined;
    let table = undefined;
    let activeMeters = 2;

    function UpdateTableActiveMeters(activeMeters) {

        table.changeActiveMeters(activeMeters);
    }

    countryView = new CountryView(activeMeters, UpdateTableActiveMeters);
    table = new Table(countryView, data, activeMeters);

});