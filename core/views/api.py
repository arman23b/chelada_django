from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import models, authenticate, login, logout
from core import models
from django.shortcuts import get_object_or_404, render_to_response, redirect
from django.http import Http404
from django.template import RequestContext

from django import forms
from django.core.validators import validate_email
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db.models import Q
from django.core.mail import send_mail

from collections import OrderedDict

import json, unicodedata, urllib2


def producerSend(request):
    if request.method == "POST":
        data = json.loads(request.body)
        print "API request: adding feed " + str(data)
        producerUsername = data["producerUsername"]
        consumerUsername = data["consumerUsername"]
        name = data["feed-name"]
        content = data["feed"]
        try:
            user = models.User.objects.get(username=producerUsername)

            old_feeds = models.Feed.objects.filter(name=name,
                                                   owner=user)

            if len(old_feeds) == 0:
                print "Creating a new feed"
                new_feed = models.Feed.objects.create(name=name, 
                                                      owner=user, 
                                                      content=content, 
                                                      view_permission="public") 
                try:
                    consumer = models.User.objects.get(username=consumerUsername)
                    new_feed.consumers.add(consumer)
                    new_feed.save()
                    updateConsumers(new_feed)
                    print "Consumer updated"
                except ObjectDoesNotExist:
                    print "Consumer %s doesn't exist" % consumerUsername
            else:
                print "Updating existing feed"
                old_feed = old_feeds[0]
                old_feed.content = content
                old_feed.save()
                updateConsumers(old_feed)
                

            return HttpResponse("")

        except ObjectDoesNotExist:
            print "Username %s doesn't exist" % producerUsername
            return Http404("Username not found")


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