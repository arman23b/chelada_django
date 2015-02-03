import urllib2, json

def testSendFeed(username, can_name, feed):
    url = "http://localhost:8000/addFeed"
    opener = urllib2.build_opener(urllib2.HTTPHandler)
    message = {"username" : username, "can-name" : can_name, "feed" : feed}
    request = urllib2.Request(url, data=json.dumps(message))
    request.add_header("Content-Type", "application/json")
    result = opener.open(request)
    return

feed = """{"can-name": "Flight Information", "tasks": [{"task-name": "Flight Reminder", "triggers": [{"if": [{"block-type": "Date", "time-rel": "On", "date": "12/02/2014"}], "then": [{"block-type": "Push Notification", "title": "Flight Reminder", "content": "Your flight is tomorrow at 10:00AM", "sticky": "Regular"}]}]}, {"task-name": "Online Check-In", "triggers": [{"if": [{"block-type": "Date", "time-rel": "On", "date": "12/02/2014"}], "then": [{"block-type": "Open Web Page", "url": "http://usairways.com/check-in"}]}]}]}"""
testSendFeed("arman23b@gmail.com", "test-1", feed)