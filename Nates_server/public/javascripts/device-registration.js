$(document).ready(function() {
    $('#registerDevice').on('click', registerDevice);
});

function registerDevice(e) {
    e.preventDefault();

    var deviceId = $('#deviceId').val();
    var email = window.localStorage.getItem("email");

    console.log('Device ID:', deviceId, 'Email:', email);

    var data = {
        deviceId: deviceId,
        email: email
    };

    $.ajax({
        url: '/devices/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    })
    .done(function(response) {
        // Store deviceId in window.localStorage
        window.localStorage.setItem("deviceId", deviceId);
        // Redirect to sensorData.html
        window.location.href = 'sensorData.html';
    })
    .fail(function(jqXHR) {
        console.log('An error occurred:', jqXHR);
        // Extract and display the error message
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        var errorElement = $('<div>').addClass('text-red-500').text(errorMessage);
        $('#registrationStatus').html(errorElement);
    });
}

function listDevices(e){
    e.preventDefault();
    $.ajax({
        url: '/devices/list',
        method: 'GET',
        headers: {'x-auth': window.localStorage.getItem("token")},
        dataType: 'json',
    })
    .done(function(response){
        // Empty the table body to ensure no duplicates
        $('#deviceTableContainer').show();
        var tableBody = $('#deviceTable tbody').empty();
    
        response.forEach(function(device){
            // Create a row for each device
            var tr = $('<tr>').append(
                $('<td>').text(device.id),
                $('<td>').text(device.name),
                $('<td>').text(device.online ? 'Yes' : 'No'),
                $('<td>').append(
                    $('<button>')
                        .text('Register Device')
                        .addClass('register-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline')
                        .data('device-id', device.id)
                )
            );
    
            // Append the row to the table body
            tableBody.append(tr);
        });
    
        // // Attach a click event listener to each "Register Device" button
        // $('.register-btn').on('click', function(){
        //     var deviceIdToRegister = $(this).data('device-id');
        //     // Call the register device function or AJAX call here
        //     // ...
        // });
    })        
    .fail(function(jqXHR, textStatus, errorThrown) {
        // Handle failure response
        var errorJson = JSON.stringify({
            status: jqXHR.status,
            statusText: jqXHR.statusText,
            responseText: jqXHR.responseText
        }, null, 4);
        $('body').html($('<pre>').text(errorJson));
    });
}

function deviceTable() {
    var deviceIdToRegister = $(this).data('device-id');
    window.localStorage.setItem("deviceId", deviceIdToRegister);
    // First AJAX call to claim the device
    $.ajax({
        url: '/devices/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ deviceId: deviceIdToRegister }),
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('Device successfully claimed!');
        // Device is claimed, now make the second AJAX call to create the webhook
        return $.ajax({
            url: '/integrations/createWebhook', // Replace with your actual endpoint
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                integration_type: 'Webhook',
                url: 'https://pulseo2monitor.onrender.com/sensor/',
                requestType: 'POST' 
            }),
            headers: { 'x-auth': window.localStorage.getItem("token") },
            dataType: 'json',
        });
    })
    .done(function(response) {
        console.log('Webhook created successfully!');
        // Both actions are done, redirect to the new page
        window.localStorage.setItem('comingFrom', 'deviceRegistration');
        window.location.href = '/sensorData.html'; // Replace with the actual URL
    })
    .fail(function(error) {
        // Handle any error that occurred during the AJAX calls
        console.log('An error occurred:', error);
    });
}