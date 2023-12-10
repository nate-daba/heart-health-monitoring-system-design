$(document).ready(function() {
    // Populate the table when the page loads
    getALLDevices();  
    getPatientInfo();
    $('#addDeviceBtn').on('click', registerDevice);
    $('#saveDeviceSettings').on('click', saveDeviceSettingsListener);

    // Event delegation for edit and remove
    $('#devicesTable').on('click', '.edit-device-settings', editDeviceSettingsListener);
    $('#devicesTable').on('click', '.remove-device', removeDeviceListener);
    $('#confirmDelete').on('click', confirmDeleteListener);

    // Register row click listener
    $('#devicesTable tbody').on('click', 'tr', rowClickListener);

    // Register modal shown event listener
    $('#editDeviceModal').on('shown.bs.modal', onModalShown);

    $('#logout').on('click', logoutEventListener);

    $('#refreshDevicesBtn').on('click', function() {
        getALLDevices(); // Call the function to refresh devices
    });
});

function getALLDevices(e) {
    // stopped here
    // will continue by making a get call to backend to get all devices
    // registered to the patient and populate the table with the devices info
    $('#devicesTable tbody').empty();

    $.ajax({
        url: '/devices/read',
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
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
                headers: { 'x-auth': window.localStorage.getItem("patient-token") },
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
                
                console.log(response);

                // Make the row clickable
                tr.css('cursor', 'pointer');
                tr.click(function() {
                // You can also populate the form with existing device settings
                console.log('received device name: ', deviceName);
                $('#deviceName').val(deviceName);
                $('#measurementFrequency').val(measurementFrequency); // This should be retrieved from your device settings
                $('#startTime').val(startTime); // This should be retrieved from your device settings
                $('#endTime').val(endTime); // This should be retrieved from your device settings
                });

                $('#devicesTable tbody').append(tr);
                $(`#dropdownMenuLink-${deviceId}`).dropdown();
                toggleDeviceTableVisibility();
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

function logoutEventListener(e) {
    e.preventDefault();
    window.localStorage.removeItem("patient-token");
    window.localStorage.removeItem("patient-email");
    window.location.href = '/patient-login.html';
}

function registerDevice(e) {
    e.preventDefault();
    $('#registrationStatus').hide()
    var deviceId = $('#deviceId').val();
    // input validation 
    if (deviceId === "") {
        showMessageModal('Error', 'Device ID can not be empty.', 'error');
        return;
    }

    var data = {
        deviceId: deviceId,
    };

    $.ajax({
        url: '/devices/register',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json',
    })
    .done(function(response) {
        // Store deviceId in window.localStorage
        window.localStorage.setItem("deviceId", deviceId);
        // get device info of the device just registered to populate the Devices table
        // with the device info
        $.ajax({
            url: '/devices/info',
            method: 'GET',
            contentType: 'application/json',
            data: {deviceId: deviceId},
            headers: { 'x-auth': window.localStorage.getItem("patient-token") },
            dataType: 'json',
        }).done(function(response){
            showMessageModal('Device Registration', 'Device registered successfully.', 'success');
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

            $('#deviceId').val(''); // Clear the device ID field
            console.log(response);
            
        }).fail(function(jqXHR){
            // Extract and display the error message
            var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
            showMessageModal('Device Registration', errorMessage, 'error');

        });
    }) 
    .fail(function(jqXHR) {
        // Extract and display the error message
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        showMessageModal('Device Registration', errorMessage, 'error');
    });
}


function rowClickListener(e) {
    e.preventDefault();
    
    
    if (!$(e.target).closest('.dropdown').length) {
        // store the device id in the modal
        var deviceId = $(this).closest('tr').data('device-id');
        $('#editDeviceModal').data('device-id', deviceId);

        // Retrieve the row that was clicked
        var row = $(this).closest('tr');
        // update contents of modal with current content of row
        $('#editDeviceModal').data('row', row);
        // Show the modal
        $('#editDeviceModal').modal('show');
    }
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
    console.log('startTime', startTime, 'endTime', endTime);
    // Reset previous error states
    $('#editDeviceForm .form-control').removeClass('is-invalid');

    // Validation for Device Name
    if (!deviceName) {
        errorMessages.push("Device Name can't be left empty.");
        $('#deviceName').addClass('is-invalid');
    }

    // Validation for Measurement Frequency
    if (measurementFrequency < 1 || measurementFrequency > 10080) {
        errorMessages.push("Measurement Frequency must be between 1 and 48.");
        $('#measurementFrequency').addClass('is-invalid');
    }

    // Validation for Start and End Times
    // Validation for Start and End Times
    var startDate = new Date('1970-01-01T' + startTime + ':00');
    var endDate = new Date('1970-01-01T' + endTime + ':00');

    if (startDate >= endDate) {
        errorMessages.push("End Time must be later than Start Time.");
        $('#startTime, #endTime').addClass('is-invalid');
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
    var originalValues = $('#editDeviceModal').data('originalValues');

    // No validation errors, proceed with update
    if (errorMessages.length === 0) {
        
        var updateData = {};
        if (deviceName !== originalValues.deviceName) {
            updateData.deviceName = deviceName;
        }
        if (measurementFrequency.toString() !== originalValues.measurementFrequency) {
            updateData.measurementFrequency = measurementFrequency;
        }
        if (startTime !== originalValues.startTime || endTime !== originalValues.endTime) {
            updateData.timeOfDayRangeOfMeasurements = {
                startTime: startTime,
                endTime: endTime
            };
        }

        // Only proceed if there is something to update
        // console.log('updateData', updateData)
        if (Object.keys(updateData).length > 0) {
            updateData.deviceId = deviceId; // Always send deviceId for identification
            console.log('updateData', updateData)
            $.ajax({
                url: '/devices/update',
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(updateData),
                headers: { 'x-auth': window.localStorage.getItem("patient-token") },
                dataType: 'json',
                // ... AJAX success and failure handlers ...
            }).done(function(response) {
                // Handle successful update
                $('#editDeviceModal').modal('hide');
                var row = $('#editDeviceModal').data('row');
                updateDeviceTableRow(row, deviceName, measurementFrequency, startTime, endTime);
                $('#editDeviceModal').modal('hide');
                showMessageModal('Updating Device Setting', response.message, 'success');

            }).fail(function(jqXHR) {
                // Handle error
                var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : 'An unknown error occurred.';
                // alert('Error updating device settings: ' + errorMessage);
                showMessageModal('Updating Device Setting', errorMessage, 'success');
            });
        }
    }
}

function editDeviceSettingsListener(e) {
    e.preventDefault();
    // e.stopPropagation();
    
    // store the device id in the modal
    var deviceId = $(this).closest('tr').data('device-id');
    $('#editDeviceModal').data('device-id', deviceId);

    // Retrieve the row that was clicked
    var row = $(this).closest('tr');
    // update contents of modal with current content of row
    updateDeviceSettingsModal(row, $('#editDeviceModal'));
    $('#editDeviceModal').data('row', row);
    // Show the modal
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
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json',
    })
    .done(function(response) {
        // If the server confirms deletion, remove the row from the table
        console.log('Removing device with ID:', typeof(deviceId));
        console.log('Elements to remove:', $('tr[data-device-id="' + deviceId + '"]').length);
        $('tr[data-device-id="' + deviceId + '"]').remove();
        $('#confirmDeleteModal').modal('hide'); // Hide the confirmation modal
        showMessageModal('Device removed', 'Device removed successfully.', 'success');

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
        showMessageModal('Error', 'An error occurred while deleting the device.', 'error');
    });
}

function showMessageModal(title, message, type) {
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

function updateDeviceTableRow(row, deviceName, frequency, startTime, endTime) {
    $(row).find('td').eq(1).text(deviceName); // Assuming name is in the second column
    $(row).find('td').eq(5).text(frequency + ' mins'); // Update measurement frequency
    $(row).find('td').eq(6).text(convertTo12Hour(startTime)); // Update start time
    $(row).find('td').eq(7).text(convertTo12Hour(endTime)); // Update end time
    // Update other columns as needed
}

function updateDeviceSettingsModal(row, modal) {
    var startTime24hr = convertTo24Hour(row.find('td').eq(6).text());
    var endTime24hr = convertTo24Hour(row.find('td').eq(7).text());
    var frequency = row.find('td').eq(5).text().match(/\d+/)[0]; // Extracts only the digits from the frequency string

    modal.find('#deviceName').val(row.find('td').eq(1).text());
    modal.find('#measurementFrequency').val(frequency);
    modal.find('#startTime').val(startTime24hr);
    modal.find('#endTime').val(endTime24hr);
}

function convertTo24Hour(time) {
    var timeParts = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!timeParts) {
        // If time doesn't have AM/PM, it's assumed to be in 24-hour format already
        return time;
    }

    var hours = Number(timeParts[1]);
    var minutes = Number(timeParts[2]);
    var AMPM = timeParts[3];

    if (AMPM) {
        if (AMPM.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (AMPM.toUpperCase() === "AM" && hours === 12) hours = 0;
    }

    var sHours = hours.toString().padStart(2, '0');
    var sMinutes = minutes.toString().padStart(2, '0');
    return sHours + ":" + sMinutes;
}

function createDropdown(deviceId) {
    return `
        <div class="dropdown">
            <a class="dropdown-toggle" href="#" role="button" 
               id="dropdownMenuLink-${deviceId}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
               <!-- SVG icon here -->
               <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
                    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
               </svg>
            </a>
            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuLink-${deviceId}">
                <a class="dropdown-item remove-device" href="#">Remove device</a>
                <a class="dropdown-item edit-device-settings" href="#">Edit device settings</a>
            </div>
        </div>
    `;
}

function toggleDeviceTableVisibility() {
    // Check if there are no devices (after clearing the table)
    if ($('#devicesTable tbody tr').length === 0) {
        // Hide the table
        $('#devicesTable').hide();
        $('#devicesTable tbody').empty();
        // Check if the 'no devices' message div already exists to prevent duplicates
        if ($('.no-devices-message').length === 0) {
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
    } else {
        // Show the table if it has rows
        $('#devicesTable').show();

        // Remove the 'no devices' message if it exists
        $('.no-devices-message').remove();
    }
}

function onModalShown() {
    var row = $('#editDeviceModal').data('row');
    updateDeviceSettingsModal(row, $('#editDeviceModal'));

    // Store original values
    var originalValues = {
        deviceName: $('#deviceName').val(),
        measurementFrequency: $('#measurementFrequency').val(),
        startTime: $('#startTime').val(),
        endTime: $('#endTime').val(),
        status: row.find('td').eq(3).text()
    };

    $('#editDeviceModal').data('originalValues', originalValues);
}

// Function to get the patient info
function getPatientInfo() {
    $.ajax({
        url: '/patients/read/',
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('response from server', response);
        $('#patientFullName').text(response.patientDoc.firstName + ' ' + response.patientDoc.lastName);
    })
    .fail(function(error) {
        console.log(error);
    });
}












