
/*
 * gasVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data			    -- the actual data
 */

GasVis = function(_parentElement, _data){
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

GasVis.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 0, right: 30, bottom: 75, left: 65 };

    // console.log($("#" + vis.parentElement).width());
    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

    vis.radius = 0.35 * vis.width;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (vis.width/2 + vis.margin.left) + "," 
                + (vis.height/2 + vis.margin.top) + ")");

    // generate donut shape
    vis.arc = d3.arc()
        .innerRadius(vis.radius * 0.5)
        .outerRadius(vis.radius * 0.8)

    vis.outerArc = d3.arc()
        .innerRadius(vis.radius * 0.9)
        .outerRadius(vis.radius * 0.9)

    // Axis title
    vis.svg.append("text")
        .attr("x", 0)
        .attr("y", 130)
        .attr("class", "graphLabels")
        .text("Greenhouse Gasses");


    // (Filter, aggregate, modify data)
    vis.wrangleData();
}

/*
 * Data wrangling
 */

GasVis.prototype.wrangleData = function(){
    var vis = this;

    //*** TO-DO ***
	// Create a dictionary that stores co2 emission by type
    // ...
    let emissionByGas = {"co2": 0, 
                        "methane": 0,
                        "nitrous_oxide": 0};
    
	// Iterate over each country and fill array
	// ...
    let tempData = Object.values(this.filteredData);
    // console.log(this.filteredData);
    // console.log(vis.yearSelected);

    tempData.forEach(function(country){

        if (vis.countrySelected == "global" || country.iso_code == vis.countrySelected) {
            // console.log("here", vis.countrySelected);
            country.data.forEach((year, i) => {
                if (vis.yearSelected == undefined) {
                    Object.keys(emissionByGas).forEach(typeName => {
                        if (year[typeName] != undefined) {
                            emissionByGas[typeName] += year[typeName]}
                    });
                } else {
                    if (year.year == vis.yearSelected) {
                        Object.keys(emissionByGas).forEach(typeName => {
                            if (year[typeName] != undefined) {
                                emissionByGas[typeName] += year[typeName]}
                        });
                    }
                }
            });
        }
    });

    vis.displayData = emissionByGas;
	// Update the visualization
	vis.updateVis();
}



/*
 * The drawing function
 */

GasVis.prototype.updateVis = function(){
	var vis = this;

    var pie = d3.pie();

    var data = pie(Object.values(vis.displayData));
    // console.log(data);
    var slices = vis.svg.selectAll('.slice')
        .data(data)
        .attr('d', vis.arc);
    
    slices.enter().append('path')
        .attr('class', 'slice')
        .attr('d', vis.arc)
        // .attr('fill', "#93bebf" )
        .style("opacity", function(d,i) {
            // console.log(1.0 * (i+1)/3.0);
            return 1.0 * (3-i)/3.0;
        })
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    var lines = vis.svg.selectAll('.line')
        .data(data)
        .attr('points', function(d) {
            var posA = vis.arc.centroid(d) 
            var posB = vis.outerArc.centroid(d) 
            var posC = vis.outerArc.centroid(d); 
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 
            posC[0] = vis.radius * 0.95 * (midangle < Math.PI ? 1 : -1); 
            return [posA, posB, posC]
        });
        
    lines.enter().append('polyline')
        .attr('class', 'line')
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr("opacity", 0.3)
        .attr('points', function(d) {
            var posA = vis.arc.centroid(d) 
            var posB = vis.outerArc.centroid(d) 
            var posC = vis.outerArc.centroid(d); 
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 
            posC[0] = vis.radius * 0.95 * (midangle < Math.PI ? 1 : -1); 
            return [posA, posB, posC]
        });

    var labels = vis.svg.selectAll('.label')
        .data(data)
        .attr('transform', function(d) {
            var pos = vis.outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = vis.radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        });

    labels.enter().append('text')
        .attr('class', 'label')
        .text( function(d, i) { return Object.keys(vis.displayData)[i] } )
        .attr('transform', function(d) {
            var pos = vis.outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = vis.radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style('text-anchor', function(d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            return (midangle < Math.PI ? 'start' : 'end')
        })
}


GasVis.prototype.onSelectionChange = function(selectionStart, selectionEnd){
	var vis = this;
    
    // *** TO-DO ***
    // Filter data depending on selected time period (brush)

    vis.yearSelected = selectionStart;

	vis.wrangleData();
    
}


GasVis.prototype.onCountryChange = function(countryCode){
	var vis = this;
    
    // *** TO-DO ***
    // Filter data depending on selected time period (brush)

    vis.countrySelected = countryCode;

	vis.wrangleData();
    
}
