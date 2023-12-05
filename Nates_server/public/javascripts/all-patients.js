$(document).ready(function() {
    getPhysicianInfo();
    var physicianEmail = localStorage.getItem("physician-email");    
    // make an ajax call to get all patients registered to this physician
    $.ajax({
        url: '/physicians/read/' + physicianEmail,
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json'
    })
    .done(function(response) {
        var allPatients = response.physicianInfo.patients;
        allPatients.forEach(function(patient) {
            console.log(patient.email);
            getDevicesRegisteredToPatient(patient.email, patient.firstName, patient.lastName);
        });
    }).fail(function(err) {
        console.log("error getting patients");
    });

    
});

// Function to get the sensor data for the selected device and date and plot it
function getSensorData(deviceId, span, patientFirstName, patientLastName){
    var data = {
        deviceId: deviceId,
    };

    $.ajax({
        url: '/sensorData/read/' + span,
        method: 'GET',
        contentType: 'application/json',
        data: data,
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('sensor data for : ', deviceId, ':', response);
        var extractedData = extractData(response);
        console.log('extracting data', extractedData);
        var stats = computeStatictics(extractedData);
        console.log('stats: ', stats);
        populateSummaryCards(patientFirstName, patientLastName, deviceId, stats);
        
    })
    .fail(function(error) {
        console.log('No sensor data found for this device and date.')
        console.log(error);
    });   
}

function getDevicesRegisteredToPatient(patientEmail, patientFirstName, patientLastName) {
    var data = {
        email: patientEmail
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
        console.log('devices: ', response);
        // var devices = response.data.devices;
        response.forEach(function(device) {
            var deviceId = device.deviceId;
            console.log('getting sensor data for device: ', deviceId);
            getSensorData(deviceId, 'week', patientFirstName, patientLastName);
        });
    })
    .fail(function(error) {
        console.log(error);
    });
}

// Function to extract the data from the response from the server
function extractData(response){
    var heartrateData = [];
    var spo2Data = [];
    var timeData = [];
    response.forEach(function(data){
        heartrateData.push(data.data.heartrate);
        spo2Data.push(data.data.spo2);
        var date = new Date(data.measurementTime);
        var time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        timeData.push(time); // wrap published_at in new Date() to convert it to a date object
    });
    var data = [heartrateData, spo2Data, timeData];

    // Sort the data by measurement time
    // [heartrateData, spo2Data, timeData] = sortByMeasurementTime(data);

    return [heartrateData, spo2Data, timeData];

}

function computeStatictics(extractedData){
    const [heartrateData, spo2Data, timeData] = extractedData;
    // Calculate stats for the week
    const average = array => array.reduce((a, b) => a + b) / array.length;
    var avgHeartRate = average(heartrateData);
    var maxHeartRate = Math.max(...heartrateData);
    var minHeartRate = Math.min(...heartrateData);
    var avgOxygenSaturation =  average(spo2Data);
    var maxOxygenSaturation =  Math.max(...spo2Data);
    var minOxygenSaturation = Math.min(...spo2Data);

    return {avgHeartRate, maxHeartRate, minHeartRate, avgOxygenSaturation, maxOxygenSaturation, minOxygenSaturation};

}

function createCardTemplate(patientName, deviceId, stats) {
    return `
        <div class="patient-card">
            <div class="vr ml-2 mb-1"><strong>Patient Name: </strong> ${patientName}</div>
            <div class="vr ml-2 mb-1"><strong>Device Id</strong>: ${deviceId}</div>
            <div class="row">

                <!-- Average Card -->
                <div class="col-xl-3 col-md-6 mb-2">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                Average</div>
                            <div class="h6 mb-1 font-weight-bold text-gray-800">Heart Rate: <span class="text-primary">${stats.avgHeartRate.toFixed(0)} bpm</span></div>
                            <div class="h6 mb-0 font-weight-bold text-gray-800">Oxygen. Sat: <span class="text-primary">${stats.avgOxygenSaturation.toFixed(0)} %</span></div>
                        </div>
                    </div>
                </div>
                
                <!-- Minimum Card -->
                <div class="col-xl-3 col-md-6 mb-2">
                    <div class="card border-left-success shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Minimum</div>
                                    <div class="h6 mb-1 font-weight-bold text-gray-800">Heart Rate: <span class="text-success">${stats.minHeartRate} bpm</span></div>
                                    <div class="h6 mb-0 font-weight-bold text-gray-800">Oxygen. Sat: <span class="text-success">${stats.minOxygenSaturation} %</span></div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Maximum Card -->
                <div class="col-xl-3 col-md-6 mb-2">
                    <div class="card border-left-info shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Maximum</div>
                                    <div class="h6 mb-1 font-weight-bold text-gray-800">Heart Rate: <span class="text-info">${stats.maxHeartRate} bpm</span></div>
                                    <div class="h6 mb-0 font-weight-bold text-gray-800">Oxygen. Sat: <span class="text-info">${stats.maxOxygenSaturation} %</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <hr class="my-4">`;
}

function populateSummaryCards(patientFirstName, patientLastName, deviceId, stats) {
    const patientName = `${patientFirstName} ${patientLastName}`;
    const cardHtml = createCardTemplate(patientName, deviceId, stats);

    // Append the card to a specific element in the DOM
    $('#content .container-fluid').append(cardHtml);
}

// Function to get the user info
function getPhysicianInfo() {
    var email = localStorage.getItem("physician-email");
    var data = {
        email: email
    };

    $.ajax({
        url: '/physicians/read/' + email,
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('response from server (in get physician info)', response);
        $('#physicianFullName').text(response.physicianInfo.firstName + ' ' + response.physicianInfo.lastName);
    })
    .fail(function(error) {
        console.log(error);
    });
}

