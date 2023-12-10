// Function to handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const deviceId = $('#deviceId').val();
    const startDate = new Date($('#startDate').val());
    const endDate = new Date($('#endDate').val());
    const interval = parseInt($('#interval').val());

    generateAndSendData(deviceId, startDate, endDate, interval);
}

// Function to generate and send data
function generateAndSendData(deviceId, startDate, endDate, interval) {
    let currentTime = startDate;
    let successCount = 0;
    let totalCount = 0;

    while (currentTime <= endDate) {
        totalCount++;
        const heartrate = generateRandomValue(30, 250);
        const spo2 = generateRandomValue(90, 100);

        const data = {
            event: "sensorData",
            data: JSON.stringify({
                heartrate: heartrate,
                spo2: spo2,
                measurementTime: currentTime.toISOString()
            }),
            coreid: deviceId,
            published_at: new Date().toISOString(),
            test: true
        };

        sendSensorData(data, function() {
            successCount++;
            $('#createMessageDisplay').text(`Creating data points: ${successCount}`);
            if (successCount === totalCount) {
                $('#createMessageDisplay').text(`Done! ${successCount} data points created.`);
            }
        });

        currentTime = new Date(currentTime.getTime() + interval * 60000);
    }
}

// Function to generate a random value within a range
function generateRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to send sensor data using jQuery AJAX
function sendSensorData(data, callback) {
    $.ajax({
        url: '/sensorData/store',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        headers: { 'x-api-key': '88617f8629a0878f7a694dc8912b30f9f443bb884c80643996b7bfa8ec4d335f7181b87bf680751e83fa1238a2cbe59eff101c1191ae11ad3f59b5a70169705a'},
        success: function(response) {
            console.log('Success:', response);
            if (callback) callback();
        },
        error: function(error) {
            console.error('Error:', error);
        }
    });
}


// Function to handle clear data button click
function handleClearDataClick() {
    const deviceId = $('#deviceId').val();
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();

    clearSensorData(deviceId, startDate, endDate);
}

// Function to clear sensor data using jQuery AJAX
function clearSensorData(deviceId, startDate, endDate) {
    $.ajax({
        url: '/sensorData/delete',
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({ deviceId, startDate, endDate }),
        success: function(response) {
            $('#clearMessageDisplay').text(`Success: ${response.message}. Data points deleted: ${response.deletedCount}`);
        },
        error: function(error) {
            $('#clearMessageDisplay').text('Error: ' + (error.responseJSON ? error.responseJSON.message : 'Request failed'));
        }
    });
}
// Function to display messages below the buttons
function displayMessage(message) {
    $('#messageDisplay').text(message);
}
// Document ready function for event listener registration
$(document).ready(function() {
    $('#dataForm').on('submit', handleFormSubmit);
    $('#clearDataBtn').on('click', handleClearDataClick);
});
