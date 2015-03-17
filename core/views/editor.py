from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import models, authenticate, login, logout
from core import models
from django.shortcuts import get_object_or_404, render_to_response, redirect
from django.template import RequestContext

from django import forms
from django.core.validators import validate_email
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db.models import Q
from django.core.mail import send_mail

from collections import OrderedDict

import json, unicodedata, urllib2
from passlib.hash import pbkdf2_sha256


def index(request):
    data = {}
    data['user'] = request.user
    return render_to_response("index.html", data, context_instance=RequestContext(request))


def editor(request):
    data = {}
    user = request.user
    data['user'] = user
    feeds = models.Feed.objects.filter(owner=user).order_by('id')
    data['feedsData'] = getFeedData(feeds)
    data['sharedFeed'] = models.Feed.objects.filter(Q(view_permission="public") and ~Q(owner=user)).order_by('id')
    return render_to_response("editor.html", data, context_instance=RequestContext(request))


def editorUpload(request):
    response_data = {}
    user = request.user
    decoded = json.loads(request.POST['json'],object_pairs_hook=OrderedDict)

    for feedData in decoded:
        name = feedData['feed-name']
        view_permission = feedData.get('view-permission', "public")
        content = json.dumps(feedData)

        try:
            feed = models.Feed.objects.get(name=name, owner=user)
            if feed.content != content:
                feed.content = content
                feed.view_permission = view_permission
                feed.save()
                updateConsumers(feed)
        except ObjectDoesNotExist:
            new_feed = models.Feed.objects.create(name=name, 
                                                 owner=user, 
                                                 content=content, 
                                                 view_permission=view_permission)
            new_feed.save()  
    return HttpResponse(json.dumps(response_data), content_type="application-json")


def sendFeed(request):
    response_data = {}
    user = request.user
    
    recipient = request.POST['recipient']
    feedsToSend = request.POST['feeds']

    if not validateEmail(recipient):
        response_data['result'] = 0;
    else:
        response_data['result'] = 1;

    links = ""
    for feed in json.loads(feedsToSend):
        feed = feed.replace(" ", "%20")
        links += "http://chelada-web.herokuapp.com/mobile/getfeed/feedname/%s\n\n" % (feed)
    subject = "%s is sharing Chelada feeds with you" % (user.first_name)
    message = """%s %s would like to share these Chelada Feeds with you: \n\n%s""" % (user.first_name, user.last_name, links)
    htmlmessage = "<html><body>%s</body></html>" % (message)

    send_mail(subject, message, 'Chelada Team', [recipient])

    return HttpResponse(json.dumps(response_data), content_type="application-json")


def getFeedData(feeds):
    if len(feeds) == 0:
        return ""
    return",".join(map(lambda x : x.content, feeds))


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


def browse(request):
    user = request.user
    data = {}
    feeds = models.Feed.objects.filter(view_permission="public").order_by('id')

    data['user'] = user
    data['feeds'] = feeds
    return render_to_response("browse.html", data, context_instance=RequestContext(request))


def browseLook(request, id):
    user = request.user
    data = {}
    feeds = models.Feed.objects.filter(id=id, view_permission="public").order_by('id')

    data['user'] = user
    data['feeds'] = feeds
    data['feedsData'] = getFeedData(feeds)
    return render_to_response("browseLook.html", data, context_instance=RequestContext(request))