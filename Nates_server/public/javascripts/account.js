$(document).ready(function() {
    fetchAccountDetails();

    $('#saveChangesBtn').on('click', saveChanges);
    $('#updatePasswordBtn').on('click', updatePassword);

    // Listeners for input changes
    $('input').on('input', function() {
        var inputId = $(this).attr('id');
        if (inputId === 'currentPassword' || inputId === 'newPassword' || inputId === 'verifyPassword') {
            $('#updatePasswordBtn').prop('disabled', false);
        } else {
            $('#saveChangesBtn').prop('disabled', false);
        }
    });

    // Focus listeners to enable editing
    $('#firstName, #lastName').on('focus', function() {
        $(this).removeAttr('readonly');
    });
});

function fetchAccountDetails() {
    var email = localStorage.getItem('email');

    $.ajax({
        url: 'users/read/' + email,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            var response = response.userInfo;
            if (response) {
                $('#email').val(response.email);
                $('#firstName').val(response.firstName);
                $('#lastName').val(response.lastName);
                $('#password').val(response.password);
            } else {
                console.error('Invalid response format');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching account details:', error);
        }
    });
}

function saveChanges() {
    var updatedData = {
        email: $('#email').val(),
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val()
        // Add other fields if necessary
    };

    $.ajax({
        url: 'users/update',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(updatedData),
        dataType: 'json'
    }).done(function(response) {
        // Show success modal/message
    }).fail(function(xhr, status, error) {
        // Show error message
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

    var passwordData = {
        currentPassword: currentPassword,
        newPassword: newPassword
    };

    $.ajax({
        url: 'users/update',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(passwordData),
        dataType: 'json'
    }).done(function(response) {
        // Show success modal/message
    }).fail(function(xhr, status, error) {
        $('#errorMessage').text(xhr.responseText || "An error occurred");
    });
}