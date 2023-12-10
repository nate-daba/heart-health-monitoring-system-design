var physiciansDetail = {};
var originalPhysicianEmail = null; // Global variable to store the original physician's email
// Initialize originalData
var originalData = {};
$(document).ready(function() {

    fetchAllPhysicians(); // Call the new function here
    fetchAccountDetails();
    getPatientInfo();
    
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
    $('#physicianSelect').on('change', physicianSelectChange);
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
    
    // Listener for physician selection change
    $('#physicianSelect').on('change', function() {
        var selectedEmail = $(this).find('option:selected').data('email'); // Assuming each option has data-email attribute
        var currentEmail = $('#physicianEmail').find('span').text();

        // Enable 'Save Changes' button if the selected physician's email is different
        $('#savePhysicianChangesBtn').prop('disabled', selectedEmail === currentEmail);
    });
    // Listener for save changes button click
    $('#savePhysicianChangesBtn').on('click', savePhysicianChanges);

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

function fetchAccountDetails() {
    $.ajax({
        url: 'patients/read/',
        type: 'GET',
        dataType: 'json',
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        success: function(response) {
            var patientInfo = response.patientDoc;
            if (patientInfo) {
                $('#email').val(patientInfo.email);
                $('#firstName').val(patientInfo.firstName);
                $('#lastName').val(patientInfo.lastName);
                // Check if patientInfo has physicianDoc
                console.log
                if (patientInfo.physicianDoc) {
                    
                    // Populate physician fields
                    var physicianFullName = patientInfo.physicianDoc.firstName + ' ' + patientInfo.physicianDoc.lastName;
                    $('#physicianFullName').text(physicianFullName);
                    $('#specialty').text(patientInfo.physicianDoc.specialty);
                    $('#physicianEmail').text(patientInfo.physicianDoc.email);

                    // Find and select the option in the dropdown that matches the physician's email
                    $('#physicianSelect option').each(function() {
                        if ($(this).data('email') === patientInfo.physicianDoc.email) {
                            $(this).prop('selected', true);
                        }
                    });

                    originalPhysicianEmail = patientInfo.physicianDoc.email;
                    originalData.physicianEmail = patientInfo.physicianDoc.email;

                }
                originalData.firstName = patientInfo.firstName;
                originalData.lastName = patientInfo.lastName;
            } else {
                console.error('Invalid response format');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching account details:', error);
        }
    });
}

function fetchAllPhysicians() {
    $.ajax({
        url: '/physicians/readAll',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            var physicians = response.physicians;
            if (physicians && physicians.length > 0) {
                physicians.forEach(function(physician) {
                    // Save physician details in the global object
                    physiciansDetail[physician.email] = physician;

                    // Create an option element for each physician
                    var option = $('<option></option>')
                        .text('Dr. ' + physician.firstName + ' ' + physician.lastName) 
                        .attr('data-email', physician.email); 

                    // Append the option to the select element
                    $('#physicianSelect').append(option);
                });
            } else {
                console.error('No physicians found');
                // Optionally handle the case when no physicians are found
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching physicians:', error);
            // Optionally display an error message to the patient
        }
    });
}

function physicianSelectChange() {
    var selectedEmail = $(this).find('option:selected').data('email');
    var physician = physiciansDetail[selectedEmail];
       
    if (physician) {
        $('#physicianFullName').text('Dr. ' + physician.firstName + ' ' + physician.lastName);
        $('#specialty').text(physician.specialty); // Assuming 'specialty' is a field in the physician document
        $('#physicianEmail').text(physician.email);
    }

    updateSaveButtonState();
}

function updateSaveButtonState() {
    var selectedEmail = $('#physicianSelect').find('option:selected').data('email');

    if (selectedEmail === originalData.physicianEmail) {
        $('#savePhysicianChangesBtn').addClass('disabled');
    }
    else {
        $('#savePhysicianChangesBtn').removeClass('disabled');
    }
}

function checkFieldsForChange() {
    var hasChanged = false;
    console.log('originalData', originalData);
    if ($('#firstName').val() !== originalData.firstName || $('#lastName').val() !== originalData.lastName) {
        hasChanged = true;
    }

    $('#saveChangesBtn').prop('disabled', !hasChanged);
}

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
        displayErrorMessages(errorMessages, 'patientInfoErrorMessages');
        return;
    }
    var updatedData = {
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val()
        // Add other fields if necessary
    };

    $.ajax({
        url: 'patients/update',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updatedData),
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json'
    }).done(function(response) {
        // Show success modal/message
        showMessageModal('Success', 'Account details updated successfully', 'success');
        // disable save changes button
        $('#saveChangesBtn').prop('disabled', true);
        // disable input fields
        $('#firstName, #lastName').attr('readonly', true);
        // update patientFullName
        $('#patientFullName').text(updatedData.firstName + ' ' + updatedData.lastName);
        
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
        url: 'patients/update',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(passwordData),
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json'
    }).done(function(response) {
        // Show success modal/message
        showMessageModal('Success', 'Password updated successfully', 'success');
        // disable save changes button
        $('#currentPassword').val('');
        $('#newPassword').val('');
        $('#verifyPassword').val('');
        // disable update password button
        $('#updatePasswordBtn').prop('disabled', true);
        console.log(response)
    }).fail(function(error) {
        console.log(error);
        // $('#errorMessage').text(xhr.responseText.message || "An error occurred");
        // console.log('xhr response text', xhr.responseText)
        showMessageModal('Error', error.responseJSON.message || 'An error occurred', 'error');
    });
}

function savePhysicianChanges() {
    var selectedPhysicianEmail = $('#physicianSelect').find('option:selected').data('email');
    console.log('selectedPhysicianEmail', selectedPhysicianEmail);
    var data = {
        physicianEmail: selectedPhysicianEmail
    };
    // AJAX call to update the physician
    console.log('data', data);
    $.ajax({
        url: 'patients/update',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json',
        success: function(response) {
            // Handle success
            console.log('Physician updated successfully');
            console.log(response.data)
            // Show success modal/message
            showMessageModal('Success', 'Physician updated successfully', 'success');
            $('#savePhysicianChangesBtn').addClass('disabled');
            originalData.physicianEmail = selectedPhysicianEmail;
        },
        error: function(xhr, status, error) {
            // Handle error
            console.error('Error updating physician:', error);
            // Show error modal/message
            showMessageModal('Error', xhr.responseJSON.message || 'An error occurred', 'error');
        }
    });
}

// Handle the confirmation of the deletion
function deleteAccount()
{
    // Retrieve the stored JWT token
    // Assuming you store your token in localStorage or a similar mechanism
    const token = localStorage.getItem('patient-token');

    // Perform the AJAX request to delete the account
    $.ajax({
        url: '/patients/delete', 
        method: 'DELETE',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json'
    }).done(function(response) {
        // Handle success
        showMessageModal('Success', 'Account deleted successfully.', 'success');
        // Remove the JWT token from localStorage
        localStorage.removeItem('patient-token');
    }).fail(function(error) {
        // Handle error
        showMessageModal('Error', error.responseJSON.message || 'An error occurred', 'error');
    });

    // Close the modal
    $('#deleteAccountModal').modal('hide');
}

// Function to get the patient info
function getPatientInfo() {
    $.ajax({
        url: '/patients/read/',
        method: 'GET',
        contentType: 'application/json',
        headers: { 'x-auth': window.localStorage.getItem("patient-token") },
        dataType: 'json',
    })
    .done(function(response) {
        console.log('response from server', response);
        $('#patientFullName').text(response.patientDoc.firstName + ' ' + response.patientDoc.lastName);
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