/*
 * CountVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data			    -- the actual data: globalData
 */

CountVis = function(_parentElement, _data, _myEventHandler){
	this.parentElement = _parentElement;
	var temp = [];
	Object.entries(_data).forEach( ([key, val])  => {
		temp.push({"year": key, "emission": val})
	});
	//console.log(temp);
	this.data = temp;
	this.myEventHandler = _myEventHandler;

	this.formatDate = d3.timeFormat("%Y");

	this.currentYear = 2000;

	this.countrySelected = "global";

	this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

CountVis.prototype.initVis = function(){
	var vis = this;

	vis.margin = { top: 40, right: 20, bottom: 60, left: 60 };

	vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
	vis.height = 250 - vis.margin.top - vis.margin.bottom;

	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
		.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scaleTime([new Date("1990"), new Date("2020")], [0, vis.width]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

	// Set domains
	var minMaxY= [100000, d3.max(vis.data.map(d => d.emission))+10000];
	vis.y.domain(minMaxY);
	// vis.x.domain([1990, 2020]);


    vis.xAxis = d3.axisBottom(vis.x)
		.tickFormat(d3.timeFormat("%Y"))
		.ticks(30);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y)
        .ticks(6);

	vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

	vis.svg.append("g")
			.attr("class", "y-axis axis");

	// Axis title
	vis.svg.append("text")
			.attr("x", 0)
			.attr("y", -15)
			.text("Emission (GtC)")
			.attr("class", "graphLabels")
			.attr("fill", "black");

	// Append a path for the area function, so that it is later behind the brush overlay
	vis.timePath = vis.svg.append("path")
			.attr("class", "area area-time");

    // Define the D3 path generator
    vis.area = d3.area()
        .curve(d3.curveLinear)
        .x(function(d) {
            return vis.x(new Date(d.year));
        })
        .y0(vis.height)
        .y1(function(d) { return vis.y(d.emission); });
	
	vis.line = d3.line()
		.x(function(d) {return vis.x(new Date(d.year));})
		.y(function(d) { return vis.y(d.emission);});

	// *** TO-DO ***
	// Initialize brushing component
	vis.currentBrushRegion = null;

	vis.brush = d3.brushX()
		.extent([[0, 0], [vis.width, vis.height]])
		.on("start brush", brushed)
		.on("end", slidedEnd);

	function brushed(event) 
	{
		const selection = event.selection;

		var year = parseInt(vis.formatDate(vis.x.invert(selection[0])));

		if(year != vis.currentYear)
		{
			if(year == 1989)
			{
				year = 1990;
			}
			else if(year>=2020)
			{
				year = 2019;
				console.log("data unavailable");
			}

			var temp = year+1;
			document.getElementById("year").innerHTML = "Time Selected: <span>" + year + " - " + temp+"</span>";

			$(vis.myEventHandler).trigger("selectionChanged", [year,year]);

			vis.currentYear = year;
		}
	}

	function slidedEnd(event)
	{
		const selection = event.selection;

		//move brush to correct location

		// vis.svg.call(vis.brush.move, [vis.x(new Date(String(year))), vis.x(new Date(String(year+1)))]);

		// 	var year = parseInt(vis.formatDate(vis.x.invert(selection[0])));
		// 	console.log(year);

		// if(selection != null)
		// {
		// 	var year = parseInt(vis.formatDate(vis.x.invert(selection[0])));

		// 	console.log(year);
		// 	d3.select(".brush")
		// 		.call(vis.brush.move, [vis.x(new Date(String(year))), vis.x(new Date(String(year+1)))]);
		// }

	}
	
	vis.wrangleData();
}



/*
 * Data wrangling
 */

CountVis.prototype.wrangleData = function(){
	var vis = this;

	this.displayData = this.data;
	//console.log(vis.data);

	// Update the visualization
	vis.updateVis();
}

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

CountVis.prototype.updateVis = function(){
	var vis = this;

	vis.timePath
		.datum(vis.displayData)
		.attr("d", vis.area)
		.attr("clip-path", "url(#clip)");

	vis.svg.append("path")
		.datum(vis.displayData)
		.attr("class", "line")
		.attr("fill", "none")
		.attr("stroke", "#69b3a2")
		.attr("stroke-width", 4)
		.attr("d", vis.line)
		.attr("clip-path", "url(#clip)");
	
	// Call axis functions with the new domain 
	vis.svg.select(".x-axis").call(vis.xAxis);
	vis.svg.select(".y-axis").call(vis.yAxis);

	// Append brush component here
	vis.svg.append("g")
		.attr("class", "brush")
		.call(vis.brush)
		.call(vis.brush.move, [vis.x(new Date("2000")), vis.x(new Date("2001"))])
		.call(g => g.select(".overlay")
          .datum({type: "selection"})
          .on("mousedown touchstart", beforebrushstarted));
		// .call(g => g.select(".selection")
		//   .on("brush", afterBrushed));


	function beforebrushstarted(event) 
	{
		const dx = vis.x(new Date("2001")) - vis.x(new Date("2000")); // Use a fixed width when recentering.

		const [[cx]] = d3.pointers(event);
		const [x0, x1] = [cx - dx / 2, cx + dx / 2]; //center

		const [X0, X1] = vis.x.range();

		var year = parseInt(vis.formatDate(vis.x.invert(cx)));

		if(year == 1989)
		{
			year = 1990;
		}
		else if(year>=2020)
		{
			year = 2019;
			console.log("data unavailable");
		}

		$(vis.myEventHandler).trigger("selectionChanged", [year,year]);

		d3.select(this.parentNode)
			.call(vis.brush.move, x1 > X1 ? [X1 - dx, X1] 
				: x0 < X0 ? [X0, X0 + dx] 
				: [vis.x(new Date(String(year))), vis.x(new Date(String(year+1)))]);
		
		var temp = year+1;
		document.getElementById("year").innerHTML = "Time Selected: <span>"+year + " - " + temp +"</span>";	   
	}

	// removes handle to resize the brush
    d3.selectAll('.brush>.handle').remove();

    // removes crosshair cursor
    // d3.selectAll('.brush>.overlay').remove();
}

CountVis.prototype.onSelectionChange = function(selectionStart, selectionEnd)
{
	// var vis = this;
    // console.log(selectionStart);
	// console.log(selectionEnd);

	// // *** TO-DO ***
	// // Filter data depending on selected time period (brush)
	// // vis.svg.select(".date-range")
	// // 		.text(selectionStart.toDateString() + " to " + selectionEnd.toDateString())
	// // 		.attr("opacity", 1);


	// vis.wrangleData();
}

CountVis.prototype.onCountryChange = function(countryCode){
	var vis = this;
    
    // *** TO-DO ***
    // Filter data depending on selected time period (brush)

    vis.countrySelected = countryCode;

	vis.wrangleData();
    
}

