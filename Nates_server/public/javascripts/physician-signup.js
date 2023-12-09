// jQuery document ready function ensures that the DOM is fully loaded before executing any script.
$(document).ready(function() {
    // Event listener for the signup form submission.
    $('#signUpForm').on('submit', signUp);

    // Event listeners for any input changes in the password and confirm password fields.
    $('#password, #confirmPassword').on('input', checkPasswordFields);
});

// Signup callback function is executed when the signup form is submitted.
function signUp(e) {
    e.preventDefault(); // Prevents the default form submission behavior.
    $('.errorDiv').hide(); // Hides the error div at the beginning of the function execution.

    // Data validation: Check if required fields are empty or not.
    var errorMessages = []; // Array to store error messages.
    if ($('#email').val() === "") {
        errorMessages.push("Email can not be empty.");
    }
    if ($('#password').val() === "") {
        errorMessages.push("Password can not be empty.");
    }
    if ($('#firstName').val() === "") {
        errorMessages.push("First name can not be empty.");
    }
    if ($('#lastName').val() === "") {
        errorMessages.push("Last name can not be empty.");
    }

    // Check if the password and confirm password fields match.
    if($('#password').val() !== $('#confirmPassword').val()) {
        errorMessages.push("Passwords do not match.");
    }

    // Regular expression to validate email format.
    var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    if (!emailRegex.test($('#email').val())) {
        errorMessages.push("Invalid or missing email address.");
    }

    // Displaying error messages if any validation fails.
    console.log("errorMessages: " + errorMessages);
    if (errorMessages.length > 0) {
        console.log("got here");
        displayErrorMessages(errorMessages);
        return;
    }

    // Constructing new physician data from the form input values.
    let newPhysicianData = {
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        email: $('#email').val(),
        password: $('#password').val(),
        specialty: $('#specialty').val() // Adding the specialty field.
    };

    // AJAX POST request to send the signup data to the server.
    $.ajax({
        url: '/physicians/signup',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newPhysicianData),
        dataType: 'json'
    })
    .done(function(data) {
        // On successful registration, log the data and set the token and email in local storage.
        console.log(data);
        window.localStorage.setItem('physician-token', data.token);
        window.localStorage.setItem('physician-email', newPhysicianData.email);
        // Redirecting to the physician dashboard page after successful registration.
        window.location.href = '/physician-dashboard.html';
    })
    .fail(function(err) {
        // Logging errors if the registration fails.
        console.log("some physician registration error");
        console.log(err.responseJSON.message);
        if(err.status === 409) {
            // Displaying error messages if a physician with the same email already exists.
            displayErrorMessages([err.responseJSON.message]);
        }
    });
};


// Function to check the password and confirm password fields for validity.
function checkPasswordFields() {
    // Getting the values from password and confirm password fields.
    var currentPassword = $('#password').val();
    var confirmPassword = $('#confirmPassword').val();
    var errorMessages = []; // Array to store error messages related to password validation.

    // Logging the current password for debugging purposes.
    console.log("currentPassword: " + currentPassword);

    // Checking if the password field is not empty before performing validations.
    if(currentPassword.length > 0) {
        // Validate New Password length to be between 10 and 20 characters.
        if (currentPassword.length < 10 || currentPassword.length > 20) {
            errorMessages.push("Password must be between 10 and 20 characters.");
        }
        // Validate New Password to contain at least one lowercase character.
        if (!/[a-z]/.test(currentPassword)) {
            errorMessages.push("Password must contain at least one lowercase character.");
        }
        // Validate New Password to contain at least one uppercase character.
        if (!/[A-Z]/.test(currentPassword)) {
            errorMessages.push("Password must contain at least one uppercase character.");
        }
        // Validate New Password to contain at least one digit.
        if (!/[0-9]/.test(currentPassword)) {
            errorMessages.push("Password must contain at least one digit.");
        }
        // Validate that the New Password and Confirm Password fields match.
        if ((confirmPassword.length > 0) && (currentPassword !== confirmPassword)) {
            errorMessages.push("Password and Confirm Password don't match.");
        }
    }

    // Enabling the Update Password button only if there are no errors and the current password is not empty.
    $('#signUpButton').prop('disabled', (errorMessages.length > 0 || currentPassword.length === 0));

    // Displaying the error messages, if any, using the displayErrorMessages function.
    displayErrorMessages(errorMessages);
}

// Function to display error messages in a formatted list.
function displayErrorMessages(messages) {
    // Starting an HTML string with an unordered list tag.
    var errorMessageHtml = "<ul>";

    // Looping through each message in the messages array.
    messages.forEach(function(message) {
        // Adding each message as a list item to the HTML string.
        // Inline CSS styles are applied for font size, text alignment, and margin.
        errorMessageHtml += "<li style='font-size:0.8em; text-align:left; margin-left:-27px;'>" + message + "</li>";
    });

    // Closing the unordered list tag.
    errorMessageHtml += "</ul>";

    // Logging the complete HTML string for debugging purposes.
    console.log("errorMessageHtml: " + errorMessageHtml);

    // Setting the inner HTML of the element with class 'errorDiv' to our errorMessageHtml string.
    $('.errorDiv').html(errorMessageHtml);

    // Making the errorDiv element visible.
    $('.errorDiv').show();
}

