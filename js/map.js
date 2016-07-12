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

function rndLvl(qty) {
    return Math.floor(Math.random() * qty) / qty;
}

function rndQty() {
    return Math.round(Math.abs(Math.random() * 100)) + 20;
}

function isMatching(place) {
    return isNaN(this) || place.level / .20 <= this;
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

    // Instantiate an info window to hold step text.
    pathData.stepDisplay = new google.maps.InfoWindow();

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
            quantity: 160,
            level: "0"
        });

    document.getElementById("qty").innerHTML = places[0].quantity;

    for (var i = 1; i < 80; i++) {
        var qty = rndQty();
        places.push({
            //position: new google.maps.LatLng(rndLat(origin), rndLng(origin)),
            //map: map,
            //icon: rndIco(),
            //label: rndLvl()
            id: "P" + i,
            longitude: rndLng(origin),
            latitude: rndLat(origin),
            quantity: qty,
            level: rndLvl(qty)
        });
	}
	return places;
}

function filterData(pathData, filter) {
    setMax(filter);

    pathData.filtered = pathData.places.filter(isMatching, filter);
    //fitBounds(map, filtered);
    drawMarkers(pathData);

    // First, clear out any existing markers
    pathData.markers = clearMarkers(pathData.markers);

    clearSchedule();

    showOrigin(pathData);

    pathData = showDirections(pathData);
    return pathData;
}

function fitBounds(pathData) {
	var latlngbounds = new google.maps.LatLngBounds();

	latlngbounds.extend(pathData.origin);

    for (var i = 0; i < pathData.markers.length; i++) {
	    latlngbounds.extend(pathData.markers[i].position);
	}
	pathData.map.fitBounds(latlngbounds);
}

function drawMarkers(pathData) {
    for (var i = 1; i < pathData.places.length; i++) {
        var place = pathData.places[i];
        var marker = new google.maps.Marker({
            position: toLatLng(place),
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 4
            },
            map: pathData.map,
            title: place.id
        });

        var text = prepareStepInfo(place);

        attachInstructionText(pathData, marker, text);
	}
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

    var renderOptions = {
        map: pathData.map,
        //suppressPolylines: true,
        suppressMarkers: true
    };

    pathData.directionsDisplay = new google.maps.DirectionsRenderer(renderOptions);

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            // Display the route on the map.
            showSteps(response, pathData);
            pathData.directionsDisplay.setDirections(response);
        } else {
            alert('Could not display directions due to: ' + status);
        }
    });

    return pathData;
}

function showOrigin(pathData) {
    var marker = new google.maps.Marker({
        position: pathData.origin,
        map: pathData.map,
        title: "" + pathData.places[0].quantity,
        icon: 'https://maps.google.com/mapfiles/ms/micons/truck.png'
    });

    var text = 'Current Location';
    text += '<br> <b>Units on truck:</b> ' + pathData.places[0].quantity;

    attachInstructionText(pathData, marker, text);
}

function showSteps(directionResult, pathData) {
    var myRoute = directionResult.routes[0];
    var adjustedRoute = []

    var duration = 0;
    var available = pathData.places[0].quantity;

    for (var i = 0; i < myRoute.legs.length - 1; i++) {

        if (available <= 0 ) {
            continue;
        } else {
            adjustedRoute.push(myRoute.legs[i]);
        }

        var place = pathData.filtered[myRoute.waypoint_order[i] + 1];

        var marker = pathData.markers[i] = pathData.markers[i] || new google.maps.Marker({
            position: myRoute.legs[i].end_location,
            map: pathData.map,
            //icon: 'https://maps.google.com/mapfiles/ms/micons/green.png',
            title: "" + place.id,
            label: "" + (i + 1)
        });

        duration += myRoute.legs[i].duration.value;
        place.arrival_time = new Date(Date.now() + duration * 1000);

        duration += 5 /* min */ * 60;
        place.loading_finish = new Date(Date.now() + duration * 1000);

        place.address = myRoute.legs[i].end_address;

        place.remaining = Math.min(Math.floor(place.quantity * (1 - place.level)), available);
        place.available = available;
        available -= place.remaining;

        place.serial = i + 1;

        addSchedule(place);

        var text = prepareStepInfo(place);

        attachInstructionText(pathData, marker, text);
    }

    myRoute.legs = adjustedRoute;
    //fitBounds(pathData);
}

function prepareStepInfo(place) {
    var text = place.address || "";
    text += '<br> <b>ID:</b> ' + place.id;
    text += '<br> <b>Quantity:</b> ' + place.quantity;
    text += '<br> <b>Stock Level:</b> ' + Math.floor(place.level * 100) + "%";

    if (place.arrival_time) {
        text += '<br> <b>Arrival Time:</b> ' + place.arrival_time.toLocaleTimeString();
        text += '<br> <b>Loading Finish:</b> ' + place.loading_finish.toLocaleTimeString();
    }

    return text;
}

function attachInstructionText(pathData, marker, text) {
  google.maps.event.addListener(marker, 'click', function() {
    pathData.stepDisplay.setContent(text);
    pathData.stepDisplay.open(pathData.map, marker);
  });
}

function addSchedule(place) {
    var table = document.getElementById("schedule");
    var row = table.insertRow(-1);
    var serial = row.insertCell(0);
    var time = row.insertCell(1);
    var id = row.insertCell(2);
    var rem = row.insertCell(3);
    var avail = row.insertCell(4);
    serial.innerHTML = place.serial;
    time.innerHTML = place.arrival_time.toLocaleTimeString();
    id.innerHTML = place.id;
    rem.innerHTML = place.remaining;
    avail.innerHTML = place.available;
}

function clearSchedule() {
    var table = document.getElementById("schedule");

    while (table.rows.length > 1) {
        table.deleteRow(-1);
    }
}