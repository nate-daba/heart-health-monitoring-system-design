// Login callback function executed when the login form is submitted.
function logIn(e) {
    e.preventDefault(); // Prevents the default form submission action.

    // Hides any previous error messages.
    $('.errorDiv').addClass('d-none').removeClass('d-block');
    console.log("login form submitted");

    // Retrieving email and password values from the form inputs.
    var email = $('#email').val();
    var password = $('#password').val();

    // Logging the credentials for debugging purposes. Implement your security best practices for production.
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    
    // Creating a credentials object with the email and password.
    let credentials = {
        email: email,
        password: password
    };
    // Commented out console.log, can be used for further debugging.
    // console.log('credentials: ', credentials);

    // AJAX POST request to send the login credentials to the server.
    $.ajax({
        url: '/physicians/login', // URL to the login API endpoint.
        method: 'POST',
        contentType: 'application/json', // Setting content type as JSON.
        data: JSON.stringify(credentials), // Sending the credentials as a JSON string.
        dataType: 'json', // Expects a JSON response from the server.
    })
    .done(function(data) {
        console.log(data);
        // If login is successful (based on the 'success' property in response data).
        if (data.success) {
            // Storing email and token in local storage for session management.
            window.localStorage.setItem("physician-email", email);
            window.localStorage.setItem("physician-token", data.physicianToken);
            window.localStorage.setItem('comingFrom', 'physician-login');
            // Redirecting to the physician dashboard upon successful login.
            window.location.href = '/physician-dashboard.html';
            console.log('physician token: ' + data.physicianToken);
        }
        else {
            // Show error message if login is unsuccessful.
            $('.errorDiv').removeClass('d-none').addClass('d-block');
        }
    })
    .fail(function(err) {
        // Showing error message if the AJAX request itself fails.
        $('.errorDiv').removeClass('d-none').addClass('d-block');
    });
};

$(document).ready(function() {
    $('#loginForm').on('submit', logIn); // Changed to listen on form submit
});

