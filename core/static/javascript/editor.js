/* Each Feed loaded from server has a token and id with it, in order to save it back.
   For sources from outside, without token and id, it will be saved as new Feed. */

var hasUnsavedChanges = 0;

var activeFeed = "";
var activeItem = "";

function closeModal(selector) {
    selector.find('.uk-close').trigger('click');
}

$(document).ready(function() {
    //$('*:not(body)').off('click'); /* Without this, click will be registered twice for some buttons */

    $('#modal-new-feed input').keypress(function (e) {
        if (e.which == 13)
            submitNewFeed();
    });

    $('#modal-new-item input').keypress(function (e) {
        if (e.which == 13)
            submitNewItem();
    });

    $('#modal-feed-settings #editing-permission').change(function () {
        if ($(this).val() == 'owner') {
            $('#row-editors').addClass('gone');
        }
        else {
            $('#row-editors').removeClass('gone');
        }
    });

    var initialData = $('#initial-feeds-storage').html();
    if (initialData.length != 0) {
        $('body').data('json', $.parseJSON(initialData));
        loadFeedsToWorkspace();
    } else {
        $('body').data('json', []);
    }
    /* Bind page unload event to see if the user need to save changed */
    window.onbeforeunload = function () {
        if (hasUnsavedChanges == 1)
            return('You have modified the Feeds, but have not uploaded to the server yet. Unsaved changes will be lost.');
    };
});

function chooseFeedsToExport() {
    $('#feeds-container-export').html('');
    var json = $('body').data('json');
    json.forEach(function (e) {
        $('#feeds-container-export').append('<label><input type="checkbox" value="' + e['feed-name'] + '">' + e['feed-name'] + "</label><br/>");
    });
}

function chooseFeedsToLink() {
    $('#feeds-container-link').html('');
    var json = $('body').data('json');
    json.forEach(function (e) {
        $('#feeds-container-link').append('<label><input type="checkbox" value="' + e['feed-name'] + '">' + e['feed-name'] + "</label><br/>");
    });
}

function exportFeeds() {
    closeModal($('#modal-feeds-export'));
    var newJson = jQuery.extend([], $('body').data('json')); // Deep copy, or .data will be changed
    var json = stripTokens(newJson);
    var toExport = [];
    json.forEach(function (e) {
        var feedName = e['feed-name'];
        if ($('#modal-feeds-export input[value="' + feedName + '"]').is(':checked'))
            toExport.push(e);
    });
    $('#modal-json-viewer #json-area').text(JSON.stringify(toExport));
    (new $.UIkit.modal.Modal("#modal-json-viewer")).show();
}

function linkFeeds() {
    closeModal($('#modal-feeds-link'));
    var newJson = jQuery.extend([], $('body').data('json')); // Deep copy, or .data will be changed
    var json = stripTokens(newJson);
    var toSend = [];
    json.forEach(function (e) {
        var feedName = e['feed-name'];
        if ($('#modal-feeds-link input[value="' + feedName + '"]').is(':checked'))
            toSend.push(feedName);
    });
    var recipient = $('#email-recipient').val();

    $.ajax({
        'url': '/sendFeeds',
        'type': 'POST',
        'dataType': 'json',
        'data': {recipient: recipient, feeds: JSON.stringify(toSend)},
        'success': function(data) {
            var result = data['result']
            if (result == 0)
                toastr.error('Wrong email format')
            else  
                toastr.success('Email sent successfully to ' + recipient);
        },
        'error': function(data) {
            console.log(JSON.stringify(data));
            toastr.error('Failed to send email');
        }
    });
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
    saveRules();

    var owner_id = $('#logged-in-user').attr('user-id');

    $.ajax({
        'url': '/editor/upload',
        'type': 'POST',
        'dataType': 'json',
        'data': {json: JSON.stringify($('body').data('json')), name: $.trim($('#modal-new-feed input').val())},
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
    $('i.edit, i.feed-delete').css({'visibility' : 'visible'});
    $('#feeds-browser').addClass('lifted');
    attachItemEditHandler();
    attachFeedEditHandler();
    attachItemDeleteHandler();
    attachFeedDeleteHandler();

    $('.new-item').off('click');
    $('img.settings').addClass('gone');
}

function submitNewFeed() {
    var feedName = $.trim($('#modal-new-feed input').val());
    if (feedName.indexOf("@") > -1) {
        toastr.warning("A Feed name can't contain @ character");
    }
    else if (feedName.indexOf("/") > -1) {
        toastr.warning("A Feed name can't contain / character");
    }
    else if (doesFeedExist(feedName) == true) {
        toastr.warning('A Feed name must be unique.');
    }
    else {
        var newFeed = {'feed-name': feedName, 'items': []};
        var json = $('body').data('json');
        if (json == null) json = newFeed;
        else json.push(newFeed);
        $('body').data('json', json);

        loadFeedsToWorkspace();
        markAsContentChanged();

        closeModal($('#modal-new-feed'));
    }
}

/**
 *  Append a new Item to the specified Feed in JSON object.
 *  @requires Feed specified exists.
 */
function insertItemToJSON(item, feedName, json) {
    json.forEach(function (e) {
        if (e['feed-name'] == feedName) {
            if (e['items'] == undefined) {
                e['items'] = [ item ];
            }
            else {
                e['items'].push(item);
            }
        }
    });
}

function submitNewItem() {
    var itemName = $.trim($('#modal-new-item input').val());

    if (doesItemInFeedExist(newItemOfFeed, itemName) == true) {
        toastr.warning('Name of the new Item must be unique within the Feed ' + newItemOfFeed + '.');
        return;
    }
    else {
        var newItem = {'item-name': itemName, 'rules': []};
        var json = $('body').data('json');
        insertItemToJSON(newItem, newItemOfFeed, json);
        $('body').data('json', json);

        closeModal($('#modal-new-item'));
        loadItemsOfFeed(getFeedObjByName(newItemOfFeed));
        if (activeFeed != null) markActiveItem();
        markAsContentChanged();
    }
}

function getFeedObjByName(feedName) {
    var result = null;
    $('.feed').each(function () {
        if ($(this).data('feed-name') == feedName)
            result = $(this);
    });
    if (result == null) {
        toastr.error('Failed retrieving Feed name.');
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

function parseJSONText() {
    var str = $('#paste-json-data').val();

    try {
        var jsonObj = eval(str); // WARNING: POSSIBLE EXECUTION OF MALICIOUS CODE HERE

        if (typeof jsonObj != 'object')
            throw 'string given is not in valid JSON format';

        if (jsonObj.length == 0)
            throw 'no Feeds found';

        /* Do sanity check:
           - Every Feed must have at least one Item
           - Every Item must have at least one Rule
           - Every Rule must have both If blocks and Then blocks
           (the details of blocks are not checked)

           While checking, adding them to Import dialog at the same time
        */
        jsonObj.forEach(function (e, i, arr) {
            var name = e['feed-name'];
            if (name == undefined)
                throw 'invalid format';

            if (doesFeedExist(name))
                throw 'Feed name "' + name + '" already used';
            /* Feed also let user to choose if want to merge, replace, or others */

            var items = e['items'];
            if (items == undefined || items.length == 0)
                throw 'every Feed must have at least one Item';

            items.forEach(function (eT, iT, arrT) {
                if (eT['item-name'] == undefined)
                    throw 'invalid format';

                var rules = eT['rules'];
                if (rules == undefined || rules.length == 0)
                    throw 'every Item must have at least one Rule';

                rules.forEach(function (eTrig, iTrig, arrTrig) {
                    var ifArr = eTrig['if'];
                    var thenArr = eTrig['then'];

                    if (typeof ifArr != 'object' || ifArr.length == 0)
                        throw 'every Rule must have at least one "If" block';

                    if (typeof thenArr != 'object' || thenArr.length == 0)
                        throw 'every Rule must have at least one "Then" block';
                }); // Exception control flow is really great invention
            });
        });
        

        closeModal($('#modal-paste-json'));
        $('#paste-json-data').val('');

        /* List Feeds and Items for user to choose from
           This feed be implemented later

            <div class='dialog' id='choose-to-import'>
        <label class='dialog-title'>Choose which Feeds/Items to import</label>
        <ul id='feeds-to-import'>

        </ul>
        <input type='checkbox' id='import to current feed'>
    </div>
         */

         
         var currentPageJSON = $('body').data('json');
         $('body').data('json', currentPageJSON.concat(jsonObj));
         markAsContentChanged();
         loadFeedsToWorkspace();

    } catch (e) {
        toastr.error('Parsing failed: ' + e);
    }
}

function getNumOfFeeds() {
    var json = $('body').data('json');
    if (json == null) return 0;
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

/** Check if name of the Feed is used already,
 * since it needs to be unique.
 * Better way is to check with server.
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

/**
 * @requires The Feed specified exists.
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

    var numItems = -1;
    json.forEach(function (e, i, arr) {
        if (e['feed-name'] == feedName) {
            var items = e['items'];
            numItems = items == undefined ? 0 : items.length;
        }
    });

    if (numItems == -1)
        throw 'Feed "' + feedName + '" is not found.';
    else
        return numItems;
}

function attachNewItemHandler() {
    $('.new-item').click(function () {
        (new $.UIkit.modal.Modal("#modal-new-item")).show();
        newItemOfFeed = $(this).parents('.feed').data('feed-name');
    });
}

/**
 * @requires Number of Feeds > 0
 */
function loadFeedsToWorkspace() {

    $('#feeds-browser').removeClass('invisible');

    /* Purge old Feeds */
    $('.feed').remove();

    var json = $('body').data('json');
    json.forEach(function (e, i, arr) {
        var feedName = e['feed-name'];
        var strInitFeedsBrowser = "<div id='feed-" + i + "' class='feed'><span class='feed-title'><label>" + feedName + "</label>";
        strInitFeedsBrowser += "<i class='settings fa fa-gear'></i><i class='edit fa fa-pencil'></i><i class='feed-delete fa fa-trash-o'></i>";
        strInitFeedsBrowser += "<a href='javascript:;' class='arrow'><i class='fa fa-chevron-down'></i></a></span>";
        strInitFeedsBrowser += "<ul class='items'></ul><span class='new-item'><a href='javascript:;'>+ New Item</a></span></div>";
        $('#feeds-browser').prepend(strInitFeedsBrowser);
        $('#feed-' + i).data('feed-name', feedName); /* Store Feed name again as data, for easy retrieval later */
        loadItemsOfFeed($('#feed-' + i));
    });

    attachNewItemHandler();

    $('.feed .arrow').click(function () {
        var expanded = $(this).data('expanded');
        if (expanded == null || expanded == true) {
            $(this).data('expanded', false);
            $(this).html("<i class='fa fa-chevron-right'>");
            var feed = $(this).parents('.feed');
            feed.find('.items').addClass('gone');
            feed.find('.new-item').addClass('gone');
        }
        else {
            $(this).data('expanded', true);
            $(this).html("<i class='fa fa-chevron-down'>");
            var feed = $(this).parents('.feed');
            feed.find('.items').removeClass('gone');
            feed.find('.new-item').removeClass('gone');
        }
    });

    var firstFeedName = $('#feed-0').data('feed-name');

    if (activeFeed == null || doesFeedExist(activeFeed) == false)
        activeFeed = firstFeedName;

    if (firstFeedName != null) markActiveItem();
    attachSettingsHandler();
}

function loadItemsOfFeed(objFeed) {
    feedName = objFeed.data('feed-name');

    if (activeFeed == null) {
        /* Load a new Feed; purge current workspace */
        $('#rules').html('');
        activeFeed = feedName;
        activeItem = null;
    }

    var targetFeedUl = objFeed.find('ul');
    targetFeedUl.html('');

    $('body').data('json').forEach(function (e) {
        if (e['feed-name'] == feedName) {
            if (e['items'] != null) {
                e['items'].forEach(function (eItem) {
                    targetFeedUl.append("<li class='item'><a href='javascript: ;'>" + eItem['item-name'] + "</a><i class='edit fa fa-pencil'></i><i class='feed-delete fa fa-trash-o'></i></li>");
                });
            }
        }
    });

    objFeed.find('.item a').click(function () {
        if (saveRules() == 0) {
            /* If Rules are saved without problems, change Item */
            var feedName = $(this).parents('.feed').data('feed-name');
            if (feedName != activeFeed || $(this).text() != activeItem)
                markActiveItem($(this).parent());
        }
    });
}

/**
 * Mark the Item in Item List as active, and load rules in that Item.
 * Note that it will always reload; to prevent reloading loaded rules, do (activeItem == item) before calling this.
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
    /* If it's an empty Item, create new Rules */
    if (rules == undefined || rules.length == 0)
        initStatement();
    else {
        // Else, assume the Rules are well-formed and parse
        printJSONToRules(rules);
    }
}

/**
 * Save current Rules data to local storage ($('body').data('json')).
 * @returns int; 0 if successful, 1 if there are problems
 */
function saveRules() {
    if ($('.stats').length != 0) {
        var rulesJSON = getJSONFromRules();

        if (rulesJSON == 1)
            return 1;

        var	allJSON = $('body').data('json');
        allJSON.forEach(function (e, i, arr) {
            // arr is just used for changing values directly!
            if (e['feed-name'] == activeFeed) {
                e['items'].forEach(function (eItem, iItem, arrItem) {
                    if (eItem['item-name'] == activeItem) {
                        arrItem[iItem]['rules'] = rulesJSON;
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


/** Feeds browser helpers **/

function attachSettingsHandler() {
    $('.settings').click(function () {
        (new $.UIkit.modal.Modal("#modal-feed-settings")).show();
        var feedName = $(this).parents('.feed').data('feed-name');
        var feedSettings = $('#modal-feed-settings');
        feedSettings.find('h1').text('Sharing Settings of ' + feedName);
        feedSettings.data('feed-name', feedName);

        var feedJson = getFeed(feedName);
        var viewPermission = feedJson['view-permission'];
        var editPermission = feedJson['edit-permission'];
        var editors = feedJson['editors'];
        var feedIconUrl = feedJson['feed-icon'];

        feedSettings.find('#editors').val(editors);

        if (feedIconUrl != undefined) {
            feedSettings.find('#link-feed-icon').val(feedIconUrl);
        }

        if (viewPermission == 'private')
            feedSettings.find('#viewing-permission').val('private');
        else
            feedSettings.find('#viewing-permission').val('public');

        if (editPermission == 'listed') {
            feedSettings.find('#editing-permission').val('listed');
            $('#row-editors').removeClass('gone');
        }
        else {
            feedSettings.find('#editing-permission').val('owner');
            $('#row-editors').addClass('gone');
        }
    });
}

function submitSettings() {
    var feedSettings = $('#modal-feed-settings');
    var feedName = feedSettings.data('feed-name');

    var json = $('body').data('json');
    json.forEach(function (e, i, arr) {
        if (e['feed-name'] == feedName) {
            var viewPermission = feedSettings.find('#viewing-permission').val();
            var editPermission = feedSettings.find('#editing-permission').val();
            var feedIcon = feedSettings.find('#link-feed-icon').val();
            var editors = feedSettings.find('#editors').val();

            console.log(feedSettings.find('#editors').val());

            arr[i]['view-permission'] = viewPermission;
            arr[i]['edit-permission'] = editPermission;
            arr[i]['editors'] = editors;
            arr[i]['feed-icon'] = feedIcon;
        }
    });

    $('body').data('json', json);
    closeModal(feedSettings);
}

function attachItemEditHandler() {
    $('.item i.edit').off('click');
    $('.item i.edit').click(function() {
        var li = $(this).parent();
        li.prepend('<input class="item-editbox" type="text">');
        li.find('a').addClass('gone');
        $(this).addClass('gone');
        li.find('.feed-delete').addClass('gone');
        li.append('<i class="confirm fa fa-check-circle"></i>');

        var editBox = li.find('.item-editbox');
        editBox.val(li.find('a').text());

        editBox.keypress(function (e) {
            if (e.which == 13) {
                applyItemNameChange(li);
            }
        });

        li.find('.confirm').click(function () {
            applyItemNameChange(li);
        });
    });
}

/**
 * Apply name change in current active Feed.
 */
function applyItemNameChange(li) {
    var editBox = li.find('input');
    var a = li.find('a');

    var currentName = a.text();
    var newName = editBox.val();

    changeItemName(currentName, newName, li.parents('.feed').data('feed-name'));
    a.text(newName);
    editBox.remove();
    li.find('.confirm').remove();
    a.removeClass('gone');
    li.find('.edit, .feed-delete').removeClass('gone');

    markAsContentChanged();
}

function changeItemName(currentName, newName, feed) {
    var data = $('body').data('json');
    data.forEach(function (e) {
        if (e['feed-name'] == feed) {
            e['items'].forEach(function (eT, iT, arrT) {
                if (eT['item-name'] == currentName) {
                    arrT[iT]['item-name'] = newName;
                }
            });
        }
    });

}

function attachItemDeleteHandler() {
    $('.item i.feed-delete').off('click');
    $('.item i.feed-delete').click(function() {
        var itemName = $(this).parents('.item').find('a').text();
        if (confirm('Are you sure to delete "' + itemName + '?"')) {
            var feedName = $(this).parents('.feed').data('feed-name');

            var json = $('body').data('json');
            json.forEach(function (e, i, arr) {
                if (e['feed-name'] == feedName) {
                    arr[i]['items'].forEach(function (eT, iT, arrT) {
                        if (eT['item-name'] == itemName)
                            arrT.splice(iT, 1);
                    });
                }
            });

            markAsContentChanged();

            $('body').data('json', json);
            $(this).parents('li').remove();
            markActiveItem();
        }
    });
}

function attachFeedDeleteHandler() {
    $('.feed-title i.feed-delete').off('click');
    $('.feed-title i.feed-delete').click(function() {
        var feedName = $(this).parents('.feed').data('feed-name');
        if (confirm('Are you sure to delete "' + feedName + '?"')) {
            var feedToken, feedId;
            var json = $('body').data('json');
            json.forEach(function (e, i, arr) {
                if (e['feed-name'] == feedName) {
                    feedToken = e['token'];
                    feedId = e['id'];
                    arr.splice(i, 1);
                }
            });

            // $.ajax({
            //     'url': 'editor/deletefeed',
            //     'type': 'POST',
            //     'dataType': 'json',
            //     'data': { token: feedToken, id: feedId },
            //     'success': function () {
            //         toastr.error('Feed deleted successfully.', 'success');
            //     },
            //     'error': function () {
            //         toastr.error('Error uploading to server. Please try again later.', 'danger');
            //     }
            // });

            markAsContentChanged();

            $('body').data('json', json);
            var activeFeed = null;
            loadFeedsToWorkspace();

            if (activeFeed != null)
                markActiveItem();

            enterEditMode();
        }
    });
}

function attachFeedEditHandler() {
    $('.feed-title i.edit').off('click');
    $('.feed-title i.edit').click(function () {
        var span = $(this).parent();
        span.prepend('<input class="feed-editbox" type="text">');
        span.find('label').addClass('gone');
        $(this).addClass('gone');
        span.find('.feed-delete').addClass('gone');
        span.append('<i class="confirm fa fa-check-circle"></i>');

        var editBox = span.find('.feed-editbox');
        editBox.val(span.find('label').text());

        editBox.keypress(function (e) {
            if (e.which == 13) {
                applyFeedNameChange(span);
            }
        });

        span.find('.confirm').click(function () {
            applyFeedNameChange(span);
        });
    });
}

function applyFeedNameChange(span) {
    /* Change name of label, remove Yes button, etc */
    var editBox = span.find('input');
    var label = span.find('label');

    var currentName = label.text();
    var newName = editBox.val();

    changeFeedName(currentName, newName);

    span.parents('.feed').data('feed-name', newName);

    /* If current Feed is the active Feed, need to change active Feed name too */
    if (activeFeed == currentName) {
        activeFeed = newName;
        $('#select-box label').text(newName);
    }

    label.text(newName);
    editBox.remove();
    span.find('.confirm').remove();
    label.removeClass('gone');
    span.find('img').removeClass('gone');
    span.find('i.settings').addClass('gone');

    loadFeedsToWorkspace();
    enterEditMode();

    markAsContentChanged();
}

function changeFeedName(oldName, newName) {
    var data = $('body').data('json');

    data.forEach(function (e, i, arr) {
        if (e['feed-name'] == oldName)
            arr[i]['feed-name'] = newName;
    });
}

function hideEditBox() {
    $('i.edit').removeClass('gone');
    $('.select-feed a').removeClass('gone');
    $('#editor a').removeClass('gone');
    $('.confirm').remove();
    $('.feed-editbox').remove();
    $('.item-editbox').remove();
}