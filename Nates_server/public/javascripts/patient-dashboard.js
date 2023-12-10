Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

// ====================  Event Listeners =========================
// Event listener for the document ready event
$(document).ready(function() {
    // Set the default timezone to Phoenix
    moment.tz.setDefault("America/Phoenix");
    // Initialize the dropdown
    $('.dropdown-toggle').dropdown();

    // Attach the click event listener to a parent element
    // and delegate it to the dynamic dropdown items
    $('#deviceList').on('click', '.dropdown-item', dropdownItemClickListener);

    // Attach the change event listener to the datepicker input
    $('#datepicker-input').on('change', dateChangeListener);

    getPatientInfo();
    // populate the dropdown with the list of devices registered to the patient
    populateDeviceSelectorDropdown();

    // Register log out button click event listener
    $('#logout').on('click', logoutEventListener);

    $('#datepicker').datepicker({
        // This ensures the date is set to the current date in Arizona time zone
        defaultDate: moment().tz("America/Phoenix").format('MM-DD-YYYY')
    });

    $('#refreshDevicesBtn').on('click', dateChangeListener);
});

// Event listener for the datepicker input
function dateChangeListener(e) {
    // e.preventDefault();
    var selectedDate = $('#datepicker-input').val();
    
    // Parse the selected date as a JavaScript Date object
    var parsedDate = new Date(selectedDate);
    
    // Check if the date is valid
    if (!isNaN(parsedDate.getTime())) {
        // Format the date as yyyy-mm-dd
        var formattedDate = parsedDate.getFullYear() + '-' + 
                            ('0' + (parsedDate.getMonth() + 1)).slice(-2) + '-' + 
                            ('0' + parsedDate.getDate()).slice(-2);
        
        console.log('Selected Date (Formatted):', formattedDate);
        
        // You can now use the formattedDate variable with the "yyyy-mm-dd" format.
    } else {
        console.log('Invalid Date:', selectedDate);
    }
    
    var selectedDate = getSelectedDate();
    var selectedDeviceId = getSelectedDeviceId();

    getSensorData(selectedDeviceId, formattedDate, 'day');
    getSensorData(selectedDeviceId, formattedDate, 'week');

}
// Event listener for the dropdown items in the device selector
function dropdownItemClickListener(e) {
    e.preventDefault();
    if ($(this).text() === 'Add new device') {
        window.location.href = 'manage-devices.html';
    }
    else {
        // Update the selectedDeviceId with the data attribute of the clicked item
        selectedDeviceId = $(this).data('deviceid');
        
        var deviceName = $(this).text();
        updateSelectedDeviceText(deviceName);

        console.log('Selected device ID: ', selectedDeviceId);
        
        // Get current selected date and selected device
        var selectedDate = getSelectedDate();
        getSensorData(selectedDeviceId, selectedDate, 'day');
        getSensorData(selectedDeviceId, selectedDate, 'week');
    }
}
function logoutEventListener(e) {
    e.preventDefault();
    window.localStorage.removeItem("patient-token");
    window.localStorage.removeItem("patient-email");
    window.location.href = '/patient-login.html';
}
// ==================== End of Event Listeners ====================


// ====================  Helper Functions =========================
// Function to populate the dropdown with the list of devices registered to the patient update the chart
// Global variable to keep track of the selected device ID
var selectedDeviceId = null;

// Function to populate the dropdown with the list of devices registered to the patient
function populateDeviceSelectorDropdown() {

    $.ajax({
        url: '/devices/read',
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('response from server', response);
        response.forEach(function(device){
            console.log('device being added to dropdown: ', device);
            // Add device name to the dropdown with deviceId as data attribute
            var option = $('<a>').addClass('dropdown-item')
                                 .text(device.deviceName)
                                 .data('deviceid', device.deviceId);
            $('#deviceList').prepend(option);
        });

        // Set the default selected device if any
        if (response.length > 0) {
            selectedDeviceId = response[0].deviceId;
            updateSelectedDeviceText(response[0].deviceName);
            var selectedDate = getSelectedDate();
            getSensorData(selectedDeviceId, selectedDate, 'day');
            getSensorData(selectedDeviceId, selectedDate, 'week');
        }
    })
    .fail(function(error) {
        console.log(error);
    });
}


// Function to get the selected device ID
function getSelectedDeviceId() {
    return selectedDeviceId;
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
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
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
        console.log('No sensor data found for this device and date.' + ' Span:' + span)
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
                lineTension: 0.05,
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
    $("#avg-hr").text(avgHeartRate.toFixed(0) + ' bpm');
    $("#max-hr").text(maxHeartRate + ' bpm');
    $("#min-hr").text(minHeartRate  + ' bpm');
    $("#avg-o2").text(avgOxygenSaturation.toFixed(0) + ' %');
    $("#max-o2").text(maxOxygenSaturation + ' %');
    $("#min-o2").text(minOxygenSaturation + ' %');

    console.log('heartrate in weekly', heartrateData);

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

// Function to get the patient info
function getPatientInfo() {
    if (!window.localStorage.getItem("patient-token")) {
        console.log("No token found");
        return;
    }
    
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
// ==================== End of Helper Functions ====================