// sign up callback function
function signUp(e) {
    e.preventDefault();
    $('.errorDiv').hide();

    let email = $(`#email`);
    let password = $(`#password`);
    let firstName = $(`#firstName`);
    let lastName = $(`#lastName`);

    // email is not empty
    if (email.val() === "") {
        $('.errorDiv p').text("Email cannot be empty.");
        $('.errorDiv').show();
        //window.alert("Email can not be empty.");
        return;
    }

    // new - email is valid
    let emailReq = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    if ((!(email.match(emailReq)))) {
        //window.alert("Invalid email address.");
        $('.errorDiv p').text("Invalid email address.");
        $('.errorDiv').show();
        return;
    }

    // password is not empty
    if (password.val() === "") {
        window.alert("Password can not be empty.");
        $('.errorDiv p').text("Password can not be empty.");
        $('.errorDiv').show();
        return;
    }

    // new - password is between 10 and 20 characters
    if (!((password.length < 10) || (password.length > 20))) {             
        window.alert("Password must be between 10 and 20 characters in length.");
        $('.errorDiv p').text("Password must be between 10 and 20 characters in length.");
        $('.errorDiv').show();
    }

    // new - password contains a lowercase character
    let lowCase = /[a-z]/;
    if (!(password.match(lowCase))) {
        window.alert("Password must contain at least one lowercase character.");
        $('.errorDiv p').text("Password must contain at least one lowercase character.");
        $('.errorDiv').show();
    }

    // new - password contains an uppercase character
    let upCase = /A-Z/;
    if (!(password.match(upCase))) {
        window.alert("Password must contain at least one uppercase character.");
        $('.errorDiv p').text("Password must contain at least one uppercase character.");
        $('.errorDiv').show();
    }

    // new - password contains a digit
    let digitCheck = /[0-9]/;
    if ((!(password.match(digitCheck)))) {
        window.alert("Password must contain at least one digit.");
        $('.errorDiv p').text("Password must contain at least one digit.");
        $('.errorDiv').show();
    }

    // passwrod and confirmation password match
    if(password.val() !== $('#confirmPassword').val()) {
        window.alert("Password and confirmation password do not match.");
        $('.errorDiv p').text("Passwrd and confirmation password do not match.");
        $('.errorDiv').show();
        return;
    }

    // first name field is not empty
    if (firstName.val() === "") {
        window.alert("First name can not be empty.");
        $('.errorDiv p').text("First name can not be empty.");
        $('.errorDiv').show();
        return;
    }

    // last name field is not empty
    if (lastName.val() === "") {
        window.alert("Last name can not be empty.");
        $('.errorDiv p').text("Last name can not be empty.");
        $('.errorDiv').show();
        return;
    }

    // add more validations to check if the email is valid, etc.
    

    let newUserData = {
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        email: $('#email').val(),
        password: $('#password').val()
    };

    $.ajax({
        url: '/users/signUp',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newUserData),
        dataType: 'json'
    })
    .done(function(data) {
        console.log(data);
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("email", newUserData.email);
        window.location.href = '/dashboard.html'; // Redirect to the device registration page
    })
    .fail(function(err) {
        console.log(err.responseJSON.message);
        if(err.status === 409) {
            $('.errorDiv p').text(err.responseJSON.message);
            $('.errorDiv').show();
        }
    });
};

// document ready function

$(document).ready(function() {
    
    $('#signUpForm').on('submit', signUp);
});
