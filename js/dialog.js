/* global $ */

var percent = [0, 25, 50, 75, 100];

function setMax(max) {
    document.getElementById('max').innerHTML = percent[max];


    for (var i = 4; i > max; i--) {
        $('#filter'+i).removeClass('btn-primary');
    };

    for (var i = max; i > 0; i--) {
        $('#filter'+i).addClass('btn-primary');
    };
}