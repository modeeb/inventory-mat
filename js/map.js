/* global google */

// When the window has finished loading google map
//google.maps.event.addDomListener(window, 'load', initMap);

function rndPnt(i) {
    var factor = Math.random() > .5 ? +50 : -50;
    return i + Math.random() / factor;
}

function rndLat(origin) {
    return rndPnt(origin.lat());
}

function rndLng(origin) {
    return rndPnt(origin.lng());
}

function rndIco() {
    return "./SVG/battery-" + Math.floor(Math.random() * 4.9) + ".svg";
}

function rndCap() {
    return "" + Math.floor(Math.random() * 4.9);
}

function isMatching(place) {
    return isNaN(this) || parseInt(place.label) <= parseInt(this);
}

function initMap() {
    var origin = new google.maps.LatLng(53.352247, -6.263101); //new google.maps.LatLng(53.372247, -6.513101);

    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: origin,
        scrollwheel: false,
        streetViewControl: false,
        zoom: 16
    });

    var places = loadData(map, origin);

	var markers = filterData(map, places, 4, markers);

    var buttons = document.getElementsByClassName('button')

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function(evt) {
            markers = filterData(map, places, evt.target.value, markers);
        });
    }

    //showDirections(map);
}

function loadData(map, origin) {
    var places = [];
    for (var i = 0; i < 32; i++) {
        places.push({
            position: new google.maps.LatLng(rndLat(origin), rndLng(origin)),
            map: map,
            //icon: rndIco(),
            label: rndCap()
        });
	}
	return places;
}

function filterData(map, places, filter, markers) {
    var filtered = places.filter(isMatching, filter);
    //var filtered = places;
    fitBounds(map, filtered);
    markers = drawMarkers(filtered, markers);
    return markers;
}

function fitBounds(map, filtered) {
	var latlngbounds = new google.maps.LatLngBounds();

    for (var i = 0; i < filtered.length; i++) {
	    latlngbounds.extend(filtered[i].position);
	}
	map.fitBounds(latlngbounds);
}

function drawMarkers(filtered, markers) {
    if (markers instanceof Array) {
        markers.forEach(function (marker){
            marker.setVisible(false);
        });
    }
    markers = [];
    for (var i = 0; i < filtered.length; i++) {
	    markers.push(new google.maps.Marker(filtered[i]));
	}
	return markers;
}

function showDirections(map) {
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