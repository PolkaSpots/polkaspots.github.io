var Heatmap = (function() {
  var _this = {

    scalingConstant: 10,
    circleColor: "#ff7200",
    circleOpacity: 0.3,
    frameRate: 250,

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
      var data = _this.data.slice(0);
      var points = _this.plotPoints(data.shift());
      var hour = 0;
      window.setInterval(function() {
        _this.removePoints(points);
        points = _this.plotPoints(data.shift());
        hour += 1;
        _this.displayHour(hour);
        if(data.length == 0) {
         hour = -1;
         data = _this.data.slice(0);
        }
      }, _this.frameRate)
    },

    plotPoints: function(rows) {
      return _.map(rows, function(row) {
        return _this.plotPoint.apply(this, row);
      });
    },

    removePoints: function(points) {
      _.each(points, function(point) {
        _this.map.removeLayer(point);
      });
    },

    plotPoint: function(lat, lng, n) {
      var circle = L.circle([lat, lng], n/_this.scalingConstant, {
        color: null,
        fillColor: _this.circleColor,
        fillOpacity: _this.circleOpacity,
      });
      circle.addTo(_this.map);
      return circle;
    },

    displayHour: function(hour) {
      var hourDisplay = hour % 12;
      if(hourDisplay==0) hourDisplay = 12;
      var period = hour / 12 >= 1 ? "pm" : "am";
      $("#hour").html(hourDisplay + period)
    }
  }
  return _this;
}());

$(document).ready(function() {
  Heatmap.init()
});
