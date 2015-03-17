/*

JSON export format:
[
	{'feed-name' : 'feed1',
	 'items' : [
					{'item-name' : 'item-1-1',
					 'rules' : [
									....
					 			  ]
					}
	 		   ]
	},

	{'feed-name' : 'feed2',
		....
	}
]

NEED A REVERT TO ORIGINAL STATE BUTTON

Names of Feed must be unique universally;
Names of Item must be unique within that Feed

Until user chooses Save Feed to upload Feed data to server, all Feed changes only happen locally.
So every change to any Rule or Item will be saved locally, but not on the server side.

In export: choose the feeds/items you would like to export
 */

activeFeed = null;
activeItem = null;

function showDialog(dialogObj) {
	hideMenus();
	$('#shade').css({'visibility': 'visible'});
	$('#shade').animate({'opacity': 0.8}, 200, 'swing');
	dialogObj.css({'visibility': 'visible', 'display': 'block'});
	dialogObj.animate({'opacity': 1}, 200, 'swing');
    dialogObj.draggable({handle: ".dialog-title"});
}

$(document).ready(function() {
	$('#title-bar, #nav-bar-content > :not(#feed-selector), #editor, #footer').click(function () {
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

	$('#feeds-browser').removeClass('lifted');
	$('img.edit, img.feed-delete').css({'visibility' : 'hidden'});
	$('img.settings').removeClass('gone');

	attachNewItemHandler();
}

function toast(msg, status) {
    $.UIkit.notify(msg, { pos: 'bottom-center', status: status, timeout: 2000 });
}

function pad (str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}