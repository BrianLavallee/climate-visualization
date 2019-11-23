
/**
 * Data for td elements
 */
class TData {
    /**
     * 
     * @param visType 
     * @param value 
     */
    constructor(visType, value, className) {
        this.visType = visType;
        this.value = value;
        this.className = className;
    }
}

let tableClassNames = {
    region: 'region',
    country: 'country',
    area: 'area',
    areaImpact: 'area-impact',
    percentImpact: 'percent-impact',
    populationDensity: 'population-density'
};


function getAreaImpacted(countryObj, activeMeters) {

    switch(activeMeters) {
        case 1:
            return countryObj.area_1m;
        case 2:
            return countryObj.area_2m;
        case 3:
            return countryObj.area_3m;
        case 4:
            return countryObj.area_4m;
        case 5:
            return countryObj.area_5m;
        default:
            return 0;
    }
}

function getPercentImpacted(countryObj, activeMeters) {

    switch(activeMeters) {
        case 1:
            return countryObj.percent_1m;
        case 2:
            return countryObj.percent_2m;
        case 3:
            return countryObj.percent_3m;
        case 4:
            return countryObj.percent_4m;
        case 5:
            return countryObj.percent_5m;
        default:
            return 0;
    }
}

function getPopDensityImpacted(countryObj, activeMeters) {

    switch(activeMeters) {
        case 1:
            return countryObj.pop_density_1m;
        case 2:
            return countryObj.pop_density_2m;
        case 3:
            return countryObj.pop_density_3m;
        case 4:
            return countryObj.pop_density_4m;
        case 5:
            return countryObj.pop_density_5m;
        default:
            return 0;
    }
}
