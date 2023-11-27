$(document).ready(function() {
    
    // getALLDevices(); should be called here so that the table is populated
    // with the devices registered to the user when the page loads
    getALLDevices();
    
    $('#addDeviceBtn').on('click', registerDevice);

    $('#devicesTable tbody').on('click', 'tr', rowClickListner);

    $('#saveDeviceSettings').on('click', saveListener);
});

function toggleDeviceTableVisibility() {
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
        email: email
    };

    $.ajax({
        url: '/devices/read',
        method: 'GET',
        contentType: 'application/json',
        data: data,
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    })
    .done(function(response) {
        
        response.forEach(function(device){
            // make ajax call to backend to get device info
            var deviceId = device.deviceId;
            $.ajax({
                url: '/devices/info',
                method: 'GET',
                contentType: 'application/json',
                data: {deviceId: deviceId},
                headers: { 'x-auth': window.localStorage.getItem("token") },
                dataType: 'json',
            }).done(function(response){
                console.log('device info', response.message);
                var deviceName = response.message.deviceName;
                var deviceStatus = response.message.deviceStatus;
                var deviceType = response.message.productName;
                var deviceRegisteredOn =  new Date(response.message.registeredOn).toLocaleString();
                var measurementFrequency = response.message.measurementFrequency;
                var startTime = response.message.timeOfDayRangeOfMeasurements.startTime;
                var endTime = response.message.timeOfDayRangeOfMeasurements.endTime;
                // Create a row for each device
                console.log('added on', deviceRegisteredOn)
                var tr = $('<tr>').data('device-id', deviceId).append(
                $('<td>').text(device.deviceId),
                $('<td>').text(deviceName),
                $('<td>').text(deviceType),
                $('<td>').text(deviceStatus),
                $('<td>').text(deviceRegisteredOn)
                );
                // Append the new row to the devices table body
                $('#devicesTable tbody').append(tr);
                console.log('lenght of device table', $('#devicesTable tbody tr').length)
                toggleDeviceTableVisibility();
                console.log(response);

                // Make the row clickable
                tr.css('cursor', 'pointer');
                tr.click(function() {
                // Trigger the modal here
                $('#editDeviceModal').modal('show');
                // You can also populate the form with existing device settings
                $('#deviceName').val(deviceName);
                $('#measurementFrequency').val(measurementFrequency); // This should be retrieved from your device settings
                $('#startTime').val(startTime); // This should be retrieved from your device settings
                $('#endTime').val(endTime); // This should be retrieved from your device settings
                });

                $('#devicesTable tbody').append(tr);
            }).fail(function(jqXHR){
                console.log('An error occurred:', jqXHR);
                // Extract and display the error message
                var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
                console.log(errorMessage);
            });
            
        })

    })
    .fail(function(jqXHR) {
        console.log('An error occurred:', jqXHR);
        // Extract and display the error message
        
        console.log(errorMessage);
        
        if ($('#devicesTable tbody tr').length !== 0) {
            var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
            var errorElement = $('<div>').addClass('text-red-500').text(errorMessage);
            $('#registrationStatus').html(errorElement);
        }
        toggleDeviceTableVisibility();
    });
}

function registerDevice(e) {
    e.preventDefault();
    $('#registrationStatus').hide()
    var deviceId = $('#deviceId').val();
    // input validation 
    if (deviceId === "") {
        var errorElement = $('<div>').addClass('text-red-500').text('Device ID can not be empty.');
        $('#registrationStatus').html(errorElement);
        $('#registrationStatus').show()
        return;
    }
    var email = localStorage.getItem("email");

    console.log('Device ID:', deviceId, 'Email:', email);

    var data = {
        deviceId: deviceId,
        email: email,
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
        // get device info of the device just registered to populate the Devices table
        // with the device info
        $.ajax({
            url: '/devices/info',
            method: 'GET',
            contentType: 'application/json',
            data: {deviceId: deviceId},
            headers: { 'x-auth': window.localStorage.getItem("token") },
            dataType: 'json',
        }).done(function(response){
            console.log('device info', response.message);
            var deviceName = response.message.deviceName;
            var deviceStatus = response.message.deviceStatus;
            var deviceType = response.message.productName;
            var deviceRegisteredOn =  response.message.registeredOn;
            // Create a row for each device
            console.log('added on', deviceRegisteredOn)
            var tr = $('<tr>').append(
            $('<td>').text(deviceId),
            $('<td>').text(deviceName),
            $('<td>').text(deviceType),
            $('<td>').text(deviceStatus),
            $('<td>').text(deviceRegisteredOn)
            );
            // Append the new row to the devices table body
            $('#devicesTable tbody').append(tr);
            console.log('lenght of device table', $('#devicesTable tbody tr').length)
                    // Check if the table is currently hidden and show it
            if ($('#devicesTable').is(':hidden')) {
                $('#devicesTable').show();
                $('.no-devices-message').remove(); // Remove the 'no devices' message if it exists
            }
            var message = 'Device registered successfully!';
        
            var messageElement = $('<div>').addClass('text-red-500').text(message);
            $('#registrationStatus').html(messageElement);
            $('#registrationStatus').show()
            console.log(response);
            
        }).fail(function(jqXHR){
            console.log('An error occurred:', jqXHR);
            // Extract and display the error message
            var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
            console.log(errorMessage);
        });
    }) 
    .fail(function(jqXHR) {
        console.log('An error occurred:', jqXHR);
        // Extract and display the error message
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        console.log(errorMessage);
        var errorElement = $('<div>').addClass('text-red-500').text(errorMessage);
        $('#registrationStatus').html(errorElement);
        $('#registrationStatus').show()
    });
}


function rowClickListner() {
    var deviceId = $(this).data('device-id');
    $('#editDeviceModal').data('device-id', deviceId); // Store deviceId in the modal
    // Fetch the current settings and populate the form fields
    // ...
    $('#editDeviceModal').modal('show');
}

function saveListener() {
    var deviceId = $('#editDeviceModal').data('device-id'); // Retrieve the stored deviceId
    var deviceName = $('#deviceName').val();
    var measurementFrequency = $('#measurementFrequency').val();
    var startTime = $('#startTime').val();
    var endTime = $('#endTime').val();

    // Perform validation if necessary
    // ... (validation code)

    // Make an AJAX call to update device settings
    $.ajax({
        url: '/devices/update', 
        method: 'PUT', // 
        contentType: 'application/json',
        data: JSON.stringify({
            deviceId: deviceId, // deviceId is used to identify the device but not to update it
            deviceName: deviceName,
            measurementFrequency: measurementFrequency,
            timeOfDayRangeOfMeasurements: {
                startTime: startTime,
                endTime: endTime
            }
        }),
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    }).done(function(response) {
        // Handle successful update
        $('#editDeviceModal').modal('hide');
        alert('Device settings updated successfully.');
        // Refresh the device table or update the specific row
        // ...
    }).fail(function(jqXHR) {
        // Handle error
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : 'An unknown error occurred.';
        alert('Error updating device settings: ' + errorMessage);
    });
}