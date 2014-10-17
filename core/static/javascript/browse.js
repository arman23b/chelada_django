$(document).ready(function() {
	$('*:not(body, #shade)').off('click'); /* Without this, click will be registered twice for some buttons */

	$('#report-bug a').click(function () {
		showDialog($('#report-bug-dialog'));
	});
	
	var initialData = $('#initial-cans-storage').html();
	if (initialData.length != 0)
		$('body').data('json', $.parseJSON(initialData));
	else
		$('body').data('json', []);
	
	loadCansToWorkspace();
});

function submitBug() {
	hideModalDialog();
	$.ajax({
		'url': 'editor/bug', 
		'type': 'POST',
		'dataType': 'json',
		'data': {bug: $('#bug-content').val()},
		'success': function(data) {
			toast('Thank you! :)');
		},
		'error': function(data) {
			toast('Something goes wrong. Please try again later.');
		}
	});
}

function getCanObjByName(canName) {
	var result = null;
	$('.can').each(function () {
		if ($(this).data('can-name') == canName)
			result = $(this);
	});
	if (result == null) {
		toast('Error retrieving Can name.');
		return null;
	}
	else
		return result;
}

function getTaskObjByNameAndCan(objCan, taskName) {
	var result = null;
	objCan.find('.task').each(function () {
		if ($(this).find('a').text() == taskName)
			result = $(this);
	});
	if (result == null) {
		return null;
	}
	else
		return result;
}

function getNumOfCans() {
	var json = $('body').data('json');
	return json.length;
}

/* @returns null if the Can specified is not found locally
			or the JSON object the name of which is canName.
*/
function getCan(canName) {
	result = null;
	var json = $('body').data('json');
	json.forEach(function (e, i, arr) {
		if (e['can-name'] == canName)
			result = e;
	});
	
	return result;
}

function getTaskInCan(taskName, can) {
	var tasks = can['tasks'];
	taskToReturn = null;
	tasks.forEach(function (e, i, arr) {
		if (e['task-name'] == taskName)
			taskToReturn = e; // Passing by address?
	});

	return taskToReturn;
}

/* Check if name of the Can is used already,
   since it needs to be unique.
   Better way is to check with server.
*/
function doesCanExist(canName) {
	if (getNumOfCans() == 0)
		return false;
	else {
		if (getCan(canName) == null)
			return false;
		else
			return true;
	}
}

/* @requires The Can specified exists.
*/
function doesTaskInCanExist(canName, taskName) {
	if (getNumOfTasksInCan(canName) == 0)
		return false;
	else {
		var tasks = getCan(canName)['tasks'];
		taskFound = false;
		tasks.forEach(function (e, i, arr) {
			if (e['task-name'] == taskName)
				taskFound = true;
		});
		
		return taskFound;
	}
}

function getNumOfTasksInCan(canName) {
	var json = $('body').data('json');
	
	numTasks = -1;
	json.forEach(function (e, i, arr) {
		if (e['can-name'] == canName) {
			var tasks = e['tasks'];
			numTasks = tasks.length;
			/* Cannot return here; not returning from the parent function */
		}
	});
	
	if (numTasks == -1)
		throw 'Can "' + canName + '" is not found.';
	else
		return numTasks;
}

/* @requires Number of Cans > 0

*/
function loadCansToWorkspace() {
	if (getNumOfCans() == 0) {
		$('#cans-browser').addClass('invisible');
		$('#cans-browser').html('');
		return;
	}

	$('#cans-browser').removeClass('invisible');

	/* Purge old Cans */
	$('.can').remove();
	
	var json = $('body').data('json');
	json.forEach(function (e, i, arr) {
		var canName = e['can-name'];
		$('#cans-browser').prepend("<div id='can-" + i + "' class='can'><span class='can-title'><label>" + canName + "</label><a href='javascript:;' class='arrow'>▼</a></span><ul class='tasks'></ul></div>");
		$('#can-' + i).data('can-name', canName); /* Store Can name again as data, for easy retrieval later */
		loadTasksOfCan($('#can-' + i));
	});

	$('.can .arrow').click(function () {
		var expanded = $(this).data('expanded');
		if (expanded == null || expanded == true) {
			$(this).data('expanded', false);
			$(this).text('►');
			var can = $(this).parents('.can');
			can.find('.tasks').addClass('gone');
		}
		else {
			$(this).data('expanded', true);
			$(this).text('▼');
			var can = $(this).parents('.can');
			can.find('.tasks').removeClass('gone');
		}
	});
	
	var firstCanName = $('#can-0').data('can-name');

	if (activeCan == null || doesCanExist(activeCan) == false)
		activeCan = firstCanName;

	markActiveTask();
}

function loadTasksOfCan(objCan) {
	canName = objCan.data('can-name');

	if (activeCan == null) {
		// Loading a new Can; purging the current workspace
		$('#triggers').html('');
		activeCan = canName;
		activeTask = null;
	}

	var targetCanUl = objCan.find('ul');
	targetCanUl.html('');

	$('body').data('json').forEach(function (e, i, arr) {
		if (e['can-name'] == canName) {
			if (e['tasks'] != null) {
				e['tasks'].forEach(function (eTask, iTask, arrTask) {
					targetCanUl.append("<li class='task'><a href='javascript: ;'>" + eTask['task-name'] + "</a><img class='edit'><img class='can-delete'></li>");
				});
			}
		}
	});

	objCan.find('.task a').click(function () {
		var canName = $(this).parents('.can').data('can-name');
		if (canName != activeCan || $(this).text() != activeTask)
			markActiveTask($(this).parent());
	});
}

/* Mark the Task in Task List as active, and load triggers
   in that Task.
   Note that it will always reload; to prevent reloading loaded
   triggers, do (activeTask == task) before calling this.
*/
function markActiveTask(objTask) {
	$('.task').removeClass('active-task');

	if (objTask == null)
		objTask = getTaskObjByNameAndCan(getCanObjByName(activeCan), activeTask);

	if (objTask == null)
		objTask = $('.task:first');

	if (objTask.length == 0) {
		$('#triggers').html('');
		$('#welcome-title').css({'display': 'block'});
		$('#active-task-name').html('');
	}
	else {
		$('#welcome-title').css({'display': 'none'});
		var thisTaskName = objTask.find('a').text();
		objTask.addClass('active-task');
		activeTask = thisTaskName;
		$('#active-task-name').html(activeTask);
		activeCan = objTask.parents('.can').data('can-name');
		loadActiveTaskTriggers();
	}
}

function loadActiveTaskTriggers() {
	$('#triggers').html('');
	var task = getTaskInCan(activeTask, getCan(activeCan));
	var triggers = task['triggers'];
	if (triggers == undefined || triggers.length == 0)// If it's an empty Task, create new Triggers
		initStatement();
	else {
		// Else, assume the Triggers are well-formed and parse
		printJSONToTriggers(triggers);


		$('#triggers *').off('click');
		$('#triggers *').attr('contenteditable','false');
		$('#triggers ul').remove();
		$('#triggers .block:last .addline').remove();
		$('#triggers #thenblocks tr:last .andthen').remove();
		$('#triggers .delete').remove();
	}
}

function saveTriggers() {
	// Dummy function
}