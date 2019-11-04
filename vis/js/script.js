
d3.csv('data/area_impact.csv').then(data => {

    let table = new Table();
    table.createTable(data);
});