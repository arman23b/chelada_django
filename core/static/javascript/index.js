$(document).ready(function() {

    var loginDialog = $('#modal-login');
    var regDialog = $('#modal-reg');
    var modalRegComplete = new $.UIkit.modal.Modal("#modal-reg-complete");

	loginDialog.find('.submit').click(function () {
		$.ajax({
			'url': 'user/login', 
			'type': 'POST',
			'dataType': 'json',
			'data': {email: loginDialog.find('#email').val(), password: loginDialog.find('#pwd').val()},
			'success': function(data) {
				if (data['result'] == 0)
					toastr.error('Wrong Email or password.');
				else {
					window.location.assign("/editor")
				}
			},
			'error': function() {
				toastr.error('Error verifying user. Please try again later.');
			}
		});
	});

	regDialog.find('.submit').click(function () {
		$.ajax({
			'url': 'user/register',
			'type': 'POST',
			'dataType': 'json',
			'data': {email: regDialog.find('#email').val(), password: regDialog.find('#pwd').val(),
			password_repeat: regDialog.find('#pwd-repeat').val(), nickname: regDialog.find('#nickname').val()},
			'success': function(data) {
				var result = data['result'];
				if (result == 1)
					toastr.error('Wrong Email format.');
				else if (result == 2)
					toastr.error('Passwords are not the same.');
				else if (result == 3)
					toastr.error('Email already registered.');
				else if (result == 4)
					toastr.error('Password cannot be empty.');
				else if (result == 5)
					toastr.error('Nickname cannot be empty.');
				else {
					modalRegComplete.hide();
					window.location.assign("/editor")
				}
			},
			'error': function(data) {
				alert(JSON.stringify(data));
				toastr.error('Error registering user. Please try again later.');
			}
		});
	});
});