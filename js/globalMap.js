

GlobalMap = function (_parentElement, _data, _mapPosition, _countryEventHandler) {

	this.parentElement = _parentElement;
	this.data = _data;
	this.mapPosition = _mapPosition;
	this.yearSelected = "2000";
	this.countryEventHandler = _countryEventHandler;
	this.tmp = null;
	this.colorScale = d3.scaleLinear().domain([0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10000]).range(["#0066CC", "#0080FF", "#3399FF", "#66B2FF", "#99ccff", "#CCE5FF", "#ffcccc", "#ff9999", "#ff6666", "#ff3333", "#FF0000", "#CC0000"]);
	this.initVis();
}


/*
 *  Initialize Global map
 */

GlobalMap.prototype.initVis = function () {
	var vis = this;
	L.Icon.Default.imagePath = 'img/';
	vis.map = L.map('global-map').setView(vis.mapPosition, 2);
	var southWest = L.latLng(-120, -235),
		northEast = L.latLng(120, 235),
		bounds = L.latLngBounds(southWest, northEast);
	vis.map.setMaxBounds(bounds);
	vis.map.setMinZoom(2);

	var legendQuantile = d3.legendColor()
		.shapeWidth(90)
		.cells([0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10000])
		.orient('horizontal')
		.scale(vis.colorScale)
		.title("Emission (Unit: Gigaton)");
	vis.width = $("#" + vis.parentElement).width();
	vis.height = 100;
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
		.attr("width", vis.width)
		.attr("height", vis.height)
		.append("g").call(legendQuantile).attr("transform", "translate(" + 20 + "," + 30 + ")");


	$("#reset").on("click", function () {
		vis.map.closePopup();
		vis.map.setView(vis.mapPosition, 2);
		$(vis.countryEventHandler).trigger("selectCountry", "global");
		
		document.getElementById("regionSelected").innerHTML = "Region Selected: <span>World</span>";
	});
	L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=dc54481f-3d11-4720-937a-46d760eeee43', {
		maxZoom: 20,
		attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
	}).addTo(vis.map);


	// Add empty layer groups for the markers / map objects
	vis.myLayer = L.geoJSON(false, {
		style: function (feature) {

			//var tmp = data[1].find(e=>{return e.iso_code == feature.id});

			for (const [key, value] of Object.entries(vis.gasData)) {
				if (value.iso_code == feature.id) {
					vis.tmp = value;
					break;
				}

			}
			if (vis.tmp == null) {
				return { color: vis.colorScale(0) };
			} else {
				vis.tmp_arr = vis.tmp.data.find(e => { return e.year == vis.yearSelected });
				vis.total_val = (vis.tmp_arr.co2 || 0) + (vis.tmp_arr.methane || 0) + (vis.tmp_arr.nitrous_oxide || 0);
				return { color: vis.colorScale(vis.total_val) };
			}


		},
		onEachFeature: function (feature, layer) {
			var target = null
			for (const [key, value] of Object.entries(vis.gasData)) {
				if (value.iso_code == feature.id) {
					target = value
					break;
				}
			}
			if (target == null) {
				layer.bindPopup('<h6>' + feature.properties.name +
					'</h6><p> Data Not Available </p>');
				layer.on({
					click: (e) => {
						vis.map.setView(e.latlng, 3.4);
						$(vis.countryEventHandler).trigger("selectCountry", "global");
					}
				});
			} else {
				if (target.data.find(e => { return e.year == vis.yearSelected }).co2 == null) {
					layer.bindPopup('<h6>' + feature.properties.name +
						'</h6><p> No Greenhouse Gas Emissions / Data Not Available</p>'
					);
					layer.on({
						click: (e) => {

							vis.map.setView(e.latlng, 3.4);
							$(vis.countryEventHandler).trigger("selectCountry", "global");
						}
					});
				} else {
					layer.bindPopup('<h6>' + feature.properties.name +
						' (Unit: Gigaton)</h6><p>Greenhouse Gas Emission: ' + parseFloat((vis.tmp_arr.co2 || 0) + (vis.tmp_arr.methane || 0) + (vis.tmp_arr.nitrous_oxide || 0)).toFixed(2) + '</p><p>CO2 Per Capita: '
						+ parseFloat((vis.tmp_arr.co2_per_capita || 0)).toFixed(2) + '</p><p>Methane Per Capita: ' +
						parseFloat((vis.tmp_arr.methane_per_capita || 0)).toFixed(2)
						+ '</p><p>Nitrous Oxide Per Capita: ' + parseFloat((vis.tmp_arr.nitrous_oxide_per_capita || 0)).toFixed(2) + '</p>'
					);
					layer.on({
						click: (e) => {
							vis.map.setView(e.latlng, 3.4);
							$(vis.countryEventHandler).trigger("selectCountry", feature.id);

							document.getElementById("regionSelected").innerHTML = "Region Selected: <span>"+ feature.properties["name"]+"</span>";

							// console.log(feature.properties["name"]);
						}
					});

				}
			}

		},
		weight: 1,
		fillOpacity: 0.5
	}).addTo(vis.map);

	vis.wrangleData();
}


/*
 *  Data wrangling
 */

GlobalMap.prototype.wrangleData = function () {
	var vis = this;



	var files = ["data/countries.geo.json"];
	var promises = [];

	files.forEach(function (url) {
		promises.push(d3.json(url))
	});


	Promise.all(promises).then(function (data) {
		vis.countryData = data[0];
		vis.gasData = vis.data;
		vis.updateVis();

	});

}


/*
 *  The drawing function
 */

GlobalMap.prototype.updateVis = function () {
	var vis = this;
	vis.myLayer.clearLayers();
	vis.myLayer.addData(vis.countryData);
	// vis.displayData.forEach((e, idx) => {

	// 	var tmpMarker = L.circle([e.lat, e.lon], 45, {
	// 		color: 'red',
	// 		fillColor: 'red',
	// 		fillOpacity: 1
	// 	}).bindPopup("<strong>" + e.name + "</strong><br/> Available Bikes: "
	// 		+ vis.statusData[idx].num_bikes_available
	// 		+ "<br> Available Docks: " + vis.statusData[idx].num_docks_available);
	// 	bikeStations.addLayer(tmpMarker);
	// });


}

GlobalMap.prototype.onSelectionChange = function (selectionStart, selectionEnd) {
	var vis = this;

	// *** TO-DO ***
	// Filter data depending on selected time period (brush)

	vis.yearSelected = selectionStart;


	vis.wrangleData();

}
