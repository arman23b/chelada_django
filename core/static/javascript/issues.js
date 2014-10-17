$(document).ready(function() {
    var jsonArrIssues = $.parseJSON($('#issues-storage').html());

    jsonArrIssues.sort(issuesSort);

    $.each(jsonArrIssues, function (i, val) {
        var trNew = "<tr class='issue-" + val['type'] + "'>";
        trNew += "<td>" + val['id'] + "</td><td>" + val['type'] + "</td>";
        trNew += "<td>" + val['content'] + "</td><td>" + val['date_time'];
        trNew += "</td><td>" + val['tag'] + "</td>";

        if (val['type'] == "bug") {
            trNew += "<td><a onclick='markBugAs(" + val['id'] + ", 1)' href='javascript:;'>mark as fixed</a></td>";
        }
        else if (val['type'] == "bug-fixed") {
            trNew += "<td><a onclick='markBugAs(" + val['id'] + ", 0)' href='javascript:;'>mark as not fixed</a></td>";
        }
        else {
            trNew += "<td></td>";
        }

        trNew += "</tr>";

        $('table#issues tbody').append(trNew);

    });
});

function issuesSort(a, b) {
    return parseInt(a['id']) - parseInt(b['id']);
}

function postIssue() {
    var jsonNewIssue = {
        type: $("[name='issue-type']:checked").val(),
        content: $("#new-issue-content").html(),
        tag: $("#new-issue-tag").html()
    };
    $.ajax({
        'url': '/issues/post',
        'type': 'POST',
        'dataType': 'json',
        'data': jsonNewIssue,
        'success': function () {
            location.reload(true);
        },
        'error': function () {
            alert("Error posting a new issue.");
        }
    });
}

function markBugAs(id, isFixed) {
    $.ajax({
        'url': '/issues/mark',
        'type': 'POST',
        'dataType': 'json',
        'data': {"id": id, "isFixed": isFixed},
        'success': function () {
            location.reload(true);
        },
        'error': function () {
            alert("Error updating bug status.");
        }
    });
}