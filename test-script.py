import urllib2, json

def testSendFeed(username, can_name, feed):
    url = "http://chelada-web.herokuapp.com/addFeed"
    opener = urllib2.build_opener(urllib2.HTTPHandler)
    message = {"username" : username, "can-name" : can_name, "feed" : feed}
    request = urllib2.Request(url, data=json.dumps(message))
    request.add_header("Content-Type", "application/json")
    result = opener.open(request)
    return

feed = """{"can-name": "Web View Demo", "tasks": [{"task-name": "Check Location", "triggers": [{"if": [{"block-type": "Location", "loc-rel": "In", "address": "Carnegie Mellon University", "radius": "3000", "metric": "Feet"}, {"block-type": "And"}, {"block-type": "Time since last execution", "amount": "1"}], "then": [{"block-type": "Push Notification", "title": "In CMU", "content": "", "sticky": "Regular"}]}]}], "view-permission": "public", "edit-permission": "owner", "editors": "", "can-icon": "http://www.projectpier.org/files/images/icons/icon-tour64.gif"}"""
testSendFeed("arman23b@gmail.com", "Web View Demo", feed)
