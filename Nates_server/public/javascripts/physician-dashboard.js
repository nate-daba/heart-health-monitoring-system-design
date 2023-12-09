Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

var currentSelectedDeviceId = null;
var currentSelectedDate = null;

// ====================  Event Listeners =========================
// Event listener for the document ready event.
$(document).ready(function() {
    // Setting the default timezone for moment.js to Phoenix.
    moment.tz.setDefault("America/Phoenix");

    // Initializing dropdowns using Bootstrap's dropdown plugin.
    $('.dropdown-toggle').dropdown();

    // Attaching click event listeners to the patient and device list.
    // These listeners are set up for dynamic dropdown items using event delegation.
    $('#patientList').on('click', '.dropdown-item', patientDropdownItemClickListener);
    $('#deviceList').on('click', '.dropdown-item', deviceDropdownItemClickListener);

    // Attaching click event listener for the update frequency button.
    $('#updateFreqBtn').on('click', updateFreqListener);

    // Attaching change event listener to the datepicker input.
    $('#datepicker-input').on('change', dateChangeListener);

    // Function call to get and display the physician's information.
    getPhysicianInfo();

    // Populating the patient selector dropdown with patients.
    populatePatientSelectorDropdown();

    // Commented out function call to populate device selector dropdown.
    // populateDeviceSelectorDropdown();
    
    // Attaching click event listener for the logout button.
    $('#logout').on('click', logoutEventListener);

    // Initializing the datepicker with the current date in Arizona time zone.
    $('#datepicker').datepicker({
        defaultDate: moment().tz("America/Phoenix").format('MM-DD-YYYY')
    });

    // Attaching click event listener for the refresh devices button.
    $('#refreshDevicesBtn').on('click', dateChangeListener);
});

// Event listener function for the datepicker input change event.
function dateChangeListener(e) {
    // e.preventDefault(); // Uncomment if you need to prevent the default form submission behavior.

    // Retrieving the selected date from the datepicker input.
    var selectedDate = $('#datepicker-input').val();
    
    // Parsing the selected date string into a JavaScript Date object.
    var parsedDate = new Date(selectedDate);
    
    // Checking if the parsed date is a valid date.
    if (!isNaN(parsedDate.getTime())) {
        // Formatting the date into 'yyyy-mm-dd' format.
        var formattedDate = parsedDate.getFullYear() + '-' + 
                            ('0' + (parsedDate.getMonth() + 1)).slice(-2) + '-' + 
                            ('0' + parsedDate.getDate()).slice(-2);
        
        // Logging the formatted date for debugging.
        console.log('Selected Date (Formatted):', formattedDate);
        
        // You can now use the formattedDate variable in the required 'yyyy-mm-dd' format.
    } else {
        // Logging an error message if the date is invalid.
        console.log('Invalid Date:', selectedDate);
    }
    
    // Retrieving additional selections like device ID.
    // It seems like there are two variables declared for selectedDeviceId; this could be a mistake.
    // The second declaration of selectedDeviceId should probably be currentSelectedDeviceId.
    var selectedDate = getSelectedDate();
    var selectedDeviceId = getSelectedDeviceId();
    var currentSelectedDeviceId = $('#deviceList .dropdown-item.selected').data('deviceid');
    console.log('selected device ID (in date change listener): ', currentSelectedDeviceId);
    console.log('selected Date (in date change listener): ', selectedDate);

    // Calling getSensorData function with the selected device ID and date.
    // These calls seem to fetch sensor data for the day and week of the selected date.
    getSensorData(currentSelectedDeviceId, formattedDate, 'day');
    getSensorData(currentSelectedDeviceId, formattedDate, 'week');
}

// Event listener function for dropdown items in the patient selector.
function patientDropdownItemClickListener(e) {
    e.preventDefault(); // Prevents the default action of the event (useful if this is an anchor tag or a submit button).

    // Disabling the update frequency button initially.
    $('#updateFreqBtn').prop('disabled', true);

    // Retrieving the selected patient's email and name from the clicked dropdown item.
    var selectedPatientEmail = $(this).data('patientemail');
    var selectedPatientName = $(this).text();

    // Updating the UI to reflect the selected patient.
    updateSelectedPatientText(selectedPatientName);

    // Populating the device selector dropdown based on the selected patient.
    // A callback function is provided to execute after the dropdown is populated.
    populateDeviceSelectorDropdown(selectedPatientEmail, selectedPatientName, function() {
        // Fetching the device ID and name of the currently selected device from the device list.
        var selectedDeviceId = $('#deviceList .dropdown-item.selected').data('deviceid');
        var selectedDeviceName = $('#deviceList .dropdown-item.selected').text();
        var selectedDate = getSelectedDate(); // Function to get the currently selected date.

        // Logging for debugging purposes.
        console.log('current selected device name: ', selectedDeviceName);
        console.log('selected patient email: ', selectedPatientEmail);
        console.log('selected device ID: ', selectedDeviceId);
        console.log('selected Date: ', selectedDate);

        // Fetching sensor data for the selected device and date.
        getSensorData(selectedDeviceId, selectedDate, 'day');
        getSensorData(selectedDeviceId, selectedDate, 'week');
    });
}


// Event listener function for dropdown items in the device selector.
function deviceDropdownItemClickListener(e) {
    e.preventDefault(); // Prevents the default action of the event, which is useful for links.

    // Retrieving the selected device ID and name from the clicked dropdown item.
    var selectedDeviceId = $(this).data('deviceid');
    currentSelectedDeviceId = selectedDeviceId; // Storing the selected device ID in a global variable.
    var selectedDeviceName = $(this).text();

    // AJAX GET request to fetch information about the selected device.
    $.ajax({
        url: '/devices/info',
        method: 'GET',
        contentType: 'application/json',
        data: { deviceId: currentSelectedDeviceId }, // Sending the selected device ID as a request parameter.
        headers: { 'x-auth': window.localStorage.getItem("physician-token") }, // Setting authentication header.
        dataType: 'json',
    }).done(function(response) {
        // Logging the response from the server for debugging.
        console.log('response from server', response);

        // Updating the measurement frequency input field with the data from the server.
        $('#measurementFrequency').val(response.message.measurementFrequency);

        // Disabling the update frequency button initially.
        $('#updateFreqBtn').prop('disabled', true);
    }).fail(function(jqXHR) {
        // Logging errors if the AJAX request fails.
        console.log('An error occurred:', jqXHR);

        // Extracting and displaying the error message.
        var errorMessage = jqXHR.responseJSON ? jqXHR.responseJSON.message : jqXHR.responseText;
        console.log(errorMessage);
    });

    // Logging for debugging purposes.
    console.log('device dropdown item clicked');
    console.log('Selected device ID:', selectedDeviceId);
    console.log('Selected device Name:', selectedDeviceName);

    // Updating the UI to reflect the selected device.
    updateSelectedDeviceText(selectedDeviceName);

    // Retrieving the currently selected date.
    var selectedDate = getSelectedDate();

    // Fetching sensor data for the selected device and date.
    getSensorData(selectedDeviceId, selectedDate, 'day');
    getSensorData(selectedDeviceId, selectedDate, 'week');
}


// Event listener function for updating the measurement frequency.
function updateFreqListener(e) {
    // Retrieving the new measurement frequency value from the input field.
    var newMeasurementFrequency = $('#measurementFrequency').val();

    // AJAX PUT request to update the measurement frequency on the server.
    $.ajax({
        url: '/devices/update', // URL to the API endpoint for updating device information.
        method: 'PUT', // Using PUT method for update operation.
        contentType: 'application/json',
        data: JSON.stringify({ 
            measurementFrequency: newMeasurementFrequency, 
            deviceId: currentSelectedDeviceId // Including the current selected device ID.
        }), // Sending the new measurement frequency and device ID as JSON.
        headers: { 
            'x-auth': window.localStorage.getItem("physician-token") // Including authentication header.
        },
        success: function(response) {
            // Logging the success response from the server.
            console.log('Update successful', response);
            // Updating the original value with the new frequency.
            originalValue = newMeasurementFrequency;
        },
        error: function(error) {
            // Logging the error in case the update fails.
            console.log('Error in updating', error);
            // Showing a modal or alert to inform the user about the error.
            // This assumes you have a showMessageModal function to display errors.
            showMessageModal('Error', error.responseJSON.message || 'An error occurred', 'error');
        }
    });
}

// Event listener function for handling the logout event.
function logoutEventListener(e) {
    e.preventDefault(); // Prevents the default action of the event (e.g., if it's attached to a submit button or a link).

    // Removing the stored physician's token from local storage.
    window.localStorage.removeItem("physician-token");

    // Removing the stored physician's email from local storage.
    window.localStorage.removeItem("physician-email");

    // Redirecting the user to the physician login page.
    window.location.href = '/physician-login.html';
}

// ==================== End of Event Listeners ====================


// ====================  Helper Functions =========================
// Function to populate the dropdown with the list of devices registered to the user update the chart
var deviceIdToDeviceName = {};
var deviceNameToDeviceId = {};

// Function to populate the device selector dropdown based on the patient's email.
function populateDeviceSelectorDropdown(patientEmail, patientName, callback) {
    // Logging for debugging purposes.
    console.log('patient name: ', patientName);
    console.log('Getting all devices registered to', patientEmail + ' for patient ' + patientName);

    // Data object containing the patient's email.
    var data = { email: patientEmail };

    // AJAX GET request to fetch devices associated with the given patient email.
    $.ajax({
        url: '/devices/physicianRead',
        method: 'GET',
        contentType: 'application/json',
        data: data,
        headers: { 'x-auth': window.localStorage.getItem("physician-token") }, // Authentication header.
        dataType: 'json',
    })
    .done(function(response) {
        // Logging the response from the server.
        console.log('response from server', response);

        // Emptying the current device list before populating new items.
        $('#deviceList').empty();

        var isFirstItem = true;

        // Iterating over each device in the response and creating dropdown items.
        response.forEach(function(device) {
            var option = $('<a>')
                .addClass('dropdown-item')
                .text(device.deviceName)
                .attr('data-deviceid', device.deviceId);

            // Automatically select the first device in the list.
            if (isFirstItem) {
                option.addClass('selected');
                $('#selectedDeviceText').text(device.deviceName);
                console.log('measurement frequency: ', device.measurementFrequency);
                $('#measurementFrequency').val(device.measurementFrequency);
                currentSelectedDeviceId = device.deviceId;
                isFirstItem = false;
            }

            $('#deviceList').append(option);
        });

        // Listener for changes in the measurement frequency input.
        var originalValue = $('#measurementFrequency').val();
        $('#measurementFrequency').on('change', function() {
            var currentValue = $(this).val();
            console.log('current value: ', currentValue);
            console.log('original value: ', originalValue);

            // Enable the update button if the current value differs from the original value.
            if(currentValue !== originalValue){
                $('#updateFreqBtn').prop('disabled', false);
            } else {
                $('#updateFreqBtn').prop('disabled', true);
            }
        });

        // Re-initializing the Bootstrap dropdown.
        $('.dropdown-toggle').dropdown();

        // Fetching sensor data for the initially selected device.
        var selectedDeviceId = getSelectedDeviceId();
        var selectedDate = getSelectedDate();
        console.log('selected device ID (in pop patient selector): ', selectedDeviceId);
        console.log('selected Date (in pop patient selector): ', selectedDate);
        getSensorData(selectedDeviceId, selectedDate, 'day');
        getSensorData(selectedDeviceId, selectedDate, 'week');

        // Execute the callback function if it's provided.
        if (typeof callback === "function") {
            callback();
        }
    })
    .fail(function(error) {
        // Logging the error and clearing old data in case of a failure.
        console.log(error);
        clearOldData();
        clearOldPatientSettings();
    });
}

// Function to populate the patient selector dropdown.
function populatePatientSelectorDropdown() {
    // AJAX GET request to fetch patient information.
    $.ajax({
        url: '/physicians/read/', // URL to the API endpoint for reading physician info.
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("physician-token") }, // Setting authentication header.
        dataType: 'json'
    })
    .done(function(response) {
        // Extracting patients data from the response.
        var patients = response.physicianInfo.patients;
        var isFirstItem = true;

        // Iterating over each patient to create dropdown items.
        patients.forEach(function(patient) {
            var option = $('<a>')
                .addClass('dropdown-item')
                .text(patient.firstName + ' ' + patient.lastName) // Setting text to patient's full name.
                .attr('data-patientid', patient._id) // Storing patient ID as a data attribute.
                .attr('data-patientemail', patient.email); // Storing patient email as a new data attribute.
        
            // Selecting the first patient by default.
            if (isFirstItem) {
                option.addClass('selected');
                isFirstItem = false;
        
                // Setting the default selected patient's name in the UI.
                $('#selectedPatientText').text(patient.firstName + ' ' + patient.lastName);
            }
        
            // Prepending the new option to the dropdown list.
            $('#patientList').prepend(option);
        });
        
        // Re-initializing the Bootstrap dropdown.
        $('.dropdown-toggle').dropdown();

        // Retrieving the ID and email of the default selected patient.
        var defaultSelectedPatientId = $('#patientList .dropdown-item.selected').data('patientid');
        console.log('Default selected patient ID:', defaultSelectedPatientId);
        var defaultSelectedPatientEmail = $('#patientList .dropdown-item.selected').data('patientemail');
        console.log('Default selected patient email:', defaultSelectedPatientEmail);
        var defaultSelectedPatientName = $('#patientList .dropdown-item.selected').text();

        // Populating the device selector dropdown for the default selected patient.
        populateDeviceSelectorDropdown(defaultSelectedPatientEmail, defaultSelectedPatientName);
        // Additional functionality to fetch sensor data can be added here.
    })
    .fail(function(error) {
        // Logging the error if the AJAX request fails.
        console.log(error);
    });
}

// Function to get the selected device ID
function getSelectedDeviceId() {
    return $('#deviceList .dropdown-item.selected').data('deviceid'); // returns the deviceId corresponding to the selected device name
}

// Function to get the selected device name
function getSelectedDeviceName() {
    var selectedDeviceName = $('#selectedDeviceText').text();
    return selectedDeviceName;
}
// Function to get the selected device ID
function getSelectedPatientId() {
    var selectedDeviceName = $('#selectedDeviceText').text();
    return deviceNameToDeviceId[selectedDeviceName]; // returns the deviceId corresponding to the selected device name  
}
// Function to get the selected device name
function getSelectedPatientName() {
    var selectedDeviceName = $('#selectedDeviceText').text();
    return selectedDeviceName;
}
// Function to get the selected date
function getSelectedDate(){

    var selectedDate = $('#datepicker-input').val();
    
    // Parse the selected date as a JavaScript Date object
    var parsedDate = new Date(selectedDate);
    
    // Check if the date is valid
    if (!isNaN(parsedDate.getTime())) {
        // Format the date as yyyy-mm-dd
        var formattedDate = parsedDate.getFullYear() + '-' + 
                            ('0' + (parsedDate.getMonth() + 1)).slice(-2) + '-' + 
                            ('0' + parsedDate.getDate()).slice(-2);
        
    // You can now use the formattedDate variable with the "yyyy-mm-dd" format.
    } else {
        console.log('Invalid Date:', selectedDate);
    }
    return formattedDate;
}
// Function to update the selected device text
function updateSelectedPatientText(patientName) {
    $('#selectedPatientText').text(patientName);
}
// Function to update the selected device text
function updateSelectedDeviceText(deviceName) {
    $('#selectedDeviceText').text(deviceName);
}
// Function to get the sensor data for the selected device and date and plot it
function getSensorData(deviceId, selectedDate, span){
    var data = {
        deviceId: deviceId,
        selectedDate: selectedDate,
    };

    $.ajax({
        url: '/sensorData/read/' + span,
        method: 'GET',
        contentType: 'application/json',
        data: data,
        headers: { 'x-auth': window.localStorage.getItem("physician-token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('sensor data: ', response);
        if (span === 'day') {
            populateCharts(response);
        }
        else if (span === 'week') {
            populateWeeklySummary(response);
        }
        
    })
    .fail(function(error) {
        console.log('No sensor data found for this device and date.')
        console.log(error);
        clearOldData();
    });   
}
// Function to plot the data
function plot(chartId, x, y, unit, label) {
    const { max, maxIndex } = findMax(y);
    const { min, minIndex } = findMin(y);
    var ctx = document.getElementById(chartId);
    let delayed;
    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: label,
                lineTension: 0,
                backgroundColor: "rgba(78, 115, 223, 0.05)",
                borderColor: "rgba(78, 115, 223, 1)",
                pointRadius: 5,
                pointBackgroundColor: "rgba(78, 115, 223, 1)",
                pointBorderColor: "rgba(78, 115, 223, 1)",
                pointHoverRadius: 3,
                pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                pointHitRadius: 10,
                pointBorderWidth: 2,
                data: y,
                pointRadius: y.map((value, index) => {
                    if (index === maxIndex || index === minIndex) return 7; // Larger radius
                    return 5;
                }),
                pointBackgroundColor: y.map((value, index) => {
                    if (index === maxIndex) return 'red'; // Color for max
                    if (index === minIndex) return 'blue';  // Color for min
                    return "rgba(78, 115, 223, 1)";
                }),
                pointBorderColor: y.map((value, index) => {
                    if (index === maxIndex) return 'darkred';
                    if (index === minIndex) return 'darkblue';
                    return "rgba(78, 115, 223, 1)";
                }),
                animation: {
                    onComplete: () => {
                        delayed: true;
                    },
                    delay: (context) => {
                        let delay = 0;
                        console.log('context: ', context.type);
                        if (context.type === 'data' && context.mode === 'default') {
                            delay = context.dataIndex * 300;
                        }
                        return delay;
                    },
                }
            }],
        },
        options: {

            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 5,
                    bottom: 0
                }
            },
            scales: {
                xAxes: [{
                    time: {
                        unit: 'date'
                    },
                    gridLines: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxTicksLimit: 50,
                        minRotation: 45,
                    }
                }],
                yAxes: [{
                    ticks: {
                        maxTicksLimit: 10,
                        padding: 10,
                        callback: function(value, index, values) {
                            return value;
                        }
                    },
                    gridLines: {
                        color: "rgb(234, 236, 244)",
                        zeroLineColor: "rgb(234, 236, 244)",
                        drawBorder: false,
                        borderDash: [2],
                        zeroLineBorderDash: [2]
                    },
                    scaleLabel: {
                        display: true,
                        labelString: unit,
                        fontStyle: 'bold',
                        fontSize: 16,
                        fontFamily: 'Arial',
                    }
                }],
            },
            legend: {
                display: true,
                position: 'top', // Position the legend at the top
                align: 'end', // Align to the end, making it columnar
                labels: {
                  boxWidth: 40,
                  padding: 20,
                  usePointStyle: true, // Use the point style for the legend
                  generateLabels: function(chart) {
                    // Generate custom labels for max and min values
                    var data = chart.data.datasets[0].data;
                    const { max, maxIndex } = findMax(data);
                    const { min, minIndex } = findMin(data);
                    return [
                      {
                        text: 'Max: ' + max + ' ' + unit, // Include the actual max value
                        fillStyle: 'red',
                        strokeStyle: 'darkred',
                        lineWidth: 2,
                        pointStyle: 'rectRounded'
                      },
                      {
                        text: 'Min: ' + min + ' ' + unit, // Include the actual min value
                        fillStyle: 'blue',
                        strokeStyle: 'darkblue',
                        lineWidth: 2,
                        pointStyle: 'rectRounded'
                      }
                    ];
                  }
                }
              },
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                titleMarginBottom: 10,
                titleFontColor: '#6e707e',
                titleFontSize: 14,
                borderColor: '#dddfeb',
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: false,
                intersect: false,
                mode: 'index',
                caretPadding: 10,
                callbacks: {
                    label: function(tooltipItem, chart) {
                        var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
                        return datasetLabel + ': ' + tooltipItem.yLabel + unit;
                    },
                    afterLabel: function(tooltipItem, chart) {
                        if (tooltipItem.index === maxIndex) {
                            return 'Max: ' + max + unit;
                        }
                        if (tooltipItem.index === minIndex) {
                            return 'Min: ' + min + unit;
                        }
                        return null;
                    }
                }
            }
        }
    });
    return myLineChart;
}
function clearOldData()
{
    // Destroy the existing charts
    if (heartRateChart && oxygenSaturationChart){
        heartRateChart.destroy();
        oxygenSaturationChart.destroy();
    }

    // Clear the weekly summary cards
    $("#avg-hr").text("--");
    $("#max-hr").text("--");
    $("#min-hr").text("--");
    $("#avg-o2").text("--");
    $("#max-o2").text("--");
    $("#min-o2").text("--");

}

function clearOldPatientSettings(){
    // Clear the device selector dropdown
    $('#deviceList').empty();
    // Clear the selected device text
    $('#selectedDeviceText').text('Select Device');
    // Clear the measurement frequency
    $('#measurementFrequency').val('');
    // Clear the charts
    clearOldData();

}
// Function to populate the weekly summary cards
function populateWeeklySummary(response){
    const [heartrateData, spo2Data, timeData] = extractData(response);
    console.log('populating weekly summary: ', response)
    // Calculate stats for the week
    const average = array => array.reduce((a, b) => a + b) / array.length;
    var avgHeartRate = average(heartrateData);
    var maxHeartRate = Math.max(...heartrateData);
    var minHeartRate = Math.min(...heartrateData);
    var avgOxygenSaturation =  average(spo2Data);
    var maxOxygenSaturation =  Math.max(...spo2Data);
    var minOxygenSaturation = Math.min(...spo2Data);

    // Update the weekly summary cards
    $("#avg-hr").text(avgHeartRate.toFixed(1) + ' bpm');
    $("#max-hr").text(maxHeartRate + ' bpm');
    $("#min-hr").text(minHeartRate  + ' bpm');
    $("#avg-o2").text(avgOxygenSaturation.toFixed(1) + ' %');
    $("#max-o2").text(maxOxygenSaturation + ' %');
    $("#min-o2").text(minOxygenSaturation + ' %');

    console.log('heartrate in weekly', heartrateData);

}

function findMax(data) {
    let max = Math.max(...data);
    let maxIndex = data.indexOf(max);
    return { max, maxIndex };
}

function findMin(data) {
    let min = Math.min(...data);
    let minIndex = data.indexOf(min);
    return { min, minIndex };
}

// Initialize chart variables (assuming they are initially created elsewhere)
var heartRateChart = null;
var oxygenSaturationChart = null;
// Function to populate the line charts
function populateCharts(response){

    const [heartrateData, spo2Data, timeData] = extractData(response);
    console.log('heartrate data: ', heartrateData);
    console.log('spo2 data: ', spo2Data);   
    console.log('time data: ', timeData);

    // Check if the charts have been initialized
    if (heartRateChart && oxygenSaturationChart) {
        // Destroy the existing charts
        heartRateChart.destroy();
        oxygenSaturationChart.destroy();
    }

    // Plot the new data and store the chart instances
    heartRateChart = plot('heartRateChart', timeData, heartrateData, ' bpm', 'Heart Rate');
    oxygenSaturationChart = plot('oxygenSaturationChart', timeData, spo2Data, ' %', 'Oxygen Saturation');
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
    [heartrateData, spo2Data, timeData] = sortByMeasurementTime(data);

    return [heartrateData, spo2Data, timeData];

}

// Function to sort data by measurement time
function sortByMeasurementTime(data) {
    // Unpack the data
    const [heartrateData, spo2Data, time] = data;
    // Create an array of objects that include the time and both data points
    const combinedArray = time.map((time, index) => ({
    time,
    heartrate: heartrateData[index],
    spo2: spo2Data[index]
    }));
  
    // Sort the combined array based on the time string
    combinedArray.sort((a, b) => {
        // Convert time strings to date objects
        const timeA = new Date('1970/01/01 ' + a.time);
        const timeB = new Date('1970/01/01 ' + b.time);
        return timeA - timeB;
    });
    
    // Separate the sorted data back into individual arrays
    const sortedTime = combinedArray.map(item => item.time);
    const sortedHeartrateData = combinedArray.map(item => item.heartrate);
    const sortedSpo2Data = combinedArray.map(item => item.spo2);

    return [sortedHeartrateData, sortedSpo2Data, sortedTime];
}

// Function to get the user info
function getPhysicianInfo() {
    console.log('physician token ', window.localStorage.getItem("physician-token"));
    $.ajax({
        url: '/physicians/read/',
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("physician-token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('response from server (in get physician info)', response);
        $('#physicianFullName').text('Dr. ' + response.physicianInfo.firstName + ' ' + response.physicianInfo.lastName);
    })
    .fail(function(error) {
        console.log(error);
    });
}

function showMessageModal(title, message, type) {
    var modal = $('#genericModal');
    modal.find('.modal-title').text(title);
    modal.find('.modal-body #genericMessage').text(message);
    modal.modal('show');
}
// ==================== End of Helper Functions ====================