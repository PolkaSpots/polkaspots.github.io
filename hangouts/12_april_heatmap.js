var Heatmap = (function() {
  var _this = {
    nExponent : 1.1,
    nScalingConstant : 1/10,
    noiseScalingConstant : 0.0002,
    noiseLimit: 0.0005,
    circleSize: 2,
    circleColor: "#fe52ab",
    circleOpacity: 0.3,
    frameRate: 750,

    startTime: 1397260800000,
    interval: 60*60*1000,

    dataFile: "data/unique_user_counts_per_ap_per_hour_geo_2014-04-12.csv",

    tileUrl: 'https://{s}.tiles.mapbox.com/v3/polkaspots.g8m4acg0/{z}/{x}/{y}.png',
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',

    init: function() {
      _this.setupMap();
      _this.getData(_this.render);
    },

    setupMap: function() {
      _this.map = L.map('map').setView([52.922, -1.477], 17);
      L.tileLayer(_this.tileUrl, {
          attribution: _this.attribution,
          maxZoom: 18
      }).addTo(_this.map);

    },

    getData: function(callback) {
      d3.text(_this.dataFile, function(text) {
        var rows = d3.csv.parseRows(text);
        _this.data = _.reduce(rows, function(m, row) {
          var idx = (Date.parse(row[2]) - _this.startTime)/_this.interval
          var lat = parseFloat(row[0]);
          var lng = parseFloat(row[1]);
          var n = parseInt(row[3]);
          if(!m[idx]) m[idx] = [];
          m[idx].push([lat, lng, n])
          return m
        }, []);
        callback();
      })
    },

    render : function() {
      var hour = 12;
      $("#start").click(function() {

        _this.draw_it(hour, function(intervalId) {
          _this.pause_it(intervalId)
        })

      });

      _this.draw_it(hour, function(intervalId) {
        _this.pause_it(intervalId)
      })
    },

    pause_it : function(intervalId) {
      $("#pause").click(function() {
        window.clearInterval(intervalId);
      })
    },

    draw_it : function(hour, callback) {
      var data = _this.data.slice(0);
      var points = _this.plotPoints(data.shift());
      var intervalId = window.setInterval(function() {
        _this.removePoints(points);
        points = _this.plotPoints(data.shift());
        hour += 1;
        _this.displayHour(hour);
        if(data.length == 0) {
         hour = -1;
         data = _this.data.slice(0);
        }
      }, _this.frameRate)
      callback(intervalId)
    },


    plotPoints: function(rows) {
      return _.flatten(_.map(rows, function(row) {
        return _this.plotPoint.apply(this, row);
      }));
    },

    removePoints: function(points) {
      _.each(points, function(point) {
        _this.map.removeLayer(point);
      });
    },

    plotPoint: function(lat, lng, n) {
     var nCircles = Math.floor(Math.pow(n, _this.nExponent)*_this.nScalingConstant)
     return _.times(nCircles, function() {
        var circle = L.circle([_this.noisy(lat, n), _this.noisy(lng, n)], _this.circleSize, {
          color: null,
          fillColor: _this.circleColor,
          fillOpacity: _this.circleOpacity,
        });
        circle.addTo(_this.map);
        return circle;
     })
    },

    displayHour: function(hour) {
      var hourDisplay = hour % 12;
      if(hourDisplay==0) hourDisplay = 12;
      var period = hour / 12 >= 1 ? "pm" : "am";
      $("#hour").html(hourDisplay + period)
    },

    noisy: function(x, n) {
      var nFactor = n ? n * _this.noiseScalingConstant : 1;
      return x + _this.randomGaussian() * _this.noiseLimit * nFactor;
    },

    randomGaussian: function() {
      var u1 = Math.random();
      var u2 = Math.random();
      return Math.sqrt(-2*Math.log(u1))*Math.sin(2 * Math.PI * u2);
    }
  }
  return _this;
}());

$(document).ready(function() {
  Heatmap.init()
});
