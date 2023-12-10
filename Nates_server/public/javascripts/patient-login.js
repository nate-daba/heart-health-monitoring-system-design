// Login callback function
function logIn(e) {
    e.preventDefault();
    $('.errorDiv').hide();
    console.log("login form submitted")
    var email = $('#email').val();
    var password = $('#password').val();
    
    // Implement your login logic here
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    
    // send data to backend
    let credentials = {
        email: email,
        password: password
    };
    // console.log('credentials: ', credentials);
    $.ajax({
        url: '/patients/logIn',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(credentials),
        dataType: 'json',
    })
    .done(function(data){
        console.log(data);
        if (data.success){
            window.localStorage.setItem("patient-token", data.patientToken);
            window.location.href = '/patient-dashboard.html'; // Redirect to the device registration page
        }
        else{
            $('.errorDiv').show();
        }
    })
    .fail(function(err){
        $('.errorDiv').show();
    });
};

$(document).ready(function() {
    $('#loginForm').on('submit', logIn); // Changed to listen on form submit
});

