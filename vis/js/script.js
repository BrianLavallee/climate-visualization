
d3.csv('data/area-pop-density-impact.csv').then(data => {

    let countryView = undefined;
    let table = undefined;
    let activeMeters = 2;

    function UpdateTableActiveMeters(activeMeters) {

        table.changeActiveMeters(activeMeters);
    }

    function getCountry(code) {
        return table.getCountry(code);
    }

    d3.json("data/world.json").then(borders => {
        countryView = new CountryView(activeMeters, borders, UpdateTableActiveMeters, getCountry);
        table = new Table(countryView, data, activeMeters);
    });
});
