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
            window.localStorage.setItem("physician-email", email);
            window.localStorage.setItem("physician-token", data.token);
            window.localStorage.setItem('comingFrom', 'physician-login');
            window.location.href = '/physician-dashboard.html'; // Redirect to the device registration page
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

