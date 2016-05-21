// When the window has finished loading google map
//google.maps.event.addDomListener(window, 'load', initMap);

function initMap() {
    var chicago = new google.maps.LatLng(41.85, -87.65);
    var indianapolis = new google.maps.LatLng(39.79, -86.14);
    var dublin = new google.maps.LatLng(53.372247, -6.513101);

    var places = [chicago, indianapolis, dublin]

    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(53.372247, -6.513101),
        scrollwheel: false,
        zoom: 16
    });

    for (var i = 0; i < places.length; i++) {
		new google.maps.Marker({
			position: places[i],
			map: map
		});
	}

	var latlngbounds = new google.maps.LatLngBounds();
	for (var i = 0; i < places.length; i++) {
		latlngbounds.extend(places[i]);
	}
	map.fitBounds(latlngbounds);

    var directionsDisplay = new google.maps.DirectionsRenderer({
        map: map
    });

    // Set destination, origin and travel mode.
    var request = {
        destination: indianapolis,
        origin: chicago,
        travelMode: google.maps.TravelMode.DRIVING
    };

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            // Display the route on the map.
            //directionsDisplay.setDirections(response);
        }
    });
}