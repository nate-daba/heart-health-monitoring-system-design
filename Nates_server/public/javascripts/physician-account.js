$(document).ready(function() {

    fetchAccountDetails();
    getPhysicianInfo();
    // Initialize originalData
    var originalData = {};

    $('#saveChangesBtn').on('click', saveChanges);
    $('#updatePasswordBtn').on('click', updatePassword);

    // Listeners for input changes
    $('#firstName, #lastName').on('input', function() {
        checkFieldsForChange();
    });

    // Focus listeners to enable editing
    $('#firstName, #lastName').on('focus', function() {
        $(this).removeAttr('readonly');
    });

    // Listeners for password input changes
    $('#currentPassword, #newPassword, #verifyPassword').on('input', checkPasswordFields);

    $('.toggle-password').on('click', function() {
        var $input = $(this).closest('.input-group').find('input');
        $input.attr('type', function(index, attr) {
            return attr === 'password' ? 'text' : 'password';
        });
    
        // Toggle the eye/eye-slash icon
        $(this).find('i').toggleClass('fa-eye fa-eye-slash');
    });

    // Open the modal when the delete button is clicked
    $('#deleteAccountBtn').click(function() {
        $('#deleteAccountModal').modal('show');
    });

    $('#confirmDeleteBtn').on('click', deleteAccount);

    // Listener for Delete Account Confirmation Modal. go to home.html
    $('#deleteAccountModal').on('hidden.bs.modal', function() {
        window.location.href = '/home.html';
    });
    
});

// Fetch account details and then set original data
function fetchAccountDetails() {

    $.ajax({
        url: 'physicians/read/',
        type: 'GET',
        dataType: 'json',
        headers: { 'x-auth': window.localStorage.getItem("physician-token") }, 
        success: function(response) {
            var physicianDoc = response.physicianDoc;
            if (physicianDoc) {
                $('#email').val(physicianDoc.email);
                $('#firstName').val(physicianDoc.firstName);
                $('#lastName').val(physicianDoc.lastName);

                // Set original data after fetching
                originalData = {
                    email: physicianDoc.email,
                    firstName: physicianDoc.firstName,
                    lastName: physicianDoc.lastName
                };
            } else {
                console.error('Invalid response format');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching account details:', error);
        }
    });
}

// Function to check if any fields have changed
function checkFieldsForChange() {
    var hasChanged = false;
    if ($('#firstName').val() !== originalData.firstName || $('#lastName').val() !== originalData.lastName) {
        hasChanged = true;
    }

    $('#saveChangesBtn').prop('disabled', !hasChanged);
}

// Function to check password fields for errors
function checkPasswordFields() {
    var currentPassword = $('#currentPassword').val();
    var newPassword = $('#newPassword').val();
    var verifyPassword = $('#verifyPassword').val();
    var errorMessages = [];

    if(newPassword.length > 0) {
        // Validate New Password
        if (newPassword.length < 10 || newPassword.length > 20) {
            errorMessages.push("New Password must be between 10 and 20 characters.");
        }
        if (!/[a-z]/.test(newPassword)) {
            errorMessages.push("New Password must contain at least one lowercase character.");
        }
        if (!/[A-Z]/.test(newPassword)) {
            errorMessages.push("New Password must contain at least one uppercase character.");
        }
        if (!/[0-9]/.test(newPassword)) {
            errorMessages.push("New Password must contain at least one digit.");
        }
        if (newPassword !== verifyPassword && verifyPassword.length > 0) {
            errorMessages.push("New Password and Verify password don't match.");
        }
    }

    // Enable Update Password button only if no errors and current password is not empty
    $('#updatePasswordBtn').prop('disabled', (errorMessages.length > 0 || currentPassword === '' || newPassword.length === 0 ));

    // Display Error Messages
    displayErrorMessages(errorMessages, 'passwordErrorMessages');
}

// Function to display error messages
function displayErrorMessages(messages, errorDivId) {
    var errorMessageHtml = "<ul>";
    messages.forEach(function(message) {
        errorMessageHtml += "<li>" + message + "</li>";
    });
    errorMessageHtml += "</ul>";

    $('#'+errorDivId).html(errorMessageHtml);
}
    

function saveChanges() {

    // input data validation
    var errorMessages = [];
    var firstName = $('#firstName').val();
    var lastName = $('#lastName').val();
    if (firstName.length == 0){
        errorMessages.push("First Name cannot be empty");
    }
    if (lastName.length == 0){
        errorMessages.push("Last Name cannot be empty");
    }
    if (errorMessages.length > 0){
        displayErrorMessages(errorMessages, 'physicianInfoErrorMessages');
        return;
    }
    var updatedData = {
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val()
    };

    $.ajax({
        url: 'physicians/update',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updatedData),
        headers: { 'x-auth': window.localStorage.getItem("physician-token") },
        dataType: 'json'
    }).done(function(response) {
        // Show success modal/message
        showMessageModal('Success', 'Account details updated successfully', 'success');
        // disable save changes button
        $('#saveChangesBtn').prop('disabled', true);
        // disable input fields
        $('#firstName, #lastName').attr('readonly', true);
        // update physicianFullName
        $('#physicianFullName').text(updatedData.firstName + ' ' + updatedData.lastName);

        // Update original data
        originalData = {
            firstName: updatedData.firstName,
            lastName: updatedData.lastName
        };
        
    }).fail(function(xhr, status, error) {
        // Show error message
        showMessageModal('Error', xhr.responseText.message || 'An error occurred', 'error');
    });
}

// Listener for Update Password button
function updatePassword() {
    var currentPassword = $('#currentPassword').val();
    var newPassword = $('#newPassword').val();
    var verifyPassword = $('#verifyPassword').val();

    if (newPassword !== verifyPassword) {
        $('#errorMessage').text("New Password and Verify Password don't match");
        return;
    }

    if (newPassword.length == 0){
        $('#errorMessage').text("New Password cannot be empty");
        return;
    }
    if (verifyPassword.length == 0){
        $('#errorMessage').text("Verify Password cannot be empty");
        return;
    }

    var passwordData = {
        currentPassword: currentPassword,
        newPassword: newPassword
    };

    $.ajax({
        url: 'physicians/update',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(passwordData),
        headers: { 'x-auth': window.localStorage.getItem("physician-token") },
        dataType: 'json'
    }).done(function(response) {
        // Show success modal/message
        showMessageModal('Success', 'Password updated successfully', 'success');
        console.log(response)
        // Clear password fields
        $('#currentPassword').val('');
        $('#newPassword').val('');
        $('#verifyPassword').val('');
        // disable update password button
        $('#updatePasswordBtn').prop('disabled', true);
    }).fail(function(error) {
        console.log(error);
        // $('#errorMessage').text(xhr.responseText.message || "An error occurred");
        // console.log('xhr response text', xhr.responseText)
        showMessageModal('Error', error.responseJSON.message || 'An error occurred', 'error');
    });
}

// Function to get the physician info
function getPhysicianInfo() {

    $.ajax({
        url: '/physicians/read/',
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("physician-token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('response from server', response);
        console.log('first name from server', response.physicianDoc.firstName);
        $('#physicianFullName').text('Dr. ' + response.physicianDoc.firstName + ' ' + response.physicianDoc.lastName);
    })
    .fail(function(error) {
        console.log(error);
    });
}

function showMessageModal(title, message, type) {
    var modal = $('#genericModal');
    modal.find('.modal-title').text(title);
    modal.find('.modal-body #genericMessage').text(message);
    modal.modal('show');
}

// Listener for Delete Account button
function deleteAccount()
{
    // Retrieve the stored JWT token
    // Assuming you store your token in localStorage or a similar mechanism
    const token = localStorage.getItem('physician-token');

    // Perform the AJAX request to delete the account
    $.ajax({
        url: '/physicians/delete', 
        method: 'DELETE',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("physician-token") },
        dataType: 'json'
    }).done(function(response) {
        // Handle success
        showMessageModal('Success', 'Account deleted successfully.', 'success');
        // Remove the JWT token from localStorage
        localStorage.removeItem('physician-token');
    }).fail(function(error) {
        // Handle error
        showMessageModal('Error', error.responseJSON.message || 'An error occurred', 'error');
    });

    // Close the modal
    $('#deleteAccountModal').modal('hide');
}