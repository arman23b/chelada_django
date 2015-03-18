from django.conf import settings
from django.contrib.auth import authenticate

from django.core.validators import validate_email
from django.core.exceptions import ValidationError

import json, urllib2


def convert(input):
    if isinstance(input, dict):
        return {convert(key): convert(value) for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [convert(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input


def getFeedData(feeds):
    if len(feeds) == 0:
        return ""
    for feed in feeds:
        feedDict = json.loads(feed.content)
        feedName = feedDict["feed-name"]
        feedDict["feed-name"] = feedName[feedName.index("/")+1 :]
        feed.content = json.dumps(feedDict)
    return ",".join(map(lambda x : x.content, feeds))


def modifyFeedName(feedName, user):
    if user.first_name != "":
        feedName = "@%s/%s" % (user.first_name, feedName)
    else:
        feedName = "@%s/%s" % (user.username, feedName)
    return feedName


def authUser(email, password):
    return authenticate(username=email, password=password)


def validateEmail(email):
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False 


def updateConsumers(feed):
    for consumer in feed.consumers.all():
        print "Feed " + feed.name + " : updating consumers"
        phone_device = consumer.phonedevice_set.all()[0]
        sendGCMMessage(phone_device.reg_id, {"feed" : feed.content})


def sendGCMMessage(reg_id, data):
    url = "https://android.googleapis.com/gcm/send"
    opener = urllib2.build_opener(urllib2.HTTPHandler)
    message = {"data" : data, "registration_ids" : [reg_id]}
    request = urllib2.Request(url, data=json.dumps(message))
    request.add_header("Content-Type", "application/json")
    request.add_header("Authorization", "key="+settings.GCM_APIKEY)
    result = opener.open(request)
    if result.getcode() == 200:
        print "Successfully sent GCM message: " + str(data) + " to " + reg_id
        print result.read()
        return True
    return False