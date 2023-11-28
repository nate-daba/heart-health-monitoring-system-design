// sign up callback function
function signUp(e) {
    e.preventDefault();
    $('.errorDiv p').empty();                         // clear previous error messages
    $('.errorDiv').hide();

    let firstName = $('#firstName');
    let lastName = $('#lastName');
    let email = $('#email');
    let password = $('#password');
    let confirmPassword = $('#confirmPassword');

    // store validation errors
    let validationErrors = [];

    // validate first name
    if (firstName.val().length < 1) {
        validationErrors.append("First name cannot be empty.<br>");
        firstName.css('border', '2px solid red');
    } else {
        firstName.css('border', '1px solid #ccc');
    }

    // validate last name
    if (lastName.val().length < 1) {
        validationErrors.push("Last name cannot be empty.<br>");
        lastName.css('border', '2px solid red');
    } else {
        lastName.css('border', '1px solid #ccc');
    }

    // validate email
    let emailReq = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    if (email.val().length < 1) {
        validationErrors.push("Email cannot be empty.<br>");
        email.css('border', '2px solid red');
    } else if (!email.val().match(emailReq)) {
        validationErrors.push("Invalid email address.<br>");
        email.css('border', '2px solid red');
    } else {
        email.css('border', '1px solid #ccc');
    }
    
    // validate password confirmation
    if (password.val() !== confirmPassword.val()) {
        validationErrors.push("Password and confirmation password do not match.");
        confirmPassword.css('border', '2px solid red');
    } else {
        confirmPassword.css('border', '1px solid #ccc');
    }

    // validate password
    if (password.val().length < 1) {
        validationErrors.push("Password cannot be empty.<br>");
        password.css('border', '2px solid red');
    } else if (password.val().length < 10 || password.val().length > 20) {
        validationErrors.push("Password must be between 10 and 20 characters in length.<br>");
        password.css('border', '2px solid red');
    } 
    if (!password.val().match(/[a-z]/)) {
        validationErrors.push("Password must contain at least one lowercase character.<br>");
        password.css('border', '2px solid red');
    } 
    if (!password.val().match(/[A-Z]/)) {
        validationErrors.push("Password must contain at least one uppercase character.<br>");
        password.css('border', '2px solid red');
    }
    if (!password.val().match(/[0-9]/)) {
        validationErrors.push("Password must contain at least one digit.<br>");
        password.css('border', '2px solid red');
    } else {
        password.css('border', '1px solid #ccc');
    }

    // display validation errors
    if (validationErrors !== 0) {
        for (let error in validationErrors) {
            $('.errorDiv p').append(validationErrors[error] + '<br>');
        }
        $('.errorDiv').show();
        return;
    }

    let newUserData = {
        firstName: firstName.val(),
        lastName: lastName.val(),
        email: email.val(),
        password: password.val()
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
        if (err.status === 409) {
            handleValidationError(email, err.responseJSON.message);
        }
    });
}

$(document).ready(function() {
    $('#signUpForm').on('submit', signUp);
});