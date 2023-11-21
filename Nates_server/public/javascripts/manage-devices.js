$(document).ready(function() {
    // showOrHideDeviceTable();
    $('#addDeviceBtn').on('click', registerDevice);
});

function showOrHideDeviceTable() {
    // Check if the tbody has any tr (table rows)
    if ($('#devicesTable tbody tr').length === 0) {
        // Hide the table
        $('#devicesTable').hide();

        // Create a div to hold the 'no devices' message
        var noDevicesDiv = $('<div/>', {
            'class': 'no-devices-message', // Add a class for potential styling
            'text': 'You have no devices registered currently',
            'css': {
                'text-align': 'center', // Center the text
                'margin-top': '20px' // Add some space at the top
            }
        });

        // Append the 'no devices' message div after the table's parent div
        $('#devicesTable').parent().append(noDevicesDiv);
    }
}
function getALLDevices(e) {
    // stopped here
    // will continue by making a get call to backend to get all devices
    // registered to the user and populate the table with the devices info
    var email = localStorage.getItem("email");

    console.log('Getting all devices registered to', email);

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
        // Store deviceId in localStorage
        localStorage.setItem("deviceId", deviceId);
        
        // Create a new date object for the 'Added On' column
        var dateAdded = new Date();
        
        // Format the date as a string (You can adjust the format as needed)
        var dateString = dateAdded.toLocaleString(); // This will give you a local date-time string
        
        // Create a new row with the device details
        var newRow = $('<tr>').append(
            $('<td>').text(deviceId),
            $('<td>').text('Argon'),
            $('<td>').text('ndaba'),
            $('<td>').text('offline'),
            $('<td>').text(dateString)
        );
        
        // Append the new row to the devices table body
        $('#devicesTable tbody').append(newRow);
        
        // Check if the table is currently hidden and show it
        if ($('#devicesTable').is(':hidden')) {
            $('#devicesTable').show();
            $('.no-devices-message').remove(); // Remove the 'no devices' message if it exists
        }
        
        console.log(response);
    })
    
    .fail(function(jqXHR) {
        console.log('An error occurred:', jqXHR);
        // Extract and display the error message
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        console.log(errorMessage);
        var errorElement = $('<div>').addClass('text-red-500').text(errorMessage);
        $('#registrationStatus').html(errorElement);
    });
}

function registerDevice(e) {
    e.preventDefault();
    
    var deviceId = $('#deviceId').val();
    var email = localStorage.getItem("email");

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
        // Store deviceId in localStorage
        localStorage.setItem("deviceId", deviceId);
        
        // Create a new date object for the 'Added On' column
        var dateAdded = new Date();
        
        // Format the date as a string (You can adjust the format as needed)
        var dateString = dateAdded.toLocaleString(); // This will give you a local date-time string
        
        // Create a new row with the device details
        var newRow = $('<tr>').append(
            $('<td>').text(deviceId),
            $('<td>').text('Argon'),
            $('<td>').text('ndaba'),
            $('<td>').text('offline'),
            $('<td>').text(dateString)
        );
        
        // Append the new row to the devices table body
        $('#devicesTable tbody').append(newRow);
        
        // Check if the table is currently hidden and show it
        if ($('#devicesTable').is(':hidden')) {
            $('#devicesTable').show();
            $('.no-devices-message').remove(); // Remove the 'no devices' message if it exists
        }
        
        console.log(response);
    })
    
    .fail(function(jqXHR) {
        console.log('An error occurred:', jqXHR);
        // Extract and display the error message
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        console.log(errorMessage);
        var errorElement = $('<div>').addClass('text-red-500').text(errorMessage);
        $('#registrationStatus').html(errorElement);
    });
}