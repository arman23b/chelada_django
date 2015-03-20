from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import models, authenticate, login, logout
from core import models
from util import *
from django.shortcuts import get_object_or_404, render_to_response, redirect
from django.template import RequestContext

from django import forms
from django.core.validators import validate_email
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db.models import Q
from django.core.mail import send_mail

from collections import OrderedDict

import json, unicodedata, urllib2


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
        feedData["feed-name"] = modifyFeedName(feedData["feed-name"], user)
        name = feedData['feed-name']
        view_permission = feedData.get('view-permission', "public")
        content = json.dumps(feedData, sort_keys=True)

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


def sendFeeds(request):
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
        feed = modifyFeedName(feed, user)
        links += "http://chelada-web.herokuapp.com/mobile/getfeed/feedname/%s\n\n" % (feed)
    subject = "%s is sharing Chelada feeds with you" % (user.first_name)
    message = """%s %s would like to share these Chelada Feeds with you: \n\n%s""" % (user.first_name, user.last_name, links)
    htmlmessage = "<html><body>%s</body></html>" % (message)

    send_mail(subject, message, 'Chelada Team', [recipient])

    return HttpResponse(json.dumps(response_data), content_type="application-json")


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