
/*
 * CarbondioxideVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data			    -- the actual data
 */

CarbondioxideVis = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;
    this.timeRange = d3.range(1990, 2021);
    this.initVis();
    this.yearSelected = undefined;
    this.countrySelected = "global";

}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

CarbondioxideVis.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 0, right: 30, bottom: 90, left: 65 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    // Scales and axes
    vis.x = d3.scaleBand()
        .rangeRound([0, vis.width])
        .paddingInner(0.2)
        .domain(d3.range(0,5));

    vis.y = d3.scaleLinear()
        .range([vis.height,0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // Axis title
    vis.svg.append("text")
        .attr("x", vis.width/2)
        .attr("y", vis.height+80)
        .attr("class", "graphLabels")
        .text("Source of Emissions");


    // (Filter, aggregate, modify data)
    vis.wrangleData();
}

/*
 * Data wrangling
 */

CarbondioxideVis.prototype.wrangleData = function(){
    var vis = this;

    //*** TO-DO ***
	// Create a dictionary that stores co2 emission by type
    // ...
    let typesOfEmission = {"cement_co2": 0, 
                            "coal_co2": 0,
                            "flaring_co2": 0,
                            "gas_co2": 0,
                            "oil_co2": 0}
    
	// Iterate over each country and fill array
	// ...
    let tempData = Object.values(this.filteredData);
    // console.log(this.filteredData);
    // console.log(vis.yearSelected);
    tempData.forEach(function(country){
        if (vis.countrySelected == "global" || country.iso_code == vis.countrySelected) {
            country.data.forEach((year, i) => {
                if (vis.yearSelected == undefined) {
                    Object.keys(typesOfEmission).forEach(typeName => {
                        if (year[typeName] != undefined) {
                            typesOfEmission[typeName] += year[typeName]}
                    });
                } else {
                    if (year.year == vis.yearSelected) {
                        Object.keys(typesOfEmission).forEach(typeName => {
                            if (year[typeName] != undefined) {
                                typesOfEmission[typeName] += year[typeName]}
                        });
                    }
                }
            });
        }
    });
    let COEmissions = [];
    Object.entries(typesOfEmission).forEach(([key, val]) => {
        COEmissions.push({"type": key, "emission": val});
    });
    //console.log(COEmissions);

    vis.displayData = COEmissions;
	// Update the visualization
	vis.updateVis();
}



/*
 * The drawing function
 */

CarbondioxideVis.prototype.updateVis = function(){
	var vis = this;

    // Update domains
	vis.y.domain([0, d3.max(vis.displayData.map(d => d.emission))]);

    var bars = vis.svg.selectAll(".bar")
        .data(this.displayData)

    bars.enter().append("rect")
        .attr("class", "bar")

        .merge(bars)
        .transition()
        .attr("width", vis.x.bandwidth())
        .attr("height", function(d){
            //console.log(d.emission);
            return vis.height - vis.y(d.emission);
        })
        .attr("x", function(d, i){
            return vis.x(i);
        })
        .attr("y", function(d){
            return vis.y(d.emission);
        })

    bars.exit().remove();

    // Call axis function with the new domain
    vis.svg.select(".y-axis").call(vis.yAxis);

    // *** TO-DO ***
    // Update x-axis tick values to something more meaningful
    // console.log(vis.displayData);
    var titles = vis.displayData.map(d => d.type);
    vis.svg.select(".x-axis").call(vis.xAxis)
            .selectAll("text")  
                .text(function(d, i){
                    return titles[i];
                })
                .attr("text-anchor", "end")
                .attr("transform", "rotate(315)");
}


CarbondioxideVis.prototype.onSelectionChange = function(selectionStart, selectionEnd){
	var vis = this;
    
    // *** TO-DO ***
    // Filter data depending on selected time period (brush)

    vis.yearSelected = selectionStart;

    // console.log(vis.filteredData);

	vis.wrangleData();
    
}

CarbondioxideVis.prototype.onCountryChange = function(countryCode){
	var vis = this;
    
    // *** TO-DO ***
    // Filter data depending on selected time period (brush)

    vis.countrySelected = countryCode;

	vis.wrangleData();
    
}
