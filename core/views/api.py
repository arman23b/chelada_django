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


def producerSend(request):
    if request.method == "POST":
        data = json.loads(request.body)
        print "API request: adding feed " + str(data)
        username = data["username"]
        name = data["can-name"]
        content = data["feed"]
        user = models.User.objects.get(username=username)

        old_feeds = models.Cans.objects.filter(name=name,
                                               owner=user)

        if len(old_feeds) == 0:
            print "Creating a new feed"
            new_feed = models.Cans.objects.create(name=name, 
                                                  owner=user, 
                                                  content=content, 
                                                  view_permission="public") 
            new_feed.save()
        else:
            print "Updating existing feed"
            old_feed = old_feeds[0]
            old_feed.content = content
            old_feed.save()
            updateConsumers(old_feed)
            

    return HttpResponse("")