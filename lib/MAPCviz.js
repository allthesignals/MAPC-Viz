d3.chart("BaseChart", {

	initialize: function () {
    this._margin = {top: 20, right: 20, bottom: 60, left: 40};
    this._width  = this.base.attr('width') ? this.base.attr('width') - this._margin.left - this._margin.right : parseInt(d3.select('.charts').style('width'), 10);
    this._height = this.base.attr('height') ? this.base.attr('height') - this._margin.top - this._margin.bottom : parseInt(d3.select('.charts').style('height'), 10);

	    this.updateContainerWidth();
	    this.updateContainerHeight();

		this.base.append('g')
			.attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')');
	},

  updateContainerWidth: function() { this.base.attr('width', this._width + this._margin.left + this._margin.right); },

  updateContainerHeight: function() { this.base.attr('height', this._height + this._margin.top + this._margin.bottom); },

  width: function(newWidth) {
    if (arguments.length === 0) {
      return this._width;
    }

    // only if the width actually changed:
    if (this._width !== newWidth) {

      var oldWidth = this._width;

      this._width = newWidth;

      // set higher container width
      this.updateContainerWidth();

      // trigger a change event
      this.trigger('change:width', newWidth, oldWidth);
    }

    // always return the chart, for chaining magic.
    return this;
  },

  height: function(newHeight) {
    if (arguments.length === 0) {
      return this._height;
    }

    var oldHeight = this._height;

    this._height = newHeight;

    if (this._height !== oldHeight) {

      this.updateContainerHeight();

      this.trigger('change:height', newHeight, oldHeight);
    }

    return this;
  },

	wrap: function(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
	}
});

d3.chart("BaseChart").extend("BarChart", {

  initialize: function() {
    var chart = this;

    chart.xScale = d3.scale.ordinal().rangeRoundBands([0, chart.width()], 0.1);
    chart.yScale = d3.scale.linear().range([chart.height(), 0]);
    chart.color = d3.scale.category10();
    chart.duration = 500;

    chart.on('change:width', function(newWidth) {
      chart.xScale.rangeRoundBands([0, newWidth], 0.1);
    });

    chart.on('change:height', function(newHeight) {
      chart.yScale.range([newHeight, 0]);
    }); 

    chart.areas = {};

    chart.layers = {};

    chart.areas.yAxisLayer = chart.base.select('g').append('g')
      .classed('ylabels', true)

    chart.layers.bars = chart.base.select('g').append('g')
      .classed('bars', true)

    // create a layer of circles that will go into
    // a new group element on the base of the chart
    chart.layer('bars', chart.layers.bars, {

      // select the elements we wish to bind to and
      // bind the data to them.
      dataBind: function(data) {

				var yAxis = d3.svg.axis()
				    .scale(chart.yScale)
				    .tickSize(-(chart.width()), 0, 0)
				    .orient("left")
				    .tickFormat(d3.format(".2s"));

			  chart.areas.yAxisLayer
			      .call(yAxis)
			    .append("text")
			      .attr("transform", "rotate(-90)")
			      .attr("y", -35)
			      .attr("dy", ".71em")
			      .style("text-anchor", "end")
			      .text("Percent");

		    var xAxis = d3.svg.axis()
			    .scale(chart.xScale)
			    .orient("bottom");

				chart.base.select('g').append('g')
							.classed('x axis',true)
							.attr("transform", "translate(0," + chart.height() + ")")
				      .call(xAxis)
				      .selectAll("text")
				      .call(chart.wrap, 50)

	    return this.selectAll('.bar')
	      .data(data);
      },

      // insert actual rects
		  insert: function() {
		    return this.append('rect')
		      .attr('class', function(d,i){
		      	return "bar-" + i;
		      });
		  },


      // define lifecycle events
      events: {
        'enter': function() {
          var chart = this.chart();

          this.attr('x', function(d) { return chart.xScale(d.name); })
			      .attr("title", function(d) { return d.name })
			      .attr("data-content", function(d) { return  "Estimate: " + d.value + '%' })
            .attr('y', function(d) { return chart.yScale(0); })
            .attr('fill', function(d) {return chart.color(d.name);})
            .attr('width', chart.xScale.rangeBand())
            .attr('height', 0);
        },

        'enter:transition': function() {
          var chart = this.chart();

          this.duration(chart.duration)
            .attr('y', function(d) { return chart.yScale(d3.max([0, d.value])); })
            .attr('height', function(d) { return Math.abs(chart.yScale(d.value) - chart.yScale(0)); });
        }
      }
    });

	  $(document).ready(function () {
	      $("svg rect").popover({
	          'container': 'body',
	          'placement': 'right',
	          'trigger': 'hover',
	          'html': true
	      });
	  });

  },

  // set/get the color to use for the circles as they are
  // rendered.
  transform: function(data) {
    var chart = this;

    // // update the scales
    chart.xScale.domain(data.map(function(d) { return d.name; }));
    chart.yScale.domain(d3.extent(data, function(d) {return d.value;}));

    return data;
  }
});

d3.chart('BaseChart').extend('GroupedBarChart', {
  initialize : function() {
    var chart = this;
 
    chart.xScale = d3.scale.ordinal()
    	.rangeRoundBands([0, chart.width()], 0.1);
    chart.x1Scale = d3.scale.ordinal();
    chart.yScale = d3.scale.linear()
    	.range([chart.height(), 0]);
    chart.color = d3.scale.category10();
    chart.duration = 500;

	  chart.yAxis = d3.svg.axis()
	    .scale(chart.yScale)
	    .tickSize(-chart.width(), 0, 0)
	    .orient("left")
	    .tickFormat(d3.format(".2s"));
 
    chart.on("change:width", function(newWidth) {
      chart.xScale.rangeRoundBands([0, newWidth], 0.1);
    });
    chart.on("change:height", function(newHeight) {
      chart.yScale.range([newHeight, 0]);
    });
 

    chart.areas = {};

    // cache for selections that are layer bases.
    chart.layers = {};

    chart.areas.yAxisLayer = chart.base.select('g').append('g')
      .classed('ylabels', true)

    // -- actual layers
    chart.layers.bars = chart.base.select('g').append('g')
      .classed('bars', true)
 
    chart.layer('bars', chart.layers.bars, {
      dataBind: function(data) {
        var chart = this.chart();
 
				var yAxis = d3.svg.axis()
				    .scale(chart.yScale)
				    .tickSize(-(chart.width()), 0, 0)
				    .orient("left")
				    .tickFormat(d3.format(".2s"));

			  chart.areas.yAxisLayer
			      .call(yAxis)
			    .append("text")
			      .attr("transform", "rotate(-90)")
			      .attr("y", -35)
			      .attr("dy", ".71em")
			      .style("text-anchor", "end")
			      .text("Percent");
 
		    var xAxis = d3.svg.axis()
			    .scale(chart.xScale)
			    .orient("bottom");

				chart.base.select('g').append('g')
							.classed('x axis',true)
							.attr("transform", "translate(0," + chart.height() + ")")
				      .call(xAxis)
				      .selectAll("text")
				      .call(chart.wrap, chart.xScale.rangeBand())

        // Bind the data
        return this.selectAll('.category')
          .data(data);
      },
 
      insert: function() {
        var chart = this.chart();
 
        // Append the bars
        return this.append('g')
          .attr('class', 'category');
      },
 
      events: {
 
        "enter": function() {
          var chart = this.chart();
 
          this.attr("transform", function(d, i) {return "translate(" + chart.xScale(d.category) + ",0)"; })
            .selectAll(".bar")
            .data(function(d) {return d.values;})
            .enter()
          .append("rect")
			      .attr("title", function(d) { return d.name })
			      .attr("data-content", function(d) { return  "Estimate: " + d.value + '%' })
            .attr('class', 'bar')
            .attr("width", chart.x1Scale.rangeBand())
            .style("fill", function(d) { return chart.color(d.name); })
            .attr("x", function(d) { return chart.x1Scale(d.name); })
            .attr("y", chart.height())
            .attr("height", 0)
            ;
        },
 
        "merge:transition": function() {
          var chart = this.chart();
 
          this.duration(chart.duration)
            .attr("transform", function(d, i) {return "translate(" + chart.xScale(d.category) + ",0)"; })
            .selectAll(".bar")
            .attr("width", chart.x1Scale.rangeBand())
            .attr("x", function(d) { return chart.x1Scale(d.name); })
            .attr("y", function(d, i) { return chart.yScale(d.value); })
            .attr("height", function(d, i) { return chart.height() - chart.yScale(d.value); });
        }
      },



    });

		  $(document).ready(function () {
		      $("svg rect").popover({
		          'container': 'body',
		          'placement': 'right',
		          'trigger': 'hover',
		          'html': true
		      });
		  });


    },

    transform: function(data) {
      var _data = data;
      var chart = this;
      
      var values = d3.keys(_data[0]).filter(function(key) { return key !== "category"; });
      _data.forEach(function(d) {
        d.values = values.map(function(name) { return {name: name, value: +d[name]}; });
      });

      chart.xScale.domain(_data.map(function(d) { return d.category; }));
      chart.x1Scale.domain(values).rangeRoundBands([0, chart.xScale.rangeBand()]);
      chart.yScale.domain([0, d3.max(_data, function(d) { return d3.max(d.values, function(d) { return d.value; }); })]);

      return data;
  }
});