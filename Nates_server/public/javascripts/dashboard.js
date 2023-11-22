Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

$(document).ready(function() {
    // Initialize the selected device ID as empty (no device selected)
    var selectedDeviceId = '';

    // Handle device selection
    $('#deviceList').on('click', '.dropdown-item', function(e) {
        e.preventDefault();
        selectedDeviceId = $(this).text();
        updateSelectedDeviceText(selectedDeviceId);
        $('#deviceId').val(selectedDeviceId);

        // Call the function to fetch sensor data and plot the chart
        getSensorData(selectedDeviceId);
    });
    // Call the function to populate the dropdown when the page loads
    populateSelectDeviceDropdown();

});

function updateSelectedDeviceText(deviceId) {
    $('#selectedDeviceText').text(deviceId);
}

// Function to populate the dropdown and update the chart
function populateSelectDeviceDropdown() {
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
        console.log(response);
        response.forEach(function(device){
            var option = $('<a>').addClass('dropdown-item').text(device.deviceId);
            $('#deviceList').prepend(option);
        });

        // Set the default device ID (the first device from the list)
        if (response.length > 0) {
            selectedDeviceId = response[0].deviceId;
            updateSelectedDeviceText(selectedDeviceId);

            // Call the function to fetch sensor data and plot the chart
            getSensorData(selectedDeviceId);
        }
    })
    .fail(function(error) {
        console.log(error);
    });
}



$('#deviceList').on('click', '.dropdown-item', function(e) {
    e.preventDefault();
    var deviceId = $(this).text();
    console.log('Device ID:', deviceId);
    $('#deviceId').val(deviceId);
    getSensorData(deviceId);
});

// give me a function called getSensordata that takes a deviceId as an argument
function getSensorData(deviceId){
    var data = {
        deviceId: deviceId
    };

    $.ajax({
        url: '/sensorData/read',
        method: 'GET',
        contentType: 'application/json',
        data: data,
        headers: { 'x-auth': window.localStorage.getItem("token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('sensor data: ', response);
        populateCharts(response);
        
    })
    .fail(function(error) {
        console.log(error);
    });   
}
function populateCharts(response){
    // loop through the response array, access the data object, and from the data 
    // object access the heartrate and spo2 proprieties and push them into two
    // separate arrays. Also push the time propriety into a third array. time is
    // stored in published_at property
    var heartrateData = [];
    var spo2Data = [];
    var timeData = [];
    response.forEach(function(data){
        heartrateData.push(data.data.heartrate);
        spo2Data.push(data.data.spo2);
        var date = new Date(data.published_at);
        var time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        timeData.push(time); // wrap published_at in new Date() to convert it to a date object
    });

    console.log('heartrate data: ', heartrateData);
    console.log('spo2 data: ', spo2Data);   
    console.log('time data: ', timeData);

    plot('heartRateChart', timeData, heartrateData, ' bpm', 'Heart Rate');
    plot('oxygenSaturationChart', timeData, spo2Data, ' %', 'Oxygen Saturation');
      

}

$('#logout').on('click', function(e) {
    e.preventDefault();
    window.localStorage.removeItem("token");
    window.location.href = '/login.html';
});

function plot(chartId, x, y, unit, label){

    var ctx = document.getElementById(chartId)
    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: x,
            datasets: [{
                label: label,
                lineTension: 0,
                backgroundColor: "rgba(78, 115, 223, 0.05)",
                borderColor: "rgba(78, 115, 223, 1)",
                pointRadius: 3,
                pointBackgroundColor: "rgba(78, 115, 223, 1)",
                pointBorderColor: "rgba(78, 115, 223, 1)",
                pointHoverRadius: 3,
                pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                pointHitRadius: 10,
                pointBorderWidth: 2,
                data: y,
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
                    maxTicksLimit: 20,
                    padding: 10,
                    // Include a dollar sign in the ticks
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
}