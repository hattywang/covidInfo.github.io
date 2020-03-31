// <!-- https://bl.ocks.org/wboykinm/dbbe50d1023f90d4e241712395c27fb3#statesdata.csv -->
// <!-- https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2 -->

//Width and height of map
var width = 960;
var height = 500;
		active = d3.select(null);
		active.text

var lowColor = '#edd6d1'
var highColor = '#ed5f64'

// D3 Projection
var projection = d3.geoAlbersUsa()
  .translate([width / 2, height / 2]) // translate to center of screen
  .scale([1000]); // scale things down so see entire US

	var zoom = d3.zoom()
	    // no longer in d3 v4 - zoom initialises with zoomIdentity, so it's already at origin
	    // .translate([0, 0])
	    // .scale(1)
	    .scaleExtent([1, 8])
	    .on("zoom", zoomed);

// Define path generator
var path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
  .projection(projection); // tell path generator to use albersUsa projection

//Create SVG element and append map to the SVG
var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
	.on("click", stopped, true);

	svg.append("rect")
	    .attr("class", "background")
	    .attr("width", width)
	    .attr("height", height)
	    .on("click", reset);

var g = svg.append("g");

svg
    .call(zoom);

// Load in my states data!
d3.csv("statesdata.csv", function(data) {
	var dataArray = [];
	for (var d = 0; d < data.length; d++) {
		dataArray.push(parseFloat(data[d].value))
	}
	var minVal = d3.min(dataArray)
	var maxVal = d3.max(dataArray)
	var ramp = d3.scaleLog().domain([minVal,maxVal]).range([lowColor,highColor])

  // Load GeoJSON data and merge with states data
  d3.json("us-states.json", function(json) {
		console.log(data);
    // Loop through each state data value in the .csv file
    for (var i = 0; i < data.length; i++) {

      // Grab State Name
      var dataState = data[i].state;

      // Grab data value
      var dataValue = data[i].value;

      // Find the corresponding state inside the GeoJSON
      for (var j = 0; j < json.features.length; j++) {
        var jsonState = json.features[j].properties.name;

        if (dataState == jsonState) {

          // Copy the data value into the JSON
          json.features[j].properties.value = dataValue;

          // Stop looking through the JSON
          break;
        }
      }
    }

    // Bind the data to the SVG and create one path per GeoJSON feature
    g.selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
			.attr("class","feature")
			.on("click",clicked)
      .style("stroke", "#fff")
      .style("stroke-width", "1")
      .style("fill", function(d) { return ramp(d.properties.value) });

			g.selectAll("text")
	    .data(json.features)
	    .enter()
	    .append("svg:text")
	    .text(function(d){
	        return d.properties.abbr+": "+d.properties.value;
	    })
	    .attr("x", function(d){
	        return path.centroid(d)[0];
	    })
	    .attr("y", function(d){
	        return  path.centroid(d)[1];
	    })
	    .attr("text-anchor","middle")
	    .attr('font-size','3pt');

		// add a legend
		var w = 140, h = 300;

		var key = d3.select("body")
			.append("svg")
			.attr("width", w)
			.attr("height", h)
			.attr("class", "legend");

		var legend = key.append("defs")
			.append("svg:linearGradient")
			.attr("id", "gradient")
			.attr("x1", "100%")
			.attr("y1", "0%")
			.attr("x2", "100%")
			.attr("y2", "100%")
			.attr("spreadMethod", "pad");

		legend.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", highColor)
			.attr("stop-opacity", 1);

		legend.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", lowColor)
			.attr("stop-opacity", 1);

		key.append("rect")
			.attr("width", w - 100)
			.attr("height", h)
			.style("fill", "url(#gradient)")
			.attr("transform", "translate(0,10)");

		var y = d3.scaleLinear()
			.range([h, 0])
			.domain([minVal, maxVal]);

		var yAxis = d3.axisRight(y);

		key.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(41,10)")
			.call(yAxis)
  });
});
function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
      .duration(750)
      // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
      .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition()
      .duration(750)
      // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
      .call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
}

function zoomed() {
  g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
  // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
  g.attr("transform", d3.event.transform); // updated for d3 v4
}
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}
