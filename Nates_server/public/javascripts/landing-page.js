// Callback function to register a Patient
function regPatient() {
    // Forward user to signup.html
    window.location.href = 'signup.html';
}

// Callback function to login a Patient
function loginPatient() {
    // Forward user to login.html
    window.location.href = 'login.html';
};

// Callback function to register a Physician
function regPhysician() {
    // Forward user to signup-physician.html
    window.location.href = 'signup-physician.html';
}

// Callback function to login a Physician
function loginPhysician() {
    // Forward user to login-physician.html
    window.location.href = 'login-physician.html';
}

$(document).ready(function() {
    $('#reg-patient').on('click', regPatient);
    $('#login-patient').on('click', loginPatient);
    $('#reg-physician').on('click', regPhysician);
    $('#login-physician').on('click', loginPhysician);
});

