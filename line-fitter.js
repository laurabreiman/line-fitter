var lineFit = (function() {
    
    var exports = {};
    
////////////////////////////////// global variables 
    
    //d3 chart components
    var chart;
    
    var xMin = -10;
    var xMax = 10;
    var yMin = -10;
    var yMax = 10;
    
    var outer_height = 300;
    var outer_width = 300;

    var margin = { top: 20, right: 20, bottom: 20, left: 20 }
    var chart_width = outer_width - margin.left - margin.right;
    var chart_height = outer_height -margin.top - margin.bottom;
    
    var x_scale = d3.scale.linear().domain([xMin,xMax]).range([0,chart_width]);
    var y_scale = d3.scale.linear().domain([yMin,yMax]).range([chart_height,0]);
    
    var circ;
    
    
    //keeping track of data points
    var points = [];
    
    
////////////////////////////////// helper functions    

/////////////////////////////////// set up div functions
    
    function Model() {
        var pointList = []; //array of [x,y] arrays
        var currentCoeffs = []; //[a,b] where a and b are from y = ax + b
        
        function add_point(point){ // add a point
            pointList.push(point);
        }
        function get_point_list(){
            return pointList;
        }
        function change_line(newCoeffs){ //change the coefficients of the best fit line
            currentCoeffs = newCoeffs;
        }
        function change_a(a){
            currentCoeffs[0] = a;
        }
        function change_b(b){
            currentCoeffs[1] = b;
        }
        function getCoeffs(){ //return the coefficients of the current best fit line
            return currentCoeffs;
        }
        
        //sums the difference between where the point is and where the point would be on the line
        function findErrors(){
            var totalError = 0;
            var totalSquareError = 0;
            var maxError = findError(pointList[0])
            var minError = findError(pointList[0])
            for(var i=0; i<pointList.length; i++){
                iError = findError(pointList[i]); //error at the ith point
                totalError += iError;
                totalSquareError += Math.pow(iError,2);
                if(maxError < iError){
                    maxError = iError;
                }
                if(minError > iError){
                    minError = iError;
                }
            }
            return {error: totalError, maxError: maxError, minError: minError, squareError: totalSquareError};
        }
        
        //finds the vertical error between a point and the line
        function findError(point){
            var error = point[1]-lineAt(point[0]);
            return error;
        }
            
        //returns the y value of the line at a point
        function lineAt(x){
            return currentCoeffs[0]*x+currentCoeffs[1]
        }
            
        //finds the best fit for the points on the graph
        function bestFit(){
            var lineCoeffs; //coefficients of y=ax+b in the form [a,b]
            if(pointList.length <2){
                lineCoeffs = [0,0];
            }
            else if(pointList.length ==2){
                var x1 = pointList[0][0];
                var x2 = pointList[1][0];
                var y1 = pointList[0][1];
                var y2 = pointList[1][1];
                
                var a = (y2-y1)/(x2-x1);
                var b = y1 - a*x1;
                
                lineCoeffs = [a,b];
            }
            else{
                lineCoeffs = linear_regression(pointList);
            }
                
            return lineCoeffs;
        }
            //sums the errors of the points and returns optimized a and b for y = ax + b
        function linear_regression()
        {
            var i, x, y,
                sumx=0, sumy=0, sumx2=0, sumy2=0, sumxy=0,
                a, b;
            var count = pointList.length;
                
            for(i=0;i<pointList.length;i++)
            {   
                // this is our data pair
                x = pointList[i][0]; y = pointList[i][1]; 
        
                sumx += x;
                sumx2 += (x*x);
                sumy += y;
                sumy2 += (y*y);
                sumxy += (x*y);
            }
        
            // note: the denominator is the variance of the random variable X
            // the only case when it is 0 is the degenerate case X==constant
            var b = (sumy*sumx2 - sumx*sumxy)/(count*sumx2-sumx*sumx);
            var a = (count*sumxy - sumx*sumy)/(count*sumx2-sumx*sumx);
            
            return [a,b];
        }
        
        
        return {add_point: add_point, get_point_list: get_point_list, change_line: change_line, getCoeffs: getCoeffs, change_a: change_a, change_b: change_b, findErrors: findErrors, findError: findError, lineAt: lineAt, bestFit: bestFit, linear_regression: linear_regression};
    }
    
    function Controller(model) {
        function add_point_from_input(){
        }
        function change_best_fit_line(){
            var coeffs = model.bestFit(model.get_point_list())
            model.change_line(coeffs);
        }
        return {add_point_from_input: add_point_from_input, change_best_fit_line: change_best_fit_line};
    }
    
    function View(div,model,controller) {       
        div.append("<div class='row-fluid well'><h2>Line-Fitting</h2></div><div class='row-fluid'><div class='span6 graph well'></div><div class='span6 controls well'></div></div>");
        $(".controls").append("<div class='container-fluid'>x: <input class='x-adder'> y: <input class='y-adder'><button class = 'add-point'>Add Point</button><br></br><div class='row-fluid'><button class = 'plot-fit'>Plot Best-Fit</button> <span class='equation'>y=ax+b</span></div><div class='row-fluid'><button class = 'toggle-error'>Toggle Error Display</button><div class='row-fluid'><div class='span6'>a:<div class='a-slider'></div><div class='a-label'></div></div><div class='span6'>b:<div class='b-slider'></div><div class='b-label'></div></div></div><div class='row-fluid'><button class='spreadsheet'>Spreadsheet</button></div></div>");
        $(".graph").append("<div class='chart-container'></div><div class='labels'></div>");
        var aSlider = $(".a-slider").slider({ min: -10, max: 10, step: .1, slide: function( event, ui ) {
            turnErrorDisplayOff()
            model.change_a(ui.value);
            displayLine(model.getCoeffs());
            $('.a-label').html(ui.value);
            turnErrorDisplayOn()
            } });
        var bSlider = $(".b-slider").slider({ min: -10, max: 10, step: .1, slide: function( event, ui ) {
            turnErrorDisplayOff()
            model.change_b(ui.value);
            displayLine(model.getCoeffs());
            $('.b-label').html(ui.value);
            turnErrorDisplayOn()
                                            } });
        aSlider.slider("disable");
        bSlider.slider("disable");
        
        setupGraph();
        
         //takes coefficients to y=ax+b and displays the corresponding on the graph
        function displayLine(coefficients){
            chart.selectAll(".best-fit").data(coefficients).remove();

            var y1 = coefficients[0]*xMin+coefficients[1];
            var y2 = coefficients[0]*xMax+coefficients[1];
            
            chart.selectAll(".best-fit").data(coefficients).enter().append("line").attr("class", "best-fit").attr('x1', x_scale(xMin)).attr('x2', x_scale(xMax)).attr('y1', y_scale(y1)).attr('y2',y_scale(y2));
        }
        //adds a circular point of radius 2px at coordinates (x,y) to the svg canvas
        function addPointToGraph(x,y){
            chart.selectAll(".endpoint").data([0]).enter().append("circle")
                .attr("class", "datapoint")
                .attr("cx", x_scale(x))
                .attr("cy", y_scale(y))
                .attr("r", "4");
            model.add_point([x,y]);
        }
        
            
        //adds vertical bars from point to best-fit line (with color scale that displays how much error)
        function turnErrorDisplayOn(){
            var color_scale = d3.scale.linear()
                .domain([model.findErrors().minError, model.findErrors().maxError])
                .range(['#61A72D','#CC0000']);
        
            chart.selectAll(".error-line").data(model.get_point_list()).enter().append("line").attr("class", "error-line").attr('x1', function(d){return x_scale(d[0])}).attr('x2', function(d){ return x_scale(d[0])}).attr('y1', function(d){ return y_scale(d[1])}).attr('y2',function(d){ return y_scale(model.lineAt(d[0]))}).style("stroke", function(d) {return color_scale(model.findError(d)); });
        }
        
        //removes vertical bars from point to best-fit line
        function turnErrorDisplayOff(){
            chart.selectAll(".error-line").data(model.get_point_list()).remove();
        }
        
        //functionality to the buttons
        $('.add-point').on("click",function(){
            addPointToGraph(parseFloat($('.x-adder').val()),parseFloat($('.y-adder').val()));
        });
        
        $('.plot-fit').on("click",function(){
            controller.change_best_fit_line();
            var coefficients = model.getCoeffs();
            displayLine(coefficients);
            aSlider.slider("enable");
            aSlider.slider("option","value",coefficients[0]);
            $('.a-label').html(Math.round(coefficients[0]*100)/100);
            bSlider.slider("enable");
            bSlider.slider("option","value",coefficients[1]);
            $('.b-label').html(Math.round(coefficients[0]*100)/100);
            $('.equation').html("y="+Math.round(coefficients[0]*100)/100+"x+("+Math.round(coefficients[0]*100)/100+")");
        });
        
        $('.toggle-error').on("click",function(){
            $(this).toggleClass("selected");
            if($(this).hasClass("selected")){
                turnErrorDisplayOn();
            }
            else{
                turnErrorDisplayOff();
            }
        });
        
        return {displayLine: displayLine, addPointToGraph: addPointToGraph};
    }
    
    //set up svg with axes and labels
    function setupGraph(){

        chart = d3.select(".chart-container").append("svg").attr("class","chart").attr("height", outer_height).attr("width",outer_width).append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")").on("mousemove", function() { move(d3.mouse(this)); }).on("click",function(){click(d3.mouse(this))});
        
        function move(p2) {
            }
        function click(p2){
            chart.append("circle")
                .attr("cy",p2[1])
                .attr("cx",p2[0])
                .attr("fill","black")
                .attr("r","2");
            console.log(p2[0]-margin.left,p2[1]-margin.top);
            model.add_point([p2[0],p2[1]]);
        }
        chart.selectAll(".y-line").data(y_scale.ticks(10)).enter().append("line").attr("class", "y-line").attr('x1', 0).attr('x2', chart_width).attr('y1', y_scale).attr('y2',y_scale);
        
        chart.selectAll(".x-line").data(x_scale.ticks(10)).enter().append("line").attr("class", "x-line").attr('x1', x_scale).attr('x2', x_scale).attr('y1', 0).attr('y2',chart_height);
    
        chart.selectAll(".y-scale-label").data(y_scale.ticks(10)).enter().append("text").attr("class", "y-scale-label").attr("x",x_scale(0)).attr('y',y_scale).attr("text-anchor","end").attr("dy","0.3em").attr("dx","0.5em").text(String);
        
        chart.selectAll(".x-scale-label").data(x_scale.ticks(10)).enter().append("text").attr("class", "x-scale-label").attr("x",x_scale).attr('y',y_scale(0)).attr("text-anchor","end").attr("dy","0.3em").attr("dx","0.5em").text(String);

    }
    
    //setup main structure of app
    function setup(div) {

        var model = Model();
        var controller = Controller(model);
        var view = View(div, model, controller);
        
        var points = [[4,4],[1,1],[2,1],[-3,6]];
        for(var i =0; i<points.length; i++){
            view.addPointToGraph(points[i][0],points[i][1]);
        }
    }; 
    
    exports.setup = setup;
    
    return exports;
}());

$(document).ready(function() {
    lineFit.setup($('.line-fit'));
});