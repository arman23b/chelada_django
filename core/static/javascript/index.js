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
					toast('Wrong Email or password.');
				else {
					window.location.assign("/editor")
				}
			},
			'error': function() {
				toast('Error verifying user. Please try again later.');
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
					toast('Wrong Email format.');
				else if (result == 2)
					toast('Passwords are not the same.');
				else if (result == 3)
					toast('Email already registered.');
				else if (result == 4)
					toast('Password cannot be empty.');
				else if (result == 5)
					toast('Nickname cannot be empty.');
				else {
					modalRegComplete.hide();
				}
			},
			'error': function(data) {
				alert(JSON.stringify(data));
				toast('Error registering user. Please try again later.');
			}
		});
	});
});