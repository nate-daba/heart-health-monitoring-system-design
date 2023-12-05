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
        url: '/physicians/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(credentials),
        dataType: 'json',
    })
    .done(function(data){
        console.log(data);
        if (data.success){
            localStorage.setItem("physician-email", email);
            localStorage.setItem("physician-token", data.access_token);
            localStorage.setItem('comingFrom', 'login-physician');
            window.location.href = '/dashboard-physician.html'; // Redirect to the device registration page
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

