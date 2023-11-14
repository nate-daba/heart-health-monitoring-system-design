$(document).ready(function() {
    $('#createAccountForm').on('submit', function(e) {
        e.preventDefault();
        var email = $('#inputEmail').val();
        var password = $('#inputPassword').val();
        
        // Implement your login logic here
        console.log('Email:', email, 'Password:', password);
        
        // send data to backend
        let credentials = {
            email: email,
            password: password
        };
        $.ajax({
            url: '/users/signUp',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(credentials),
            dataType: 'json',
        })
        .done(function(data){
            console.log(data);
            localStorage.setItem("token", data.access_token);
            window.location.href = '/device-registration.html'; // Redirect to the device registration page
        })
        .fail(function(err){
            console.log(err);
        });
    
    });
});
