$(document).ready(function() {
    getALLDevices();  // Populate the table when the page loads
    $('#addDeviceBtn').on('click', registerDevice);
    $('#saveDeviceSettings').on('click', saveDeviceSettingsListener);

    // Event delegation for edit and remove
    $('#devicesTable').on('click', '.edit-device-settings', editDeviceSettingsListener);
    $('#devicesTable').on('click', '.remove-device', removeDeviceListener);
    $('#confirmDelete').on('click', confirmDeleteListener);

    // Only trigger row click event when not clicking on dropdown or its children
    $('#devicesTable tbody').on('click', 'tr', function(e) {
        if (!$(e.target).closest('.dropdown').length) {
            rowClickListener.call(this, e);
        }
    });
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
                var tr = $('<tr>').attr('data-device-id', deviceId).append(
                    $('<td>').text(deviceId),
                    $('<td>').text(deviceName),
                    $('<td>').text(deviceType),
                    $('<td>').text(deviceStatus),
                    $('<td>').text(deviceRegisteredOn),
                    $('<td>').text(measurementFrequency + ' mins'),
                    $('<td>').text(convertTo12Hour(startTime)), // Start Time
                    $('<td>').text(convertTo12Hour(endTime)), // End Time
                    $('<td>').html(createDropdown()) // Append the dropdown
                );
                $('.dropdown-toggle').dropdown();
                // Append the new row to the devices table body
                $('#devicesTable tbody').append(tr);
                console.log('lenght of device table', $('#devicesTable tbody tr').length)
                toggleDeviceTableVisibility();
                console.log(response);

                // Make the row clickable
                tr.css('cursor', 'pointer');
                tr.click(function() {
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
        // var errorElement = $('<div>').addClass('text-red-500').text('Device ID can not be empty.');
        // $('#registrationStatus').html(errorElement);
        // $('#registrationStatus').show()
        showModal('Error', 'Device ID can not be empty.', 'error');
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
            showModal('Device Registration', 'The device was registered successfully.', 'success');
            var deviceName = response.message.deviceName;
            var deviceStatus = response.message.deviceStatus;
            var deviceType = response.message.productName;
            var deviceRegisteredOn =  new Date(response.message.registeredOn).toLocaleString();
            var measurementFrequency = response.message.measurementFrequency;
            var startTime = response.message.timeOfDayRangeOfMeasurements.startTime;
            var endTime = response.message.timeOfDayRangeOfMeasurements.endTime;
            // Create a row for each device
            console.log('added on', deviceRegisteredOn)
            // Inside the .done() function after registration is successful
            var tr = $('<tr>').attr('data-device-id', deviceId).append(
                $('<td>').text(deviceId),
                $('<td>').text(deviceName),
                $('<td>').text(deviceType),
                $('<td>').text(deviceStatus),
                $('<td>').text(deviceRegisteredOn),
                $('<td>').text(measurementFrequency),
                $('<td>').text(convertTo12Hour(startTime)), // Start Time
                $('<td>').text(convertTo12Hour(endTime)), // End Time
                $('<td>').html(createDropdown()) // Append the dropdown
            );

            $('.dropdown-toggle').dropdown();
            // Append the new row to the devices table body
            $('#devicesTable tbody').append(tr);
            console.log('lenght of device table', $('#devicesTable tbody tr').length)
                    // Check if the table is currently hidden and show it
            if ($('#devicesTable').is(':hidden')) {
                $('#devicesTable').show();
                $('.no-devices-message').remove(); // Remove the 'no devices' message if it exists
            }
            // var message = 'Device registered successfully!';
        
            // var messageElement = $('<div>').addClass('text-red-500').text(message);
            // $('#registrationStatus').html(messageElement);
            // $('#registrationStatus').show()
            $('#deviceId').val(''); // Clear the device ID field
            console.log(response);
            
            
        }).fail(function(jqXHR){
            console.log('An error occurred:', jqXHR);
            // Extract and display the error message
            var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
            showModal('Device Registration', errorMessage, 'error');
            console.log(errorMessage);
        });
    }) 
    .fail(function(jqXHR) {
        console.log('An error occurred:', jqXHR);
        // Extract and display the error message
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        // console.log(errorMessage);
        // var errorElement = $('<div>').addClass('text-red-500').text(errorMessage);
        // $('#registrationStatus').html(errorElement);
        // $('#registrationStatus').show()
        showModal('Device Registration', errorMessage, 'error');
    });
}


function rowClickListener(e) {
    e.stopPropagation(); // Stop the event from propagating up to the table

    var deviceId = $(this).data('device-id');
    $('#editDeviceModal').data('device-id', deviceId);
    // Fetch the current settings and populate the form fields
    // ...
    $('#editDeviceModal').modal('show');
}

function saveDeviceSettingsListener() {
    // Clear previous errors
    $('#errorContainer').remove();

    var deviceId = $('#editDeviceModal').data('device-id'); // Retrieve the stored deviceId
    var deviceName = $('#deviceName').val();
    var measurementFrequency = $('#measurementFrequency').val();
    var startTime = $('#startTime').val();
    var endTime = $('#endTime').val();
    var errorMessages = [];

    // Reset previous error states
    $('#editDeviceForm .form-control').removeClass('is-invalid');

    // Validation for Device Name
    if (!deviceName) {
        errorMessages.push("Device Name can't be left empty.");
        $('#deviceName').addClass('is-invalid');
    }

    // Validation for Measurement Frequency
    if (measurementFrequency < 1 || measurementFrequency > 48) {
        errorMessages.push("Measurement Frequency must be between 1 and 48.");
        $('#measurementFrequency').addClass('is-invalid');
    }

    // If there are any errors, display them and abort the save operation
    if (errorMessages.length > 0) {
        var errorList = $('<ul>').attr('id', 'errorList').addClass('errorList');
        errorMessages.forEach(function(message) {
            errorList.append($('<li>').text(message));
        });
        
        var errorContainer = $('<div>').attr('id', 'errorContainer').addClass('errorContainer').append(errorList);
        
        $('#editDeviceModal .modal-footer').prepend(errorContainer);
        return; // Abort the save operation
    }
    // Proceed with AJAX call if validation passes
    $.ajax({
        url: '/devices/update',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            deviceId: deviceId,
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

function createDropdown() {
    return `
        <div class="dropdown">
            <a class="dropdown-toggle" href="#" role="button" 
               id="rowDropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" width="20" height="20">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                </svg>
            </a>
            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="rowDropdownMenuLink">
                <a class="dropdown-item remove-device" href="#">Remove device</a>
                <a class="dropdown-item edit-device-settings" href="#">Edit device settings</a>
            </div>


        </div>
    `;
}

function editDeviceSettingsListener(e) {
    e.preventDefault();
    e.stopPropagation();

    var deviceId = $(this).closest('tr').data('device-id');
    $('#editDeviceModal').data('device-id', deviceId);
    // Fetch the current settings and populate the form fields
    // ...
    $('#editDeviceModal').modal('show');
}

// Function for "Remove device" click event
function removeDeviceListener(e) {
    e.preventDefault();
    e.stopPropagation();

    var deviceId = $(this).closest('tr').data('device-id');
    $('#deviceToDelete').text(deviceId); // Set device ID in the confirmation modal
    $('#deleteMessage').data('device-id', deviceId); // Store the device ID for later use

    $('#confirmDeleteModal').modal('show'); // Show the confirmation modal
}

 function confirmDeleteListener(e) {
    var deviceId = $('#deleteMessage').data('device-id');
    console.log('Deleting device with ID:', deviceId);
    console.log('typeof(deviceId)', typeof(deviceId));
    $.ajax({
        url: '/devices/delete/' + deviceId, 
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({ deviceId: deviceId }),
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    })
    .done(function(response) {
        // If the server confirms deletion, remove the row from the table
        console.log('Removing device with ID:', typeof(deviceId));
        console.log('Elements to remove:', $('tr[data-device-id="' + deviceId + '"]').length);
        $('tr[data-device-id="' + deviceId + '"]').remove();
        $('#confirmDeleteModal').modal('hide'); // Hide the confirmation modal
        showModal('Device removed', 'The device was removed successfully.', 'success');

        // Check if there are no more rows after deletion
        if ($('#devicesTable tbody tr').length === 0) {
            // Hide the devices table and show the no devices message
            $('#devicesTable').hide();
            $('#noDevicesMessage').show(); // Make sure you have a div with this id or change to appropriate id
        }
        toggleDeviceTableVisibility();
    })
    .fail(function(jqXHR) {
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : 'An unknown error occurred.';
        $('#confirmDeleteModal').modal('hide'); // Hide the confirmation modal
        showModal('Error', 'An error occurred while deleting the device.', 'error');
    });
}

function showModal(title, message, type) {
    var modal = $('#genericModal');
    modal.find('.modal-title').text(title);
    modal.find('.modal-body #genericMessage').text(message);
    modal.modal('show');
}

function convertTo12Hour(time) {
    // Check correct time format and split into components
    time = time.toString().match(/^([01]?[0-9]|2[0-3])(:([0-5][0-9]))?$/) || [time];

    if (time.length > 1) { // If time format correct
        time = time.slice(1); // Remove full string match value
        let hours = parseInt(time[0], 10);
        let meridian = 'AM';
        if (hours >= 12) {
            meridian = 'PM';
            hours %= 12;
        }
        if (hours === 0) hours = 12; // If '00:00' then set to '12:00 AM'
        return (hours < 10 ? '0' + hours : hours) + (time[1] ? time[1] : ':00') + ' ' + meridian;
    }
    return ''; // Return empty string if the time format is incorrect
}











