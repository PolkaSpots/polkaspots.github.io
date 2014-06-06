var Flows = (function() {
  var _this = {

    tileUrl: 'https://{s}.tiles.mapbox.com/v3/polkaspots.g8m4acg0/{z}/{x}/{y}.png',
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',

    initialCoords: [52.922, -1.477],
    initialZoom: 16,
    maxZoom: 25,

    spotColor: "#CCB714",
    strokeColor: "#FF198D",
    strokeWeight: 3,
    maxOpacity: 0.5,

    noiseFactor: 0.00002,

    locationsFile: "data/locations.csv",
    flowsFile: "data/flows.csv",
    routesFile: "data/flows_routes.json",

    derbyMacs:  ["00:18:0a:04:4b:1c" ,"00:18:0a:04:5d:78" ,"00:18:0a:04:5d:42" ,"00:18:0a:04:5d:94" ,"00:18:0a:a1:9f:60" ,"00:18:0a:04:5d:52" ,"00:18:0a:04:5d:96" ,"00:18:0a:04:5d:a4" ,"00:18:0a:15:58:b0" ,"00:18:0a:15:47:c0" ,"00:18:0a:33:2e:f2" ,"00:18:0a:27:cf:e2" ,"00:18:0a:13:b2:50" ,"00:18:0a:13:b6:90" ,"00:18:0a:04:6d:c4" ,"00:18:0a:13:bd:60" ,"00:18:0a:15:28:30" ,"00:18:0a:15:ba:f0" ,"00:18:0a:15:25:90" ,"00:18:0a:14:de:f0" ,"00:18:0a:15:2e:b0" ,"00:18:0a:15:65:90" ,"00:18:0a:15:bb:a0" ,"00:18:0a:15:0d:70" ,"00:18:0a:15:22:20" ,"00:18:0a:15:25:b0" ,"00:18:0a:14:f8:e0" ,"00:18:0a:15:d7:20" ,"00:18:0a:14:f4:c0" ,"00:18:0a:15:67:c0" ,"00:18:0a:15:65:c0" ,"00:18:0a:14:e2:b0" ,"00:18:0a:15:3c:50" ,"00:18:0a:15:67:60" ,"00:18:0a:15:b2:40" ,"00:18:0a:15:22:40" ,"00:18:0a:15:98:e0" ,"00:18:0a:15:aa:30" ,"00:18:0a:15:d6:10" ,"00:18:0a:04:16:5e" ,"00:18:0a:27:c5:1a" ,"00:18:0a:04:4c:4a" ,"00:18:0a:15:5f:b0"],

    init: function() {
      _this.setupMap();
      _this.getData(_this.render);
    },

    setupMap: function() {
      _this.map = L.map('map').setView(_this.initialCoords, _this.initialZoom);
      L.tileLayer(_this.tileUrl, {
        attribution: _this.attribution,
        maxZoom: _this.maxZoom
      }).addTo(_this.map);
    },

    getData: function(callback) {
      _this.getLocations(function() {
        _this.getFlows(function() {
          _this.getRoutes(function() {
            callback();
          });
        });
      });
    },

    getFlows: function(callback) {
      d3.text(_this.flowsFile, function(text) {
        _this.flows = d3.csv.parseRows(text);
        _this.maxN = _this.max(_this.transpose(_this.flows)[2]);
        callback();
      })
    },

    getLocations: function(callback) {
      d3.text(_this.locationsFile, function(text) {
        _this.locations = d3.csv.parseRows(text);
        callback();
      })
    },

    render: function() {
      _this.renderFlows();
      _this.renderAPs();
    },

    renderAPs: function() {
      _.each(_this.locations, function(loc) {
        var mac = loc[0];
        //if(_.include(_this.derbyMacs, mac)) {
          var lat = loc[1];
          var lng = loc[2];
          var latlng = L.latLng(lat, lng);
          var marker = L.circleMarker(latlng, {
            color: _this.spotColor,
          })
          marker.addTo(_this.map);
       // }
      });
    },

    renderFlows: function() {
      _.each(_this.flows, function(flow) {
        var from_mac = flow[0];
        var to_mac   =  flow[1]
        //if(_.include(_this.derbyMacs, from_mac) && _.include(_this.derbyMacs, to_mac)) {
          var n        =  flow[2];
          var routeKey = from_mac + "," + to_mac
          var route    = _this.routes[routeKey]
          if(route) {
            var encoded = route["overview_polyline"]["points"]
            var distance = route["legs"][0]["distance"]["value"]
            if(distance < 5000) {
              var pl = L.Polyline.fromEncoded(encoded, {
                stroke: true,
                color: _this.pathColor(n),
                opacity:_this.pathOpacity(n),
                weight: _this.strokeWeight
              });
              pl = _this.noisyPolyLine(pl);
              pl.addTo(_this.map);
            }
         // }
        }
      });
    },

    pathOpacity: function(n) {
      return Math.log(n) / Math.log(_this.maxN) * _this.maxOpacity;
    },

    pathColor: function(n) {
      var color = Color(_this.strokeColor);
      return color.lighten(Math.log(n) / Math.log(_this.maxN) * 0.5).hexString();
    },

    getRoutes: function(callback) {
      d3.json(_this.routesFile, function(json) {
        _this.routes = json
        callback();
      });
    },

    max: function(array) {
      return Math.max.apply(Math, array);
    },

    transpose: function(array) {
      return _.zip.apply(_, array);
    },

    noisyPolyLine: function(pl) {
      var lls = pl.getLatLngs()
      var noisyLls = _.map(lls, _this.noisyLatLong);
      pl.setLatLngs(noisyLls);
      return pl;
    },

    noisyLatLong: function(ll) {
      var lat = ll.lat + _this.noiseFactor * _this.randomGaussian();
      var lng = ll.lng + _this.noiseFactor * _this.randomGaussian();
      return L.latLng(lat, lng);
    },

    randomGaussian: function() {
      var u1 = Math.random();
      var u2 = Math.random();
      return Math.sqrt(-2*Math.log(u1))*Math.sin(2 * Math.PI * u2);
    },
  };
  return _this;
})();

$(document).ready(function() {
  Flows.init()
});
