// sign up callback function
function signUp(e) {
    e.preventDefault();
    // data validation
    if ($('#email').val() === "") {
        window.alert("Email can not be empty.");
        return;
    }
    if ($('#password').val() === "") {
        window.alert("Password can not be empty.");
        return;
    }
    // data validation
    if ($('#firstName').val() === "") {
        window.alert("First name can not be empty.");
        return;
    }
    if ($('#lastName').val() === "") {
        window.alert("Last name can not be empty.");
        return;
    }

    if($('#password').val() !== $('#confirmPassword').val()) {
        window.alert("Passwords do not match.");
        return;
    }

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
    .done(function (data, textStatus, jqXHR) {
        console.log(data);
        localStorage.setItem("token", data.access_token);
        window.location.href = '/device-registration.html'; // Redirect to the device registration page
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        console.log(err);
    });
};

$(document).ready(function() {
    console.log("signUp.js ready");
    $('#signUpForm').on('submit', signUp);
});