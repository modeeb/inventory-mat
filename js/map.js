/* global google */

// When the window has finished loading google map
//google.maps.event.addDomListener(window, 'load', initMap);

function rndPnt(i) {
    var factor = Math.random() > .5 ? +50 : -50;
    return i + Math.random() / factor;
}

function rndLat() {
    return rndPnt(53.372247);
}

function rndLng() {
    return rndPnt(-6.513101);
}

function rndIco() {
    return "./SVG/battery-" + Math.floor(Math.random() * 4.9) + ".svg";
}

function rndCap() {
    return "" + Math.floor(Math.random() * 4.9);
}

function isMatching(place) {
    if (isNaN(max))
        return true;
    else
        return parseInt(place.label) <= max;
}

var places = [];
var map = {};
var max = 4;
var markers = [];

function initMap() {
    var dublin = new google.maps.LatLng(53.372247, -6.513101);

    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
        center: dublin,
        scrollwheel: false,
        streetViewControl: false,
        zoom: 16
    });

    loadData();

	filterData();

    //showDirections();
}

function loadData() {
    for (var i = 0; i < 32; i++) {
        places.push({
            position: new google.maps.LatLng(rndLat(), rndLng()),
            map: map,
            //icon: rndIco(),
            label: rndCap()
        });
	}
}

function filterData(filter) {
    max = filter;
    var filtered = places.filter(isMatching);
    //var filtered = places;
    markers.forEach(function (marker){
        marker.setVisible(false);
    });
    fitBounds(filtered);
    drawMarkers(filtered);
}

function fitBounds(filtered) {
	var latlngbounds = new google.maps.LatLngBounds();

    for (var i = 0; i < filtered.length; i++) {
	    latlngbounds.extend(filtered[i].position);
	}
	map.fitBounds(latlngbounds);
}

function drawMarkers(filtered) {
    for (var i = 0; i < filtered.length; i++) {
	    markers.push(new google.maps.Marker(filtered[i]));
	}
}

function showDirections() {
    var chicago = new google.maps.LatLng(41.85, -87.65);
    var indianapolis = new google.maps.LatLng(39.79, -86.14);

    // Set destination, origin and travel mode.
    var request = {
        destination: indianapolis,
        origin: chicago,
        travelMode: google.maps.TravelMode.DRIVING
    };

    var directionsDisplay = new google.maps.DirectionsRenderer({
        map: map
    });

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            // Display the route on the map.
            directionsDisplay.setDirections(response);
        }
    });
}