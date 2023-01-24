var files = ["data/ghg-post1990.json", "data/global-ghg-data.json"];
var promises = [];

files.forEach(function(url){
	promises.push(d3.json(url))
});

Promise.all(promises).then(function(values){
	createVis(values[0], values[1]);
});

function createVis(perCountryData, globalData){

	// Create event handler
	var myEventHandler = {};
	var countryEventHandler = {};

	// Create visualization instances
	var countVis = new CountVis("countvis", globalData, myEventHandler); 
	var carbondioxideVis = new CarbondioxideVis("carbondioxidevis", perCountryData); 
	var gasVis = new GasVis("gasvis", perCountryData); 
	var globalMap = new GlobalMap("globalvis", perCountryData, [44, 7], countryEventHandler);
	// Bind event handler
	$(myEventHandler).bind("selectionChanged", function(event, rangeStart, rangeEnd){
		countVis.onSelectionChange(rangeStart, rangeEnd);
		carbondioxideVis.onSelectionChange(rangeStart, rangeEnd);
		gasVis.onSelectionChange(rangeStart, rangeEnd);
		globalMap.onSelectionChange(rangeStart, rangeEnd);
	});
	

	$(countryEventHandler).bind("selectCountry", function(event, target){
		//countVis.onCountryChange(target);
		carbondioxideVis.onCountryChange(target);
		gasVis.onCountryChange(target);
	});
	
}