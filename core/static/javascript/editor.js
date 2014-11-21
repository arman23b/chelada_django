/* Each Can loaded from server has a token and id with it, in order to save it back.
   For sources from outside, without token and id, it will be saved as new Can. */

var hasUnsavedChanges = 0;

var activeCan = "";
var activeTask = "";

function closeModal(selector) {
    selector.find('.uk-close').trigger('click');
}

$(document).ready(function() {
    //$('*:not(body)').off('click'); /* Without this, click will be registered twice for some buttons */

    $('#modal-new-can input').keypress(function (e) {
        if (e.which == 13)
            submitNewCan();
    });

    $('#modal-new-task input').keypress(function (e) {
        if (e.which == 13)
            submitNewTask();
    });

    $('#modal-can-settings #editing-permission').change(function () {
        if ($(this).val() == 'owner') {
            $('#row-editors').addClass('gone');
        }
        else {
            $('#row-editors').removeClass('gone');
        }
    });

    var initialData = $('#initial-cans-storage').html();
    if (initialData.length != 0) {
        $('body').data('json', $.parseJSON(initialData));
        loadCansToWorkspace();
    } else {
        $('body').data('json', []);
    }
    /* Bind page unload event to see if the user need to save changed */
    window.onbeforeunload = function () {
        if (hasUnsavedChanges == 1)
            return('You have modified the Cans, but have not uploaded to the server yet. Unsaved changes will be lost.');
    };
});

function chooseCansToExport() {
    $('#cans-container').html('');
    var json = $('body').data('json');
    json.forEach(function (e) {
        $('#cans-container').append('<label><input type="checkbox" value="' + e['can-name'] + '">' + e['can-name'] + "</label><br/>");
    });
}

function exportCans() {
    closeModal($('#modal-cans-export'));
    var newJson = jQuery.extend([], $('body').data('json')); // Deep copy, or .data will be changed
    var json = stripTokens(newJson);
    var toExport = [];
    json.forEach(function (e) {
        var canName = e['can-name'];
        if ($('#modal-cans-export input[value="' + canName + '"]').is(':checked'))
            toExport.push(e);
    });
    $('#modal-json-viewer #json-area').text(JSON.stringify(toExport));
    (new $.UIkit.modal.Modal("#modal-json-viewer")).show();
}

function markAsContentChanged() {
    hasUnsavedChanges = 1;
    document.title = '[Unsaved] Chelada Editor';
}

function stripTokens(json) {
    var stripped = json;
    stripped.forEach(function (e, i, arr) {
        delete arr[i]['id'];
        delete arr[i]['token'];
    });

    return stripped;
}

function uploadChanges() {
    /* TODO SANITIZE JSON CODE, TO PREVENT USER USING " OR ' */
    // No need to encode to string from client side. the data passed is just JSON
    hasUnsavedChanges = 0;
    document.title = 'Chelada Editor';
    saveTriggers();

    var owner_id = $('#logged-in-user').attr('user-id');

    console.log(JSON.stringify($('body').data('json')));

    $.ajax({
        'url': '/editor/upload',
        'type': 'POST',
        'dataType': 'json',
        'data': {json: JSON.stringify($('body').data('json')), name: $.trim($('#modal-new-can input').val())},
        'success': function(data) {
            //location.reload(true);
            toastr.success('Saved');
        },
        'error': function(data) {
            console.log(JSON.stringify(data));
            toastr.error('Something goes wrong. Please try to save later.');
        }
    });
}

function enterEditMode() {
    $('i.edit, i.can-delete').css({'visibility' : 'visible'});
    $('#cans-browser').addClass('lifted');
    attachTaskEditHandler();
    attachCanEditHandler();
    attachTaskDeleteHandler();
    attachCanDeleteHandler();

    $('.new-task').off('click');
    $('img.settings').addClass('gone');
}

function submitNewCan() {
    var canName = $.trim($('#modal-new-can input').val());
    if (doesCanExist(canName) == true) {
        toastr.warning('A Can name must be unique.');
    }
    else {
        var newCan = {'can-name': canName, 'tasks': []};
        var json = $('body').data('json');
        if (json == null) json = newCan;
        else json.push(newCan);
        $('body').data('json', json);

        loadCansToWorkspace();
        markAsContentChanged();

        closeModal($('#modal-new-can'));
    }
}

/**
 *  Append a new Task to the specified Can in JSON object.
 *  @requires Can specified exists.
 */
function insertTaskToJSON(task, canName, json) {
    json.forEach(function (e) {
        if (e['can-name'] == canName) {
            if (e['tasks'] == undefined) {
                e['tasks'] = [ task ];
            }
            else {
                e['tasks'].push(task);
            }
        }
    });
}

function submitNewTask() {
    var taskName = $.trim($('#modal-new-task input').val());

    if (doesTaskInCanExist(newTaskOfCan, taskName) == true) {
        toastr.warning('Name of the new Task must be unique within the Can ' + newTaskOfCan + '.');
        return;
    }
    else {
        var newTask = {'task-name': taskName, 'triggers': []};
        var json = $('body').data('json');
        insertTaskToJSON(newTask, newTaskOfCan, json);
        $('body').data('json', json);

        closeModal($('#modal-new-task'));
        loadTasksOfCan(getCanObjByName(newTaskOfCan));
        if (activeCan != null) markActiveTask();
        markAsContentChanged();
    }
}

function getCanObjByName(canName) {
    var result = null;
    $('.can').each(function () {
        if ($(this).data('can-name') == canName)
            result = $(this);
    });
    if (result == null) {
        toastr.error('Failed retrieving Can name.');
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

function parseJSONText() {
    var str = $('#paste-json-data').val();

    try {
        var jsonObj = eval(str); // WARNING: POSSIBLE EXECUTION OF MALICIOUS CODE HERE

        if (typeof jsonObj != 'object')
            throw 'string given is not in valid JSON format';

        if (jsonObj.length == 0)
            throw 'no Cans found';

        /* Do sanity check:
           - Every Can must have at least one Task
           - Every Task must have at least one Trigger
           - Every Trigger must have both If blocks and Then blocks
           (the details of blocks are not checked)

           While checking, adding them to Import dialog at the same time
        */
        jsonObj.forEach(function (e, i, arr) {
            var name = e['can-name'];
            if (name == undefined)
                throw 'invalid format';

            if (doesCanExist(name))
                throw 'Can name "' + name + '" already used';
            /* Can also let user to choose if want to merge, replace, or others */

            var tasks = e['tasks'];
            if (tasks == undefined || tasks.length == 0)
                throw 'every Can must have at least one Task';

            tasks.forEach(function (eT, iT, arrT) {
                if (eT['task-name'] == undefined)
                    throw 'invalid format';

                var triggers = eT['triggers'];
                if (triggers == undefined || triggers.length == 0)
                    throw 'every Task must have at least one Trigger';

                triggers.forEach(function (eTrig, iTrig, arrTrig) {
                    var ifArr = eTrig['if'];
                    var thenArr = eTrig['then'];

                    if (typeof ifArr != 'object' || ifArr.length == 0)
                        throw 'every Trigger must have at least one "If" block';

                    if (typeof thenArr != 'object' || thenArr.length == 0)
                        throw 'every Trigger must have at least one "Then" block';
                }); // Exception control flow is really great invention
            });
        });

        closeModal($('#modal-paste-json'));
        $('#paste-json-data').val('');

        /* List Cans and Tasks for user to choose from
           This can be implemented later

            <div class='dialog' id='choose-to-import'>
        <label class='dialog-title'>Choose which Cans/Tasks to import</label>
        <ul id='cans-to-import'>

        </ul>
        <input type='checkbox' id='import to current can'>
    </div>
         */

         var currentPageJSON = $('body').data('json');
         $('body').data('json', currentPageJSON.concat(jsonObj));
         markAsContentChanged();
         loadCansToWorkspace();
    } catch (e) {
        toastr.error('Parsing failed: ' + e);
    }
}

function getNumOfCans() {
    var json = $('body').data('json');
    if (json == null) return 0;
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

/** Check if name of the Can is used already,
 * since it needs to be unique.
 * Better way is to check with server.
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

/**
 * @requires The Can specified exists.
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

    var numTasks = -1;
    json.forEach(function (e, i, arr) {
        if (e['can-name'] == canName) {
            var tasks = e['tasks'];
            numTasks = tasks == undefined ? 0 : tasks.length;
        }
    });

    if (numTasks == -1)
        throw 'Can "' + canName + '" is not found.';
    else
        return numTasks;
}

function attachNewTaskHandler() {
    $('.new-task').click(function () {
        (new $.UIkit.modal.Modal("#modal-new-task")).show();
        newTaskOfCan = $(this).parents('.can').data('can-name');
    });
}

/**
 * @requires Number of Cans > 0
 */
function loadCansToWorkspace() {

    $('#cans-browser').removeClass('invisible');

    /* Purge old Cans */
    $('.can').remove();

    var json = $('body').data('json');
    json.forEach(function (e, i, arr) {
        var canName = e['can-name'];
        var strInitCansBrowser = "<div id='can-" + i + "' class='can'><span class='can-title'><label>" + canName + "</label>";
        strInitCansBrowser += "<i class='settings fa fa-gear'></i><i class='edit fa fa-pencil'></i><i class='can-delete fa fa-trash-o'></i>";
        strInitCansBrowser += "<a href='javascript:;' class='arrow'><i class='fa fa-chevron-down'></i></a></span>";
        strInitCansBrowser += "<ul class='tasks'></ul><span class='new-task'><a href='javascript:;'>+ New Task</a></span></div>";
        $('#cans-browser').prepend(strInitCansBrowser);
        $('#can-' + i).data('can-name', canName); /* Store Can name again as data, for easy retrieval later */
        loadTasksOfCan($('#can-' + i));
    });

    attachNewTaskHandler();

    $('.can .arrow').click(function () {
        var expanded = $(this).data('expanded');
        if (expanded == null || expanded == true) {
            $(this).data('expanded', false);
            $(this).html("<i class='fa fa-chevron-right'>");
            var can = $(this).parents('.can');
            can.find('.tasks').addClass('gone');
            can.find('.new-task').addClass('gone');
        }
        else {
            $(this).data('expanded', true);
            $(this).html("<i class='fa fa-chevron-down'>");
            var can = $(this).parents('.can');
            can.find('.tasks').removeClass('gone');
            can.find('.new-task').removeClass('gone');
        }
    });

    var firstCanName = $('#can-0').data('can-name');

    if (activeCan == null || doesCanExist(activeCan) == false)
        activeCan = firstCanName;

    if (firstCanName != null) markActiveTask();
    attachSettingsHandler();
}

function loadTasksOfCan(objCan) {
    canName = objCan.data('can-name');

    if (activeCan == null) {
        /* Load a new Can; purge current workspace */
        $('#triggers').html('');
        activeCan = canName;
        activeTask = null;
    }

    var targetCanUl = objCan.find('ul');
    targetCanUl.html('');

    $('body').data('json').forEach(function (e) {
        if (e['can-name'] == canName) {
            if (e['tasks'] != null) {
                e['tasks'].forEach(function (eTask) {
                    targetCanUl.append("<li class='task'><a href='javascript: ;'>" + eTask['task-name'] + "</a><i class='edit fa fa-pencil'></i><i class='can-delete fa fa-trash-o'></i></li>");
                });
            }
        }
    });

    objCan.find('.task a').click(function () {
        if (saveTriggers() == 0) {
            /* If Triggers are saved without problems, change Task */
            var canName = $(this).parents('.can').data('can-name');
            if (canName != activeCan || $(this).text() != activeTask)
                markActiveTask($(this).parent());
        }
    });
}

/**
 * Mark the Task in Task List as active, and load triggers in that Task.
 * Note that it will always reload; to prevent reloading loaded triggers, do (activeTask == task) before calling this.
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
    /* If it's an empty Task, create new Triggers */
    if (triggers == undefined || triggers.length == 0)
        initStatement();
    else {
        // Else, assume the Triggers are well-formed and parse
        printJSONToTriggers(triggers);
    }
}

/**
 * Save current Triggers data to local storage ($('body').data('json')).
 * @returns int; 0 if successful, 1 if there are problems
 */
function saveTriggers() {
    if ($('.stats').length != 0) {
        var triggersJSON = getJSONFromTriggers();

        if (triggersJSON == 1)
            return 1;

        var	allJSON = $('body').data('json');
        allJSON.forEach(function (e, i, arr) {
            // arr is just used for changing values directly!
            if (e['can-name'] == activeCan) {
                e['tasks'].forEach(function (eTask, iTask, arrTask) {
                    if (eTask['task-name'] == activeTask) {
                        arrTask[iTask]['triggers'] = triggersJSON;
                    }
                });

                arr[i] = e;
            }
        });

        markAsContentChanged();
    }

    return 0;
    /* SINCE ANIMATION TAKES TIME, VERY POSSIBLE THAT ONLY PART OF
       THE BLOCK IS SAVED */
}


/** Cans browser helpers **/

function attachSettingsHandler() {
    $('.settings').click(function () {
        (new $.UIkit.modal.Modal("#modal-can-settings")).show();
        var canName = $(this).parents('.can').data('can-name');
        var canSettings = $('#modal-can-settings');
        canSettings.find('h1').text('Sharing Settings of ' + canName);
        canSettings.data('can-name', canName);

        var canJson = getCan(canName);
        var viewPermission = canJson['view-permission'];
        var editPermission = canJson['edit-permission'];
        var editors = canJson['editors'];
        var canIconUrl = canJson['can-icon'];

        canSettings.find('#editors').val(editors);

        if (canIconUrl != undefined) {
            canSettings.find('#link-can-icon').val(canIconUrl);
        }

        if (viewPermission == 'private')
            canSettings.find('#viewing-permission').val('private');
        else
            canSettings.find('#viewing-permission').val('public');

        if (editPermission == 'listed') {
            canSettings.find('#editing-permission').val('listed');
            $('#row-editors').removeClass('gone');
        }
        else {
            canSettings.find('#editing-permission').val('owner');
            $('#row-editors').addClass('gone');
        }
    });
}

function submitSettings() {
    var canSettings = $('#modal-can-settings');
    var canName = canSettings.data('can-name');

    var json = $('body').data('json');
    json.forEach(function (e, i, arr) {
        if (e['can-name'] == canName) {
            var viewPermission = canSettings.find('#viewing-permission').val();
            var editPermission = canSettings.find('#editing-permission').val();
            var canIcon = canSettings.find('#link-can-icon').val();
            var editors = canSettings.find('#editors').val();

            console.log(canSettings.find('#editors').val());

            arr[i]['view-permission'] = viewPermission;
            arr[i]['edit-permission'] = editPermission;
            arr[i]['editors'] = editors;
            arr[i]['can-icon'] = canIcon;
        }
    });

    $('body').data('json', json);
    closeModal(canSettings);
}

function attachTaskEditHandler() {
    $('.task i.edit').off('click');
    $('.task i.edit').click(function() {
        var li = $(this).parent();
        li.prepend('<input class="task-editbox" type="text">');
        li.find('a').addClass('gone');
        $(this).addClass('gone');
        li.find('.can-delete').addClass('gone');
        li.append('<i class="confirm fa fa-check-circle"></i>');

        var editBox = li.find('.task-editbox');
        editBox.val(li.find('a').text());

        editBox.keypress(function (e) {
            if (e.which == 13) {
                applyTaskNameChange(li);
            }
        });

        li.find('.confirm').click(function () {
            applyTaskNameChange(li);
        });
    });
}

/**
 * Apply name change in current active Can.
 */
function applyTaskNameChange(li) {
    var editBox = li.find('input');
    var a = li.find('a');

    var currentName = a.text();
    var newName = editBox.val();

    changeTaskName(currentName, newName, li.parents('.can').data('can-name'));
    a.text(newName);
    editBox.remove();
    li.find('.confirm').remove();
    a.removeClass('gone');
    li.find('.edit, .can-delete').removeClass('gone');

    markAsContentChanged();
}

function changeTaskName(currentName, newName, can) {
    var data = $('body').data('json');
    data.forEach(function (e) {
        if (e['can-name'] == can) {
            e['tasks'].forEach(function (eT, iT, arrT) {
                if (eT['task-name'] == currentName) {
                    arrT[iT]['task-name'] = newName;
                }
            });
        }
    });

}

function attachTaskDeleteHandler() {
    $('.task i.can-delete').off('click');
    $('.task i.can-delete').click(function() {
        var taskName = $(this).parents('.task').find('a').text();
        if (confirm('Are you sure to delete "' + taskName + '?"')) {
            var canName = $(this).parents('.can').data('can-name');

            var json = $('body').data('json');
            json.forEach(function (e, i, arr) {
                if (e['can-name'] == canName) {
                    arr[i]['tasks'].forEach(function (eT, iT, arrT) {
                        if (eT['task-name'] == taskName)
                            arrT.splice(iT, 1);
                    });
                }
            });

            markAsContentChanged();

            $('body').data('json', json);
            $(this).parents('li').remove();
            markActiveTask();
        }
    });
}

function attachCanDeleteHandler() {
    $('.can-title i.can-delete').off('click');
    $('.can-title i.can-delete').click(function() {
        var canName = $(this).parents('.can').data('can-name');
        if (confirm('Are you sure to delete "' + canName + '?"')) {
            var canToken, canId;
            var json = $('body').data('json');
            json.forEach(function (e, i, arr) {
                if (e['can-name'] == canName) {
                    canToken = e['token'];
                    canId = e['id'];
                    arr.splice(i, 1);
                }
            });

            // $.ajax({
            //     'url': 'editor/deletecan',
            //     'type': 'POST',
            //     'dataType': 'json',
            //     'data': { token: canToken, id: canId },
            //     'success': function () {
            //         toastr.error('Can deleted successfully.', 'success');
            //     },
            //     'error': function () {
            //         toastr.error('Error uploading to server. Please try again later.', 'danger');
            //     }
            // });

            markAsContentChanged();

            $('body').data('json', json);
            var activeCan = null;
            loadCansToWorkspace();

            if (activeCan != null)
                markActiveTask();

            enterEditMode();
        }
    });
}

function attachCanEditHandler() {
    $('.can-title i.edit').off('click');
    $('.can-title i.edit').click(function () {
        var span = $(this).parent();
        span.prepend('<input class="can-editbox" type="text">');
        span.find('label').addClass('gone');
        $(this).addClass('gone');
        span.find('.can-delete').addClass('gone');
        span.append('<i class="confirm fa fa-check-circle"></i>');

        var editBox = span.find('.can-editbox');
        editBox.val(span.find('label').text());

        editBox.keypress(function (e) {
            if (e.which == 13) {
                applyCanNameChange(span);
            }
        });

        span.find('.confirm').click(function () {
            applyCanNameChange(span);
        });
    });
}

function applyCanNameChange(span) {
    /* Change name of label, remove Yes button, etc */
    var editBox = span.find('input');
    var label = span.find('label');

    var currentName = label.text();
    var newName = editBox.val();

    changeCanName(currentName, newName);

    span.parents('.can').data('can-name', newName);

    /* If current Can is the active Can, need to change active Can name too */
    if (activeCan == currentName) {
        activeCan = newName;
        $('#select-box label').text(newName);
    }

    label.text(newName);
    editBox.remove();
    span.find('.confirm').remove();
    label.removeClass('gone');
    span.find('img').removeClass('gone');
    span.find('i.settings').addClass('gone');

    loadCansToWorkspace();
    enterEditMode();

    markAsContentChanged();
}

function changeCanName(oldName, newName) {
    var data = $('body').data('json');

    data.forEach(function (e, i, arr) {
        if (e['can-name'] == oldName)
            arr[i]['can-name'] = newName;
    });
}

function hideEditBox() {
    $('i.edit').removeClass('gone');
    $('.select-can a').removeClass('gone');
    $('#editor a').removeClass('gone');
    $('.confirm').remove();
    $('.can-editbox').remove();
    $('.task-editbox').remove();
}