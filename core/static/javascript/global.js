/*

JSON export format:
[
	{'can-name' : 'can1',
	 'tasks' : [
					{'task-name' : 'task-1-1',
					 'triggers' : [
									....
					 			  ]
					}
	 		   ]
	},

	{'can-name' : 'can2',
		....
	}
]

NEED A REVERT TO ORIGINAL STATE BUTTON

Names of Can must be unique universally;
Names of Task must be unique within that Can

Until user chooses Save Can to upload Can data to server, all Can changes only happen locally.
So every change to any Trigger or Task will be saved locally, but not on the server side.

In export: choose the cans/tasks you would like to export
 */

activeCan = null;
activeTask = null;

function showDialog(dialogObj) {
	hideMenus();
	$('#shade').css({'visibility': 'visible'});
	$('#shade').animate({'opacity': 0.8}, 200, 'swing');
	dialogObj.css({'visibility': 'visible', 'display': 'block'});
	dialogObj.animate({'opacity': 1}, 200, 'swing');
    dialogObj.draggable({handle: ".dialog-title"});
}

$(document).ready(function() {
	$('#title-bar, #nav-bar-content > :not(#can-selector), #editor, #footer').click(function () {
		hideMenus();
		/* Remove the .visible class of all such classes */

		//hideEditBox();
	});

	$('body').click( function (e) { 
    	if ( e.target == this ) {// Click on blank area
        	hideMenus();
        	hideEditBox();
        }
	});

	$('#shade').click(hideModalDialog);
});

function hideMenus() {
	$('.visible').removeClass('visible');
}

function hideModalDialog() {
	$('#shade').css({'visibility': 'hidden', 'opacity': 0});
	$('.dialog').css({'visibility': 'hidden', 'opacity': 0});

	$('#cans-browser').removeClass('lifted');
	$('img.edit, img.can-delete').css({'visibility' : 'hidden'});
	$('img.settings').removeClass('gone');

	attachNewTaskHandler();
}

function toast(msg, status) {
    $.UIkit.notify(msg, { pos: 'bottom-center', status: status, timeout: 2000 });
}

function pad (str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}