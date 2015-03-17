var activeFeed = null;

$(document).ready(function() {
	$('*:not(body, #shade)').off('click'); /* Without this, click will be registered twice for some buttons */

	$('#report-bug a').click(function () {
		showDialog($('#report-bug-dialog'));
	});
	
	var initialData = $('#initial-feeds-storage').html();
	if (initialData.length != 0)
		$('body').data('json', $.parseJSON(initialData));
	else
		$('body').data('json', []);
	
	loadFeedsToWorkspace();
});

function submitBug() {
	hideModalDialog();
	$.ajax({
		'url': 'editor/bug', 
		'type': 'POST',
		'dataType': 'json',
		'data': {bug: $('#bug-content').val()},
		'success': function(data) {
			toastr.error('Thank you! :)');
		},
		'error': function(data) {
			toastr.error('Something goes wrong. Please try again later.');
		}
	});
}

function getFeedObjByName(feedName) {
	var result = null;
	$('.feed').each(function () {
		if ($(this).data('feed-name') == feedName)
			result = $(this);
	});
	if (result == null) {
		toastr.error('Error retrieving Feed name.');
		return null;
	}
	else
		return result;
}

function getItemObjByNameAndFeed(objFeed, itemName) {
	var result = null;
	objFeed.find('.item').each(function () {
		if ($(this).find('a').text() == itemName)
			result = $(this);
	});
	if (result == null) {
		return null;
	}
	else
		return result;
}

function getNumOfFeeds() {
	var json = $('body').data('json');
	return json.length;
}

/* @returns null if the Feed specified is not found locally
			or the JSON object the name of which is feedName.
*/
function getFeed(feedName) {
	result = null;
	var json = $('body').data('json');
	json.forEach(function (e, i, arr) {
		if (e['feed-name'] == feedName)
			result = e;
	});
	
	return result;
}

function getItemInFeed(itemName, feed) {
	var items = feed['items'];
	itemToReturn = null;
	items.forEach(function (e, i, arr) {
		if (e['item-name'] == itemName)
			itemToReturn = e; // Passing by address?
	});

	return itemToReturn;
}

/* Check if name of the Feed is used already,
   since it needs to be unique.
   Better way is to check with server.
*/
function doesFeedExist(feedName) {
	if (getNumOfFeeds() == 0)
		return false;
	else {
		if (getFeed(feedName) == null)
			return false;
		else
			return true;
	}
}

/* @requires The Feed specified exists.
*/
function doesItemInFeedExist(feedName, itemName) {
	if (getNumOfItemsInFeed(feedName) == 0)
		return false;
	else {
		var items = getFeed(feedName)['items'];
		itemFound = false;
		items.forEach(function (e, i, arr) {
			if (e['item-name'] == itemName)
				itemFound = true;
		});
		
		return itemFound;
	}
}

function getNumOfItemsInFeed(feedName) {
	var json = $('body').data('json');
	
	numItems = -1;
	json.forEach(function (e, i, arr) {
		if (e['feed-name'] == feedName) {
			var items = e['items'];
			numItems = items.length;
			/* Feednot return here; not returning from the parent function */
		}
	});
	
	if (numItems == -1)
		throw 'Feed "' + feedName + '" is not found.';
	else
		return numItems;
}

/* @requires Number of Feeds > 0

*/
function loadFeedsToWorkspace() {
	if (getNumOfFeeds() == 0) {
		$('#feeds-browser').addClass('invisible');
		$('#feeds-browser').html('');
		return;
	}

	$('#feeds-browser').removeClass('invisible');

	/* Purge old Feeds */
	$('.feed').remove();
	
	var json = $('body').data('json');
	json.forEach(function (e, i, arr) {
		var feedName = e['feed-name'];
		$('#feeds-browser').prepend("<div id='feed-" + i + "' class='feed'><span class='feed-title'><label>" + feedName + "</label><a href='javascript:;' class='arrow'>▼</a></span><ul class='items'></ul></div>");
		$('#feed-' + i).data('feed-name', feedName); /* Store Feed name again as data, for easy retrieval later */
		loadItemsOfFeed($('#feed-' + i));
	});

	$('.feed .arrow').click(function () {
		var expanded = $(this).data('expanded');
		if (expanded == null || expanded == true) {
			$(this).data('expanded', false);
			$(this).text('►');
			var feed = $(this).parents('.feed');
			feed.find('.items').addClass('gone');
		}
		else {
			$(this).data('expanded', true);
			$(this).text('▼');
			var feed = $(this).parents('.feed');
			feed.find('.items').removeClass('gone');
		}
	});
	
	var firstFeedName = $('#feed-0').data('feed-name');

	if (activeFeed == null || doesFeedExist(activeFeed) == false)
		activeFeed = firstFeedName;

	markActiveItem();
}

function loadItemsOfFeed(objFeed) {
	feedName = objFeed.data('feed-name');

	if (activeFeed == null) {
		// Loading a new Feed; purging the current workspace
		$('#rules').html('');
		activeFeed = feedName;
		activeItem = null;
	}

	var targetFeedUl = objFeed.find('ul');
	targetFeedUl.html('');

	$('body').data('json').forEach(function (e, i, arr) {
		if (e['feed-name'] == feedName) {
			if (e['items'] != null) {
				e['items'].forEach(function (eItem, iItem, arrItem) {
					targetFeedUl.append("<li class='item'><a href='javascript: ;'>" + eItem['item-name'] + "</a><img class='edit'><img class='feed-delete'></li>");
				});
			}
		}
	});

	objFeed.find('.item a').click(function () {
		var feedName = $(this).parents('.feed').data('feed-name');
		if (feedName != activeFeed || $(this).text() != activeItem)
			markActiveItem($(this).parent());
	});
}

/* Mark the Item in Item List as active, and load rules
   in that Item.
   Note that it will always reload; to prevent reloading loaded
   rules, do (activeItem == item) before calling this.
*/
function markActiveItem(objItem) {
	$('.item').removeClass('active-item');

	if (objItem == null)
		objItem = getItemObjByNameAndFeed(getFeedObjByName(activeFeed), activeItem);

	if (objItem == null)
		objItem = $('.item:first');

	if (objItem.length == 0) {
		$('#rules').html('');
		$('#welcome-title').css({'display': 'block'});
		$('#active-item-name').html('');
	}
	else {
		$('#welcome-title').css({'display': 'none'});
		var thisItemName = objItem.find('a').text();
		objItem.addClass('active-item');
		activeItem = thisItemName;
		$('#active-item-name').html(activeItem);
		activeFeed = objItem.parents('.feed').data('feed-name');
		loadActiveItemRules();
	}
}

function loadActiveItemRules() {
	$('#rules').html('');
	var item = getItemInFeed(activeItem, getFeed(activeFeed));
	var rules = item['rules'];
	if (rules == undefined || rules.length == 0)// If it's an empty Item, create new Rules
		initStatement();
	else {
		// Else, assume the Rules are well-formed and parse
		printJSONToRules(rules);


		$('#rules *').off('click');
		$('#rules *').attr('contenteditable','false');
		$('#rules ul').remove();
		$('#rules .block:last .addline').remove();
		$('#rules #thenblocks tr:last .andthen').remove();
		$('#rules .delete').remove();
	}
}

function saveRules() {
	// Dummy function
}