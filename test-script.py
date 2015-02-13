import urllib2, json

def testSendFeed(username, can_name, feed):
    url = "http://localhost:8000/addFeed"
    opener = urllib2.build_opener(urllib2.HTTPHandler)
    message = {"username" : username, "can-name" : can_name, "feed" : feed}
    request = urllib2.Request(url, data=json.dumps(message))
    request.add_header("Content-Type", "application/json")
    result = opener.open(request)
    return

feed = """{"can-name": "Web View Demo", "tasks": [{"task-name": "Check Location", "triggers": [{"if": [{"block-type": "Location", "loc-rel": "In", "address": "Carnegie Mellon University", "radius": "3000", "metric": "Feet"}, {"block-type": "And"}, {"block-type": "Time since last execution", "amount": "1"}], "then": [{"block-type": "Push Notification", "title": "In CMU", "content": "", "sticky": "Regular"}]}]}], "view-permission": "public", "edit-permission": "owner", "editors": "", "can-icon": "http://www.projectpier.org/files/images/icons/icon-tour64.gif"}"""
#feed = """{"can-name": "Web View Demo", "tasks": [{"task-name": "Wiki Page and Maps", "triggers": [{"if": [{"block-type": "Location", "loc-rel": "In", "address": "Carnegie Mellon University", "radius": "3000", "metric": "Feet"}, {"block-type": "And"}, {"block-type": "Times executed", "amount": "1"}], "then": [{"block-type": "Show Web View", "title": "Restaurants", "content": "", "sticky": "Regular", "url": "https://www.google.com/maps/search/restaurants/@40.4424295,-79.9434771,15z"}, {"block-type": "Show Web View", "title": "Walking to the Sky", "content": "", "sticky": "Regular", "url": "http://en.wikipedia.org/wiki/Walking_to_the_Sky"}]}]}], "view-permission": "public", "edit-permission": "owner", "editors": "", "can-icon": "http://www.projectpier.org/files/images/icons/icon-tour64.gif"}"""
testSendFeed("arman23b@gmail.com", "Web View Demo", feed)
