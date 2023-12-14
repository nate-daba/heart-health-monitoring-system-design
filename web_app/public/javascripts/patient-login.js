// Login callback function
function logIn(e) {
    e.preventDefault();
    $('.errorDiv').addClass('d-none').removeClass('d-block');
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
        url: '/patients/login',
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
            $('.errorDiv').removeClass('d-none').addClass('d-block');
        }
    })
    .fail(function(err){
        $('.errorDiv').removeClass('d-none').addClass('d-block');
    });
};

$(document).ready(function() {
    $('#loginForm').on('submit', logIn); // Changed to listen on form submit
});

