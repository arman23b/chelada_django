/***************************** Triggers part code ********************/

var statCount = 0;

var LABEL_RESET_TIME = "Time since last execution",
    LABEL_NUM_TIMES_EXEC = "Times executed";

function genUlLi(arr) {
    var len = arr.length;
    var i = 0;

    var strOutput = "<ul>";

    for (i = 0; i < len; i++) {
        strOutput = strOutput + "<li name='" + arr[i] + "'>" + arr[i] + "</li>";
    }

    strOutput += "</ul>";

    return strOutput;
}

function genOptionsStr(arr, id) {
    var strOutput = "<div class='choose' id='" + id + "'><label class='choosetext'>" + arr[0] + "</label>";
    var ulLi = genUlLi(arr);
    strOutput += ulLi;
    strOutput += "</div>";
    return strOutput;
}

function genEditable(msg, id) {
    return "<div class='choose' id='" + id + "'><label class='editable' contenteditable='true'>" + msg + "</label></div>";
}

function genDarkDiv(msg, id) {
    return "<div class='choose-dark' id='" + id + "'><label class='choosetext-dark'>" + msg + "</label></div>";
}

function objSmoothIn(arr, disabled) {
    var len = arr.length;
    var i;

    if (disabled == true) {
        for (i = 0; i < len; i++) {
            arr[i].css({'opacity' : 1});
        }
    }
    else {
        for (i = 0; i < len; i++) {
            arr[i].css({'opacity' : 0});
        }

        var time = 300;
        for (i = 0; i < len; i++) {
            arr[i].animate({'opacity' : 1}, time);
            time += 150;
        }
    }
}

function appendOpt(to, arr, statNum, id) {
    to.append(genOptionsStr(arr, id));
    return to.find(".choose:last");
}

function appendEdit(to, str, statNum, id) {
    to.append(genEditable(str, id));
    return to.find(".choose:last");
}

function appendDark(to, str, statNum, id) {
    to.append(genDarkDiv(str, id));
    return to.find(".choose-dark:last");
}

var blockStr = "<div class='block'><span class='ifand' style='display: inline-table;'>";
blockStr += "<div class='if'><label class='labels'>If</label><div class='delete'><i class='fa fa-minus-circle'></i></div></div>";
blockStr += "<div class='andif'><label class='andtext'>And</label></div></span>";
blockStr += "<span class='choose'><label class='choosetext'>...</label></span></div>";

var initialThenBlocks = "<tr><td><span class='thenand'><div class='if then'><label class='labels thentext'>Then</label>";
initialThenBlocks += "<div class='delete'><i class='fa fa-minus-circle'></i></div></div><div class='andif andthen'><label class='andtext'>And</label></div></span>";
initialThenBlocks += "<span id='thenaction' class='choose'><label class='choosetext'>...</label></span></td></tr>";

function optionsClickHandler(statNum) {
    $("#stat" + statNum + " .block:last .choose ul li").click(function (e) { // This does not only travel one level up the DOM tree!
        var name = $(this).attr('name');
        var choosespan = $(this).parent().parent();

        $(this).parent().parent().find('.choosetext').text(name); // Cool!

        // Remove previously added options first, if any
        if (choosespan.next().attr('class') == 'options')
            choosespan.next().remove();

        appendIfOptions(name, choosespan, statNum, $(this));

        saveTriggers();
    });
}

function appendIfOptions(name, choosespan, statNum, $this, disabled) {
    choosespan.after("<span class='options'></span>"); // Use .after so that it won't be added even after 'Then'
    var optionsspan = choosespan.next();

    switch(name) {
        case 'Location':
            objSmoothIn([appendOpt(optionsspan, ['In', 'Out of'], statNum, 'loc-rel'),
                appendEdit(optionsspan, 'Address', statNum, 'address'),
                appendDark(optionsspan, 'Radius', statNum),
                appendEdit(optionsspan, '1', statNum, 'radius'),
                appendOpt(optionsspan, ["Feet", "Yards", "Miles"], statNum, 'metric')], disabled);

            break;

        case 'Time':
            /* Default time to now */
            var today = new Date();
            var strTime = pad(today.getHours(), 2) + ":" + pad(today.getMinutes(), 2);
            objSmoothIn([appendOpt(optionsspan, ["On", "Before", "After"], statNum, 'time-rel'),
                appendEdit(optionsspan, strTime, statNum, 'time')], disabled);
            break;

        case 'Day':
            objSmoothIn([appendOpt(optionsspan, ["On", "Before", "After"], statNum, 'time-rel'),
                appendOpt(optionsspan, ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], statNum, 'day')], disabled);
            break;

        case 'Date':
            var today = new Date();
            /* Default the date to today */
            var strToday = pad(today.getMonth() + 1, 2) + "/" + pad(today.getDate(), 2) + "/" + today.getFullYear();
            var timeRel = appendOpt(optionsspan, ["On", "Before", "After"], statNum, 'time-rel');
            var objDate = appendEdit(optionsspan, strToday, statNum, 'date');
            objSmoothIn([timeRel, objDate], disabled);
            objDate.find('label').attr('data-uk-datepicker', "{format:'MM/DD/YYYY'}");

            break;

        case 'Weather':
            objSmoothIn([appendOpt(optionsspan, ["Is", "Is not"], statNum, 'is-not'),
                appendOpt(optionsspan, ["Clear", "Scattered clouds", "Overcast", "Windy", "Drizzle", "Rain", "Thunderstorm", "Fog", "Hail", "Snow"], statNum, 'weather')], disabled);
            break;

        case 'Temperature':
            objSmoothIn([appendOpt(optionsspan, ["Above", "Below", "Equal to"], statNum, 'num-rel'),
                appendEdit(optionsspan, '60', statNum, 'temp'),
                appendDark(optionsspan, 'degrees', statNum)], disabled);
            break;

        case 'Acceleration':
            objSmoothIn([appendOpt(optionsspan, ["Above", "Below", "Equal to"], statNum, 'num-rel'),
                appendEdit(optionsspan, '0', statNum, 'amount'),
                appendDark(optionsspan, 'm2/s', statNum)], disabled);
            break;

        case 'Illuminance':
            objSmoothIn([appendOpt(optionsspan, ["Above", "Below", "Equal to"], statNum, 'num-rel'),
                appendEdit(optionsspan, '0', statNum, 'amount'),
                appendDark(optionsspan, 'lux', statNum)], disabled);
            break;

        case 'Pressure':
            objSmoothIn([appendOpt(optionsspan, ["Above", "Below", "Equal to"], statNum, 'num-rel'),
                appendEdit(optionsspan, '0', statNum, 'amount'),
                appendDark(optionsspan, 'pa', statNum)], disabled);
            break;

        case LABEL_RESET_TIME:
            objSmoothIn([appendDark(optionsspan, 'Above', statNum),
                appendEdit(optionsspan, '10', statNum, 'amount'),
                appendDark(optionsspan, 'min', statNum)], disabled);
            break;

        case LABEL_NUM_TIMES_EXEC:
            objSmoothIn([appendDark(optionsspan, 'Below', statNum),
                appendEdit(optionsspan, '0', statNum, 'amount')], disabled);
            break;

    }

    if ($("#stat" + statNum + " #thenaction").length == 0 && $this.parents('.block').is(':last-child')) // If 'Then' is not created yet, and the current Block is the last Block
        optionsspan.append("<div class='if thenbutton'><label class='labels thenbuttontext'>Then</label></div>");

    var optionInputs = optionsspan.find('.editable');
    optionInputs.click(function () {
        if ($(this).css('font-style') != 'normal') {
            $(this).text('');
            $(this).css({'font-style' : 'normal', 'color' : '#6d6e70'});
            $(this).off('focus');
        }
        saveTriggers();
    });

    // At the time when document is just ready, .options is not created yet, so have to create handler here again
    $("#stat" + statNum + " .options .choose ul li").click(function (e) {
        var optname = $(this).attr('name');
        $(this).parent().parent().find('.choosetext').text(optname);
    });

    addThenButtonHandler(statNum);
}

function addThenButtonHandler(statNum) {
    // Handler for button the button to create the Then section
    $("#stat" + statNum + " .options .thenbutton").click(function (e) {
        addThenSection($(this), statNum);
    });
}

function addThenSection($thenButton, statNum, disableAnimation) {
    var parentBlock = $thenButton.parents('.block');
    $thenButton.remove();
    parentBlock.find('.andif').css({'display' : 'none'}); // Don't delete; may revert later

    parentBlock.append("<div id='thenblocks'><table>" + initialThenBlocks + "</table></div>");

    if (disableAnimation != true) {
        var thenAction = $('#stat' + statNum + ' #thenblocks tr:last #thenaction');
        thenAction.css({'left' : '-50px', 'z-index' : -1}); // Put it behind Then, and make it unhoverable (z-index)
        thenAction.animate({'left' : '0px'}, 300, 'swing', function() {
            thenAction.attr('style', '');
        });
    }

    attachThenOptionsHandler(statNum);
    attachAndThenHandler(statNum);
    attachDeleteThenHandler(statNum);
}

function attachAndThenHandler(statNum) {
    $('#stat' + statNum + ' #thenblocks tr:last .thenand .andthen').off('click');
    $('#stat' + statNum + ' #thenblocks tr:last .thenand .andthen').click(function (e) {
        $(this).addClass('andifexpanded');

        $('#stat' + statNum + ' #thenblocks table').append(initialThenBlocks);

        var thenAnd = $('#stat' + statNum + ' #thenblocks tr:last .thenand');
        var thenAction = $('#stat' + statNum + ' #thenblocks tr:last #thenaction');
        thenAnd.css({'opacity' : 0, 'z-index' : -1});
        thenAction.css({'left' : '-40px', 'z-index' : -2, 'opacity' : 0});
        thenAnd.animate({'opacity' : 1}, 300, 'swing', function() {
            thenAction.css({'opacity' : 1});
            thenAction.animate({'left' : '0px'}, 300, 'swing', function() {
                thenAction.attr('style', '');
                thenAnd.attr('style', '');
            });
        });

        attachThenOptionsHandler(statNum);
        attachAndThenHandler(statNum);
        attachDeleteThenHandler(statNum);

        adjustHeight($('#stat' + statNum));
    });
}

function attachDeleteThenHandler(statNum) {
    $('#stat' + statNum + ' #thenblocks tr:last .delete').click(function (e) {
        $(this).off('click');
        thisThen = $(this).parents('.thenand').parent().parent(); // Locate the tr
        var isLastOne = thisThen.is(':last-child');
        var isOnlyOne = (thisThen.parent().find('tr').length == 1);
        thisThen.animate({'opacity' : 0}, 400, 'swing', function() {
            thisThen.remove();

            if (isOnlyOne) {
                $('#stat' + statNum + ' #thenblocks').remove();
                $("#stat" + statNum + " .block:last .options").append("<div class='if thenbutton'><label class='labels thenbuttontext'>Then</label></div>");
                $("#stat" + statNum + " .block:last .andif").css({'display' : ''});
                addThenButtonHandler(statNum);
            }
            else if (isLastOne) {
                $('#stat' + statNum + ' #thenblocks tr:last .andthen').removeClass('andifexpanded');
                attachAndThenHandler(statNum);
            }

            adjustHeight($('#stat' + statNum));

        });

        saveTriggers();
    });
}

function attachThenOptionsHandler(statNum) {
    $("#stat" + statNum + " #thenblocks tr:last #thenaction").append(genUlLi(["Push Notification", "Push Image", "Show Map", "Show Web View", "Send Message", "Call", "Open App", "Open Web Page", "Play Sound", "Vibrate"]));
    // TODO Make sure only one thenoptions exists at the time

    $("#stat" + statNum + " #thenblocks tr:last #thenaction ul li").click(function (e) {
        var thisThen = $(this).parent().parent().parent(); // Locate the td of this Then
        var name = $(this).attr('name');
        thisThen.find('.choosetext').text(name);

        var existingOptions = thisThen.find('.thenoptions');
        if (existingOptions.length != 0)
            existingOptions.remove();
        // Can't do animation here, since not able to block application execution for a while

        appendThenOptions(thisThen, statNum, name);
    });
}

function appendThenOptions(tdThisThen, statNum, name, disableAnimation) {
    tdThisThen.find('#thenaction').after("<span class='thenoptions'></span>");

    var thenoptions = tdThisThen.find('.thenoptions');

    switch (name) {
        case 'Call':
            objSmoothIn([appendEdit(thenoptions, "1234567890", statNum, 'phone-num')], disableAnimation);
            break;

        case 'Send Message':
            objSmoothIn([appendEdit(thenoptions, "1234567890", statNum, 'phone-num')], disableAnimation);
            objSmoothIn([appendEdit(thenoptions, "Content", statNum, 'content')], disableAnimation);
            break;

        case 'Open App':
            objSmoothIn([appendEdit(thenoptions, "App package name", statNum, 'app-name')], disableAnimation);
            break;

        case 'Open Web Page':
            objSmoothIn([appendEdit(thenoptions, "http://", statNum, 'url')], disableAnimation);
            break;

        case 'Push Image':
            objSmoothIn([appendOpt(thenoptions, ["Regular", "Sticky"], statNum, 'sticky'),
                appendEdit(thenoptions, "Title", statNum, 'title'),
                appendEdit(thenoptions, "Content", statNum, 'content'),
                appendEdit(thenoptions, "http://", statNum, 'url')], disableAnimation);
            break;

        case 'Play Sound':
            objSmoothIn([appendEdit(thenoptions, "http://", statNum, 'url')], disableAnimation);
            break;

        case 'Push Notification':
            objSmoothIn([appendOpt(thenoptions, ["Regular", "Sticky"], statNum, 'sticky'),
                appendEdit(thenoptions, "Title", statNum, 'title'),
                appendEdit(thenoptions, "Content", statNum, 'content')], disableAnimation);
            break;

        case 'Show Map':
            objSmoothIn([appendOpt(thenoptions, ["Regular", "Sticky"], statNum, 'sticky'),
                appendOpt(thenoptions, ["Show location", "Show direction"], statNum, 'map-type'),
                appendEdit(thenoptions, "Title", statNum, 'title'),
                appendEdit(thenoptions, "Content", statNum, 'content'),
                appendEdit(thenoptions, "Latitude", statNum, 'latitude'),
                appendEdit(thenoptions, "Longitude", statNum, 'longitude'),
                appendEdit(thenoptions, "Zoom level", statNum, 'zoom')], disableAnimation);
            break;

        case 'Show Web View':
            objSmoothIn([appendOpt(thenoptions, ["Regular", "Sticky"], statNum, 'sticky'),
                appendEdit(thenoptions, "Title", statNum, 'title'),
                appendEdit(thenoptions, "Content", statNum, 'content'),
                appendEdit(thenoptions, "http://", statNum, 'url')], disableAnimation);
            break;
    }

    thenoptions.find(".choose ul li").click(function (e) {
        var optname = $(this).attr('name');
        $(this).parent().parent().find('.choosetext').text(optname);
    });

    thenoptions.find('.editable').click(function (e) {
        if ($(this).css('font-style') != 'normal') {
            $(this).text('');
            $(this).css({'font-style' : 'normal', 'color' : '#6d6e70'});
            $(this).off('click');
        }
        saveTriggers();
    });
}

function adjustHeight(currentStat) {
    var addlineButton = currentStat.find('.addline');
    if (addlineButton.hasClass('expanded')) { // Only when .addline is expanded
        var totalHeight = 52 * currentStat.find('.block').length + currentStat.find('#thenblocks').height();
        addlineButton.css({'height' : totalHeight});
    }
}

function andIfHandler(statNum) {
    $('#stat' + statNum + ' .block:last .andif').click(function () {
        addNewBlock($(this), statNum);
    });

    // Attach delete button handler
    $('#stat' + statNum + ' .block:last .delete').click(function (e) {
        deleteBlock($(this), statNum);
        saveTriggers();
    });
}

function addNewBlock($andIfButton, statNum, disableAnimation) {
    $andIfButton.addClass('andifexpanded');
    $andIfButton.off('click');

    $andIfButton.parents('.block').find('.thenbutton').remove(); // Not allowed to add 'Then' unless in the last block

    $('#stat' + statNum + ' .blocktd').append(blockStr);

    if (disableAnimation != true) {
        var blockAdded = $('#stat' + statNum + ' .blocktd .block:last');
        var ifAnd = blockAdded.find('.ifand');
        var choose = blockAdded.find('.choose');
        ifAnd.css({'opacity' : 0});
        choose.css({'left' : '-30px', 'opacity' : 0});
        ifAnd.animate({'opacity' : 1}, 300, 'swing',
            function() {
                choose.animate({'left' : '0px', 'opacity' : 1}, 300);
            });
    }


    if ($('#stat' + statNum + ' .addline').css('visibility') == 'visible') // Adjust height only when .addline is shown
        adjustHeight($('#stat' + statNum));

    andIfHandler(statNum);
    fillInOptions(statNum);
    optionsClickHandler(statNum);
}

function deleteBlock($this, statNum) { // Why can't use 'this?'
    var parentBlock = $this.parents('.block');

    parentBlock.animate({'opacity' : 0}, 300);
    parentBlock.animate({'height' : '0px'}, 300, 'swing',
        function() {
            var isLastChild = $this.is(':last-child');
            parentBlock.remove();
            // Make sure to add handler back ONLY AFTER it's removed

            if (isLastChild) {
                // If the removed is the last child, revert addIf button to original state
                $('#stat' + statNum + ' .block:last .andif').removeClass('andifexpanded');
                $('#stat' + statNum + ' .block:last .delete').off('click'); // Remove click handler for that block
                andIfHandler(statNum); // ... since it will be added back here

                $("#stat" + statNum + " .block:last .options").append("<div class='if thenbutton'><label class='labels thenbuttontext'>Then</label></div>");

                addThenButtonHandler(statNum);
                // Append to the end of .options only; if it does not exist, don't
            }

            adjustHeight($('#stat' + statNum));
        }
    );
    // Smooth deletion animation
}

function fillInOptions(statNum) {
    $("#stat" + statNum + " .block:last .choose").append(genUlLi(["Location", "Time", "Day", "Date", "Weather", "Temperature", "Acceleration", "Illuminance", "Pressure", "Time since last execution", "Times executed"]));
}

function addlineHandler() {
    $(".stats:last .addline").click(function (e) {
        updateAddLineButtonState($(this));

        initStatement(); // Call itself to initialize the new statement again
    });
}

function updateAddLineButtonState($this) {
    $this.css({'visibility' : 'visible', 'opacity' : 1});
    $this.find('.plustext').attr('style', 'opacity: 0');
    $this.addClass('expanded');
    $this.off('click');

    adjustHeight($this.parents('.stats'));
}

function initStatement(anim) {
    // Create a new statement
    statCount++;
    var statementString = "<div class='stats' style='opacity: 0' id='stat" + statCount + "'>";
    statementString += "<table><tr><td id='triggertd'><span class='triggeradd' style='display: inline-table;'>";
    statementString += "<div class='trigger'><label class='labels'>Trigger<div class='delete'><i class='fa fa-minus-circle'></i></div></label></div></div>";
    statementString += "<div class='addline'><label class='plustext'>+</label></div></span></td>";
    statementString += "<td class='blocktd'>" + blockStr + "</td></tr></table></div>";
    $('#triggers').append(statementString);

    $('.stats:last .blocktd .block:first').attr('style', 'position: relative; left: -35px;');
    $('.stats:last .blocktd .choose').attr('style', 'position: relative; left: -50px;');

    if (anim != false) {
        $('.stats:last').animate({'opacity' : 1}, 300, 'swing',
            function() {
                $('.stats:last .blocktd .block:first').animate({'left' : '0px'}, 300);
                $('.stats:last .blocktd .choose').animate({'left' : '0px'}, 500);
            });
    }
    else {
        $('.stats:last').css({'opacity' : 1});
        $('.stats:last .blocktd .block:first').css({'left' : '0px'});
        $('.stats:last .blocktd .choose').css({'left' : '0px'});
    }

    var thisStat = statCount;
    fillInOptions(thisStat);

    optionsClickHandler(thisStat);
    addlineHandler(thisStat);

    // Bind handler for .delete
    $('#stat' + thisStat + ' .trigger .delete').click(function (e) {
        deleteStatement(thisStat);
        saveTriggers();
    });

    andIfHandler(thisStat);
    return statCount;
}

function deleteStatement(thisStat) {
    if ($('.stats').length != 1) {// Won't delete if only one left
        var stat = $('#stat' + thisStat);
        var isLastChild = $('#stat' + thisStat).is(':last-child');
        stat.animate({'opacity' : 0}, 300);
        stat.animate({'height' : '0px'}, 300, 'swing',
            function() {
                stat.remove();
                if (isLastChild) {
                    var addline = $('.stats:last .addline');
                    addline.removeClass('expanded');
                    addline.attr('style', '');
                    addline.find('.plustext').attr('style', ''); // Clear inline CSS attributes
                    addlineHandler();
                }
            }
        );
    }
}

function storeOptionsData(thisBlock, options, arr) {
    arr.forEach(function (e, i, a) {
        var val = options.find('#' + e + ' > label').text();
        thisBlock[e] = val;

        switch(e) {
            case 'radius':
                if (isNaN(val))
                    throw 'Radius has to be a number.';
                break;

            case 'temp':
                if (isNaN(val))
                    throw 'Temperature has to be a number.';
                break;

            case 'phone-num':
                if (isNaN(val))
                    throw 'Phone number can consist of numbers only.';
                break;

            case 'amount':
                if (isNaN(val))
                    throw 'Values of acceleration, illuminance and pressure have to be numbers.';
                break;
        }
    });

    return thisBlock;
}

/**
 * Parse JSON from HTML Triggers.
 * @returns {JSON Array} if successful
 *          1 if error is raised
 */
function getJSONFromTriggers() {
    var jsonExport = [];

    try {

        $('.stats').each(function (i, e) {
            var thisStatement = {
                'if' : [],
                'then' : []
            };

            $(e).find('.block').each(function (ib, eb) {
                if (ib != 0)
                    thisStatement['if'].push({'block-type' : 'And'});

                var thisBlock = {};
                var type = $(eb).find('> .choose .choosetext').text();
                thisBlock['block-type'] = type;

                if (type == '...')
                    throw 'Block type cannot be empty';

                var options = $(eb).find('.options');

                switch (type) {
                    case 'Location':
                        storeOptionsData(thisBlock, options, ['loc-rel', 'address', 'radius', 'metric']);
                        break;

                    case 'Time':
                        storeOptionsData(thisBlock, options, ['time-rel', 'time']);
                        break;

                    case 'Day':
                        storeOptionsData(thisBlock, options, ['time-rel', 'day']);
                        break;

                    case 'Date':
                        storeOptionsData(thisBlock, options, ['time-rel', 'date']);
                        break;

                    case 'Weather':
                        storeOptionsData(thisBlock, options, ['is-not', 'weather']);
                        break;

                    case 'Temperature':
                        storeOptionsData(thisBlock, options, ['num-rel', 'temp']);
                        break;

                    case 'Acceleration':
                    case 'Illuminance':
                    case 'Pressure':
                    case LABEL_NUM_TIMES_EXEC:
                        storeOptionsData(thisBlock, options, ['amount']);
                        break;

                    case LABEL_RESET_TIME:
                        storeOptionsData(thisBlock, options, ['amount']);
                        break;

                }
                thisStatement['if'].push(thisBlock);
            });

            if ($(e).find('#thenblocks td').length == 0)
                throw 'Add "Then" blocks to complete a statement.';

            $(e).find('#thenblocks td').each(function (itd, etd) {
                var thisBlock = {};
                var type = $(etd).find('#thenaction label').text();
                thisBlock['block-type'] = type;

                if (type == '...')
                    throw 'Block type cannot be empty';

                var options = $(etd).find('.thenoptions');

                switch (type) {
                    case 'Call':
                        storeOptionsData(thisBlock, options, ['phone-num']);
                        break;

                    case 'Send Message':
                        storeOptionsData(thisBlock, options, ['phone-num', 'content']);
                        break;

                    case 'Open App':
                        storeOptionsData(thisBlock, options, ['app-name']);
                        break;

                    case 'Open Web Page':
                        storeOptionsData(thisBlock, options, ['url']);
                        break;

                    case 'Push Image':
                        storeOptionsData(thisBlock, options, ['url', 'sticky', 'title', 'content']);
                        break;

                    case 'Play Sound':
                        storeOptionsData(thisBlock, options, ['url']);
                        break;

                    case 'Push Notification':
                        storeOptionsData(thisBlock, options, ['title', 'content', 'sticky']);
                        break;

                    case 'Show Map':
                        storeOptionsData(thisBlock, options, ['map-type', 'title', 'content', 'sticky', 'latitude', 'longitude', 'zoom']);

                    case 'Show Web View':
                        storeOptionsData(thisBlock, options, ['title', 'content', 'sticky', 'url']);
                }

                thisStatement['then'].push(thisBlock);
            });

            jsonExport.push(thisStatement);
        });

        return jsonExport;
    } catch(err) {
        toastr.info(err);
        return 1;
    }
}

/**
 *  @param data: Valid non-empty JSON object representing a single Task
 *  @returns null, print the result to workspace
 */
function printJSONToTriggers(data) {
    try {
        var statNum = 0;

        data.forEach(function (e, i, a) {
            // Loop through every statement, which is e here
            var ifArr = e['if'];
            var thenArr = e['then'];

            if (i != 0) // Not the first statement; then need to add .expanded class to addlineButton
                updateAddLineButtonState($('#stat' + statNum + ' .addline'));

            statNum = initStatement(false); /* Therefore, even if there are no If blocks, there will still be a '...' */

            if (ifArr != undefined) {
                ifArr.forEach(function (eif, iif, aif) {
                    // Loop through every If block
                    var name = eif['block-type'];

                    if (name != 'And') {
                        // If not the first block in a statement, add a block first
                        if (iif != 0)
                            addNewBlock($('.block:last .andif'), statNum, true);

                        $('.block:last .choose .choosetext').text(name);
                        appendIfOptions(name, $('.block:last .choose'), statNum, $(".block:last .choose ul li"), true);
                        fillInOptionsData($('.block:last'), eif);
                    }
                });
            }

            if (thenArr != undefined) {
                thenArr.forEach(function (ethen, ithen, athen) {
                    // Loop through every Then block

                    if (ithen == 0)
                        addThenSection($('#stat' + statNum + ' .options .thenbutton'), statNum, true);

                    var name = ethen['block-type'];
                    $('#stat' + statNum + ' tr:last #thenaction label').text(name);

                    appendThenOptions($('#stat' + statNum + ' #thenblocks tr:last td'), statNum, name, true);
                    fillInOptionsData($('#stat' + statNum + ' #thenblocks tr:last .thenoptions'), ethen);

                    if (ithen != 0) {
                        attachThenOptionsHandler(statNum);
                        attachAndThenHandler(statNum);
                        attachDeleteThenHandler(statNum);
                    }

                    if (ithen != athen.length - 1) {
                        $('#stat' + statNum + ' #thenblocks tr:last .andthen').addClass('andifexpanded');
                        $('#stat' + statNum + ' #thenblocks tr:last').after(initialThenBlocks);
                    }

                });
            }
        });
    } catch (e) {
        toastr.error('Failed to parse JSON object: ' + e);
    }
}

function fillInOptionsData($thisBlock, blockData) {
    $.each(blockData, function (key, val) {
        if (key != 'block-type') {
            var thisLabel = $thisBlock.find('#' + key + ' label');
            thisLabel.css({'font-style' : 'normal', 'color' : '#6d6e70'});
            thisLabel.text(val);
        }
    });
}
