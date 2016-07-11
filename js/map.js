/* global google */
/* global setMax */
/* global navigator */

// When the window has finished loading google map
//google.maps.event.addDomListener(window, 'load', initMap);

function initOrigin() {
    // Try W3C Geolocation (Preferred)
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            origin = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            initMapWithOrigin(origin);
        });
    }
    else {
        var origin = new google.maps.LatLng(53.349445, -6.259668); //new google.maps.LatLng(53.372247, -6.513101);
        initMapWithOrigin(origin);
    }
}

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
    initOrigin();
}

function initMapWithOrigin(origin) {
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: origin,
        scrollwheel: false,
        streetViewControl: false,
        zoom: 16
    });

    var markers = [];

    var places = loadData(map, origin);

    var buttons = document.getElementsByClassName('button');

	var directionsDisplay = filterData(map, places, 4);

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function(evt) {
            directionsDisplay = filterData(map, places, evt.target.value, markers, directionsDisplay);
        });
    }
}

function loadData(map, origin) {
    var places = [];
    places.push({
            position: origin,
            map: map,
            //icon: rndIco(),
            label: "0"
        });

    for (var i = 0; i < 8; i++) {
        places.push({
            position: new google.maps.LatLng(rndLat(origin), rndLng(origin)),
            map: map,
            //icon: rndIco(),
            label: rndCap()
        });
	}
	return places;
}

function filterData(map, places, filter, markers, directionsDisplay) {
    setMax(filter);

    var filtered = places.filter(isMatching, filter);
    //fitBounds(map, filtered);
    //markers = drawMarkers(filtered, markers);

    // First, clear out any existing markers
    markers = clearMarkers(markers);

    directionsDisplay = showDirections(map, places[0].position, filtered, directionsDisplay, markers);
    return directionsDisplay;
}

function fitBounds(map, filtered) {
	var latlngbounds = new google.maps.LatLngBounds();

    for (var i = 0; i < filtered.length; i++) {
	    latlngbounds.extend(filtered[i].position);
	}
	map.fitBounds(latlngbounds);
}

function drawMarkers(filtered, markers) {
    markers = clearMarkers(markers);
    for (var i = 0; i < filtered.length; i++) {
	    markers.push(new google.maps.Marker(filtered[i]));
	}
	return markers;
}

function clearMarkers(markers) {
    if (markers instanceof Array) {
        markers.forEach(function (marker){
            marker.setVisible(false);
        });
    }
    markers = [];
    return markers;
}

function showDirections(map, origin, filtered, directionsDisplay, markers) {
    var waypoints = [];
    //console.log(filtered.length)
    for (var i = 0; i < 8 && i < filtered.length; i++) {
        //console.log(i + " " + filtered[i].label);
        waypoints.push({
            location: filtered[i].position
        })
    }

    // Set destination, origin and travel mode.
    var request = {
      origin: origin,
      destination: origin,
      waypoints: waypoints,
      provideRouteAlternatives: false,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(/* now, or future date */),
        trafficModel: google.maps.TrafficModel.PESSIMISTIC
      }/*,
      unitSystem: UnitSystem.IMPERIAL*/
    };

    if(directionsDisplay !== undefined) {
        directionsDisplay.setMap(null);
    }

    directionsDisplay = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });

    // Instantiate an info window to hold step text.
    var stepDisplay = new google.maps.InfoWindow();

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            // Display the route on the map.
            directionsDisplay.setDirections(response);
            showSteps(response, markers, stepDisplay, map);
        } else {
            alert('Could not display directions due to: ' + status);
        }
    });

    return directionsDisplay;
}

function showSteps(directionResult, markers, stepDisplay, map) {
    var myRoute = directionResult.routes[0];

    var marker = markers[0] = markers[0] || new google.maps.Marker({
        position: myRoute.legs[0].start_location,
        map: map,
        icon: 'https://maps.google.com/mapfiles/ms/micons/truck.png'
      });

    var duration = 0;

    for (var i = 1; i < myRoute.legs.length - 2; i++) {
        marker = markers[i] = markers[i] || new google.maps.Marker({
            position: myRoute.legs[i].end_location,
            map: map,
            //icon: 'https://maps.google.com/mapfiles/ms/micons/green.png',
            title: '1',
            label: "" + i
        });

        duration += myRoute.legs[i].duration.value;
        var arrival_time = new Date(Date.now() + duration * 1000);

        duration += 5 /* min */ * 60;
        var loading_finish = new Date(Date.now() + duration * 1000);

        var text = myRoute.legs[i].end_address;
        text += '<br> <b>Arrival Time:</b> ' + arrival_time.toLocaleTimeString();
        text += '<br> <b>Loading Finish:</b> ' + loading_finish.toLocaleTimeString();

        attachInstructionText(stepDisplay, marker, text, map);
    }
}

function attachInstructionText(stepDisplay, marker, text, map) {
  google.maps.event.addListener(marker, 'click', function() {
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}