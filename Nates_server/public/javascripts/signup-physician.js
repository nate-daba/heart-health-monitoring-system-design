// document ready function

$(document).ready(function() {
    
    $('#signUpForm').on('submit', signUp);
    // Listeners for password input changes
    $('#password, #confirmPassword').on('input', checkPasswordFields);

});

// sign up callback function
function signUp(e) {
    e.preventDefault();
    $('.errorDiv').hide();
    // data validation
    var errorMessages = [];
    if ($('#email').val() === "") {
        errorMessages.push("Email can not be empty.");
    }
    if ($('#password').val() === "") {
        errorMessages.push("Password can not be empty.");
    }
    // data validation
    if ($('#firstName').val() === "") {
        errorMessages.push("First name can not be empty.");
    }
    if ($('#lastName').val() === "") {
        errorMessages.push("Last name can not be empty.");
    }

    if($('#password').val() !== $('#confirmPassword').val()) {
        errorMessages.push("Passwords do not match.");
    }
    var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    if (!emailRegex.test($('#email').val())) {
        errorMessages.push("Invalid or missing email address.");
    }
    // Display Error Messages
    console.log("errorMessages: " + errorMessages)
    if (errorMessages.length > 0) {
        console.log("got here")
        displayErrorMessages(errorMessages);
        return;
    }

    let newPhysicianData = {
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        email: $('#email').val(),
        password: $('#password').val(),
        specialty: $('#specialty').val() // Add the specialty field
    };

    $.ajax({
        url: '/physicians/signup',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newPhysicianData),
        dataType: 'json'
    })
    .done(function(data) {
        console.log(data);
        localStorage.setItem('physicianEmail', newPhysicianData.email);
        window.location.href = '/dashboard-physician.html'; // Redirect to the device registration page
    })
    .fail(function(err) {
        console.log("some physician registration error");
        console.log(err.responseJSON.message);
        if(err.status === 409) {
            // $('.errorDiv p').text(err.responseJSON.message);
            // $('.errorDiv').show();
            displayErrorMessages([err.responseJSON.message]);
        }
    });
};

function checkPasswordFields() {
    var currentPassword = $('#password').val();
    var confirmPassword = $('#confirmPassword').val();
    var errorMessages = [];
    console.log("currentPassword: " + currentPassword);
    if(currentPassword.length > 0) {
        // Validate New Password
        if (currentPassword.length < 10 || currentPassword.length > 20) {
            errorMessages.push("Password must be between 10 and 20 characters.");
        }
        if (!/[a-z]/.test(currentPassword)) {
            errorMessages.push("Password must contain at least one lowercase character.");
        }
        if (!/[A-Z]/.test(currentPassword)) {
            errorMessages.push("Password must contain at least one uppercase character.");
        }
        if (!/[0-9]/.test(currentPassword)) {
            errorMessages.push("Password must contain at least one digit.");
        }
        if ((confirmPassword.length > 0) && (currentPassword !== confirmPassword)) {
            errorMessages.push("Password and Confirm Password don't match.");
        }
    }

    // Enable Update Password button only if no errors and current password is not empty
    $('#signUpButton').prop('disabled', (errorMessages.length > 0 || currentPassword.length === 0));
    // Display Error Messages
    displayErrorMessages(errorMessages);
}

function displayErrorMessages(messages) {
    var errorMessageHtml = "<ul>";
    messages.forEach(function(message) {
        errorMessageHtml += "<li style=font-size:0.8em;text-align:left;margin-left:-27px;>" + message + "</li>";
    });
    errorMessageHtml += "</ul>";
    console.log("errorMessageHtml: " + errorMessageHtml)
    $('.errorDiv').html(errorMessageHtml);
    $('.errorDiv').show();
}
