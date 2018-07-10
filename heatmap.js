class HeatMap{
	constructor(container){
		this.container = container;
		this.itemSize = 16;
        this.cellSize = this.itemSize - 1;
		this.valueFormat = d3.format(",");
        this.margin = {top: 0, right: 20, bottom: 20, left: 180};
          
    	this.width = 2000 - this.margin.right - this.margin.left;
       	this.height = 1000 - this.margin.top - this.margin.bottom;

       	this.canvas = this.container.attr("width", this.width)
        	.attr("height", this.height + this.margin.top + this.margin.bottom)
         	.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.canvas.append("g")
            .attr("class", "leftAxis");

        this.canvas.append("g")
            .attr("class", "rightAxis");
	
	  var xAxisTop = 50;
        this.topAxis = d3.select(".xaxis").append("svg")
        	.attr("width", this.width + this.margin.left + this.margin.right)
        	.attr("height", xAxisTop)
        	.append("g")
        	.attr("transform", "translate(" + this.margin.left + "," + (xAxisTop-1) + ")")
            .attr("class", "topAxis");

        this.currData = [];
        this.xAxis = undefined;
        this.rightYAxis = undefined;
        this.leftYAxis = undefined;
        this.colorScale = undefined;
        this.leftYScale = undefined;
        this.rightYScale = undefined;
        this.xScale = undefined;
        this.rightIds = undefined;
        this.leftValue = undefined;
        this.rowLength = 0;
        this.columnLength = 0;

	}

	setData(newData){
		this.currData = newData;
	}

	updateHeatMap(xAxisColumnName, leftYAxisColumnName, rightYAxisColumnName, colors, colorScaleColumn){

		this.setXAxis(xAxisColumnName);
		this.setRightYAxis(rightYAxisColumnName);
		this.setLeftYAxis(leftYAxisColumnName);
		this.setColorScale(colors, colorScaleColumn);

		
		this.container
		.attr("width", (this.rowLength * this.itemSize) + 110*3)
		.attr("height", (this.columnLength * this.itemSize) + 110);

		var cells = this.canvas.selectAll(".block");
		cells.remove(); //.exit().remove() não está funcionando

		var heatmap = this;
		
		var popoverOptions = {
			html : true,
			template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><div class="popover-content"></div></div>'
		};

		cells = this.canvas.selectAll(".block");
		cells.data(this.currData).enter().append('g')
			.attr("class", "block")
			.append('rect')
            .attr('class', 'cell')
            .attr('width', this.cellSize)
            .attr('height', this.cellSize)
            .attr('y', function(d) { 
            	return heatmap.rightYScale(d[rightYAxisColumnName]); 
            })
            .attr('x', function(d) { return heatmap.xScale(d[xAxisColumnName]); })
            .attr('fill', function(d) {
                if (d[colorScaleColumn] == 0){
                    return 'white';
                }
                return heatmap.colorScale(d[colorScaleColumn]);
            })
            .on("mouseover", function(d){
					$(this).attr('data-html',true);
                    $(this).attr('data-content',[
					    "<strong>" + d[leftYAxisColumnName] +" to " + d[rightYAxisColumnName] + " in " + d[xAxisColumnName] + "</strong>",
					    heatmap.valueFormat(d[colorScaleColumn])
				      ].join("<br>"));
                    $(this).popover('show');
		    }) 
		    .on("mouseleave", function (d){
			$(this).popover("hide");
		});

        d3.select(".rightAxis")
            .attr("transform", "translate(" + (this.rowLength * this.itemSize) + "," + 0 + ")")
            .call(this.rightYAxis)
            .selectAll('text')
            .attr('font-weight', 'normal');

        d3.select(".leftAxis")
            .call(this.leftYAxis)
            .selectAll('text')
            .attr('font-weight', 'normal');


        this.topAxis
            .call(this.xAxis)
            .selectAll('text')
            .attr('font-weight', 'normal')
            .style("text-anchor", "start")
            .attr("dx", ".8em")
            .attr("dy", ".5em")
            .attr("transform", function (d) {
                return "rotate(-65)";
            });
	}

	setXAxis(columnName){
		var elements = d3.set(this.currData.map(function( item ) { return item[columnName]; } )).values().sort();
		elements = [];
		for(var i=1960;i<=2017;i++) {
			elements.push((i+""));
		}
		this.rowLength = elements.length;
		this.xScale = d3.scaleBand()
            .domain(elements)
            .range([0, elements.length * this.itemSize]);

        this.xAxis = d3.axisTop()
             .scale(this.xScale)
            .tickFormat(function (d) {
                return d;
            });
	}

	setLeftYAxis(columnName){
		var elements = d3.set(this.currData.map(function( item ) { return item[columnName]; } )).values().sort();
        this.leftValue = elements[0];
		
		this.leftYScale = d3.scaleBand()
            .domain(this.rightIds)
            .range([0, this.columnLength * this.itemSize]);
            

        this.leftYAxis = d3.axisLeft()
            .scale(this.leftYScale)
            .tickFormat(function(d){
            	return elements[0];
            });
	}

	setRightYAxis(columnName){
		var elements = this.rightIds = d3.set(this.currData.map(function( item ) { return item[columnName]; } )).values().sort();
		this.columnLength = elements.length;
		this.rightYScale = d3.scaleBand()
            .domain(elements)
            .range([0, elements.length * this.itemSize]);


        this.rightYAxis = d3.axisRight()
            .scale(this.rightYScale)
            .tickFormat(function (d) {
                return d;
            });
	}

	setColorScale(colors, columnName){
		var min = d3.min(this.currData, function(item){
                return item[columnName];
            });
        var max = d3.max(this.currData, function(item){
                return item[columnName];
            });

        this.colorScale = d3.scaleQuantize()
        .range(colors)
        .domain([min,max]);
	}
}
