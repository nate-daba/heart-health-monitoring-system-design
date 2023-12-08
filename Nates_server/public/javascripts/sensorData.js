$(document).ready(function() {
    // Retrieve 'deviceId' from local storage
    var comingFrom = window.localStorage.getItem('comingFrom');
    
    if (comingFrom === 'login') {
        $('.success-message h2').text('Sensor Data');
    } else if (comingFrom === 'deviceRegistration') {
        $('.success-message h2').text('Device Registered Successfully');
    }
    
    // Clear the item to avoid affecting subsequent visits to the page
    window.localStorage.removeItem('comingFrom');
    
    let email = window.localStorage.getItem("email");

    $.ajax({
        url: '/sensorData/read',
        method: 'GET',
        headers: {
            'x-auth': window.localStorage.getItem("token") // Assuming token is stored in window.localStorage
        },
        dataType: 'json',
        contentType: 'application/json',
        data: { email: email }, // Data is sent as query parameters for GET requests
    })
    .done(function(response) {
        // Assuming the response is an array of data objects
        console.log(response);
        response.forEach(function(data) {
            var row = $('<tr>').append(
                $('<td>').text(data.deviceId),
                $('<td>').text(data.data.heartrate),
                $('<td>').text(data.data.spo2),
                $('<td>').text(new Date(data.published_at).toLocaleString()) // Formatting timestamp
            );
            $('#dataBody').append(row);
        });
    })
    .fail(function(jqXHR, textStatus) {
        // Handle any error that occurred during the AJAX call
        console.error('Error fetching data: ' + textStatus);
    });
});
