Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

// ====================  Event Listeners =========================
// Event listener for the document ready event
$(document).ready(function() {

    // Initialize the dropdown
    $('.dropdown-toggle').dropdown();

    // Attach the click event listener to a parent element
    // and delegate it to the dynamic dropdown items
    $('#deviceList').on('click', '.dropdown-item', dropdownItemClickListener);

    // Attach the change event listener to the datepicker input
    $('#datepicker-input').on('change', dateChangeListener);

    // populate the dropdown with the list of devices registered to the user
    populateDeviceSelectorDropdown();

    // Register log out button click event listener
    $('#logout').on('click', logoutEventListener);
});
// Event listener for the datepicker input
function dateChangeListener(e) {
    e.preventDefault();
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

}
// Event listener for the dropdown items in the device selector
function dropdownItemClickListener(e) {
    // prevent the default behavior of the link
    e.preventDefault();
    
    // get the text of the clicked element
    var deviceId = $(this).text();
    if (deviceId === 'Add new device') {
        window.location.href = '/manage-devices.html';
    }
    // update the text of the selected device
    updateSelectedDeviceText(deviceId);
    console.log('selected device: ', getSelectedDeviceId());
    // get current selected date and selected device
    var selectedDate = getSelectedDate();
    var selectedDeviceId = getSelectedDeviceId();
    
    // get the sensor data for the selected device and date
    getSensorData(selectedDeviceId, selectedDate, 'day');
    getSensorData(selectedDeviceId, selectedDate, 'week');
}
function logoutEventListener(e) {
    e.preventDefault();
    window.localStorage.removeItem("token");
    window.location.href = '/login.html';
}
// ==================== End of Event Listeners ====================


// ====================  Helper Functions =========================
// Function to populate the dropdown with the list of devices registered to the user update the chart
function populateDeviceSelectorDropdown() {
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
        console.log('response from server', response);
        response.forEach(function(device){
            var option = $('<a>').addClass('dropdown-item').text(device.deviceId);
            $('#deviceList').prepend(option);
        });
        
        // Set the default device ID (the first device from the list)
        if (response.length > 0) {
            selectedDeviceId = response[0].deviceId;
            updateSelectedDeviceText(selectedDeviceId);
            // console.log('selected device id (in populate): ', $('#selectedDeviceText').text());

            // Now that the dropdown is populated, you can log the values
            var selectedDate = getSelectedDate();
            var selectedDeviceId = getSelectedDeviceId();
            console.log('selected device id (in populate): ', selectedDeviceId);
            console.log('selected date (in populate): ', selectedDate);
            getSensorData(selectedDeviceId, selectedDate, 'day');
            getSensorData(selectedDeviceId, selectedDate, 'week');
        }
        // else hide the entire content of the page and display "No devices registered"
    })
    .fail(function(error) {
        console.log(error);
    });

}
// Function to get the selected device ID
function getSelectedDeviceId() {
    return $('#selectedDeviceText').text(); // returns the text of the selected device  
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
function updateSelectedDeviceText(deviceId) {
    $('#selectedDeviceText').text(deviceId);
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
        headers: { 'x-auth': window.localStorage.getItem("token") },
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
                    top: 25,
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
                display: false
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
// Function to populate the weekly summary cards
function populateWeeklySummary(response){
    const [heartrateData, spo2Data, timeData] = extractData(response);

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
// ==================== End of Helper Functions ====================