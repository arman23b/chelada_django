from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import models, authenticate, login, logout
from core import models
from util import *
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