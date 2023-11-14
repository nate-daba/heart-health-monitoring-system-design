$(document).ready(function(){
    $('#registerDeviceForm').on('submit', function(e){
        e.preventDefault();
        var deviceId = $('#inputDeviceId').val();
        $.ajax({
            url: '/devices/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({deviceId: deviceId}),
            headers: {'x-auth': window.localStorage.getItem("token")},
            dataType: 'json',
        })
        .done(function(response){
            // Convert JSON object to string and prettify it
            var prettyJson = JSON.stringify(response, null, 4);
            // Create a <pre> element to display the formatted JSON
            var pre = $('<pre>').text(prettyJson);
            // Append it to the body or any container you want to display it in
            $('body').html(pre);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            // Handle failure response
            var errorJson = JSON.stringify({
                status: jqXHR.status,
                statusText: jqXHR.statusText,
                responseText: jqXHR.responseText
            }, null, 4);
            $('body').html($('<pre>').text(errorJson));
        });
    });
});