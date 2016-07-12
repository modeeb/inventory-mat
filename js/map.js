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

function toLatLng(place) {
    return {lat: place.latitude, lng: place.longitude};
}

function rndIco() {
    return "./SVG/battery-" + Math.floor(Math.random() * 4.9) + ".svg";
}

function rndLvl() {
    return "" + Math.floor(Math.random() * 99);
}

function isMatching(place) {
    return isNaN(this) || parseInt(place.level) / 20 <= this;
}

function initMap() {
    initOrigin();
}

function initMapWithOrigin(origin) {
    var pathData = {
        origin: origin
    };

    // Create a map object and specify the DOM element for display.
    pathData.map = new google.maps.Map(document.getElementById('map'), {
        center: origin,
        scrollwheel: false,
        streetViewControl: false,
        zoom: 16
    }),

    pathData.markers = [];

    pathData.places = loadData(origin);

    var buttons = document.getElementsByClassName('button');

	pathData = filterData(pathData, 4);

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function(evt) {
            pathData = filterData(pathData, evt.target.value);
        });
    }
}

function loadData(origin) {
    //<ID>, <Longitude>, <Latitude>, <Quantity> <Stock Level as of DateTime>

    var places = [];
    places.push({
            id: 0,
            longitude: origin.lng(),
            latitude: origin.lat(),
            qty: 600,
            level: "0"
        });

    for (var i = 1; i < 80; i++) {
        places.push({
            //position: new google.maps.LatLng(rndLat(origin), rndLng(origin)),
            //map: map,
            //icon: rndIco(),
            //label: rndLvl()
            id: i,
            longitude: rndLng(origin),
            latitude: rndLat(origin),
            quantity: Math.round(Math.abs(rndPnt(0) * 10000)),
            level: rndLvl()
        });
	}
	return places;
}

function filterData(pathData, filter) {
    setMax(filter);

   pathData.filtered = pathData.places.filter(isMatching, filter);
    //fitBounds(map, filtered);
    //markers = drawMarkers(filtered, markers);

    // First, clear out any existing markers
    pathData.markers = clearMarkers(pathData.markers);

    pathData = showDirections(pathData);
    return pathData;
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

function showDirections(pathData) {
    var waypoints = [];
    //console.log(filtered.length)
    for (var i = 1; i < 9 && i < pathData.filtered.length; i++) {
        //console.log(i + " " + filtered[i].label);
        waypoints.push({
            location: toLatLng(pathData.filtered[i])
        });
    }

    // Set destination, origin and travel mode.
    var request = {
      origin: pathData.origin,
      destination: pathData.origin,
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

    if(pathData.directionsDisplay !== undefined) {
        pathData.directionsDisplay.setMap(null);
    }

    pathData.directionsDisplay = new google.maps.DirectionsRenderer({
        map: pathData.map,
        suppressMarkers: true
    });

    // Instantiate an info window to hold step text.
    pathData.stepDisplay = new google.maps.InfoWindow();

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            // Display the route on the map.
            pathData.directionsDisplay.setDirections(response);
            showSteps(response, pathData);
        } else {
            alert('Could not display directions due to: ' + status);
        }
    });

    return pathData;
}

function showSteps(directionResult, pathData) {
    var myRoute = directionResult.routes[0];

    var marker = pathData.markers[0] = pathData.markers[0] || new google.maps.Marker({
        position: pathData.origin,
        map: pathData.map,
        icon: 'https://maps.google.com/mapfiles/ms/micons/truck.png'
      });

    var duration = 0;

    for (var i = 0; i < myRoute.legs.length - 1; i++) {
        var place = pathData.filtered[myRoute.waypoint_order[i] + 1];

        marker = pathData.markers[i + 1] = pathData.markers[i + 1] || new google.maps.Marker({
            position: myRoute.legs[i].end_location,
            map: pathData.map,
            //icon: 'https://maps.google.com/mapfiles/ms/micons/green.png',
            title: "" + place.id,
            label: "" + (i + 1)
        });

        duration += myRoute.legs[i].duration.value;
        var arrival_time = new Date(Date.now() + duration * 1000);

        duration += 5 /* min */ * 60;
        var loading_finish = new Date(Date.now() + duration * 1000);

        var text = myRoute.legs[i].end_address;
        text += '<br> <b>Arrival Time:</b> ' + arrival_time.toLocaleTimeString();
        text += '<br> <b>Loading Finish:</b> ' + loading_finish.toLocaleTimeString();
        text += '<br> <b>Quantity:</b> ' + place.quantity;
        text += '<br> <b>Stock Level:</b> ' + place.level + "%";

        attachInstructionText(pathData, marker, text);
    }
}

function attachInstructionText(pathData, marker, text) {
  google.maps.event.addListener(marker, 'click', function() {
    pathData.stepDisplay.setContent(text);
    pathData.stepDisplay.open(pathData.map, marker);
  });
}