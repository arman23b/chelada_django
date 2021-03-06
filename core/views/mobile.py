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


def mobileListFeeds(request):
    data = {}
    feeds = models.Feed.objects.filter(view_permission="public").order_by('id')
    data['feeds'] = map(lambda x: convert(x.name), feeds)
    return render_to_response("mobileListFeeds.html", data, context_instance=RequestContext(request))


def mobileGetFeed(request, feedName):
    data = {}
    # Change "+" to space
    feedName = feedName.replace("+", " ")
    feed = models.Feed.objects.get(name=feedName, view_permission="public")
    data['feedContent'] = convert(feed.content)
    
    if request.method == "POST":
        # Save that consumer
        info = json.loads(request.body)
        reg_id = info["reg_id"]
        print "Got reg_id in POST request"
        phone_devices = models.PhoneDevice.objects.filter(reg_id=reg_id)
        if len(phone_devices) != 0:
            phone_device = phone_devices[0]
            consumer = phone_device.account
            feed.consumers.add(consumer)
        else:
            print "No phone with reg_id " + reg_id + " is found"

    return render_to_response("mobileGetFeed.html", data, context_instance=RequestContext(request))


def gcmRegister(request):
    if request.method == "POST":
        data = json.loads(request.body)
        print "GCM Register from device: " + str(data)
        name = data["name"]
        email = data["email"]
        reg_id = data["reg_id"]
        dev_id = data["dev_id"]
        # Check if a phone with this reg_id already exists
        existing_phones = models.PhoneDevice.objects.filter(reg_id=reg_id)
        if len(existing_phones) == 0:
            # Check if consumer account for email exists
            try:
                consumer = models.User.objects.get(username=email)
            except ObjectDoesNotExist:
                consumer = models.User.objects.create_user(username=email)
                consumer.save()
                print "New consumer account created for " + email

            new_phone_device = models.PhoneDevice.objects.create(name=name, 
                                                                 reg_id=reg_id, 
                                                                 dev_id=dev_id, 
                                                                 account=consumer)
            new_phone_device.save()
            print "New device registered"

    return HttpResponse("")


def loginConsumer(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data["email"]
        password = data["password"]
        response_data = {}

        print "Consumer " + email + " tries to login"
        try:
            consumer = models.User.objects.get(username=email)
            print password
            if consumer.check_password(password):
                response_data["result"] = "OK"
            else:
                response_data["result"] = "DENY"
        except ObjectDoesNotExist:
            response_data["result"] = "NOUSER"

        print "Login result: " + response_data["result"] 
        return HttpResponse(json.dumps(response_data), content_type="application-json")


def registerConsumer(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data["email"]
        print "Consumer " + email + " tries to register"
        password = data["password"]
        consumer = models.User.objects.create_user(username=email,
                                                   password=password)
        consumer.save()
        print "New consumer created: " + email

    return HttpResponse("")


def unsubscribe(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data["email"]
        feedName = data["feed-name"]
        try:
            consumer = models.User.objects.get(username=email)
        except ObjectDoesNotExist:
            print "User %s doesn't exist" % email
        try:
            feed = models.Feed.objects.get(name=feedName)
            if consumer in feed.consumers.all():
                feed.consumers.remove(consumer)
                feed.save()
                print "User %s successfully unsubscribed from feed %s" % (consumer.username, feedName)
            else:
                print "User %s is not subscribed to feed %s" % (consumer.username, feedName)
        except ObjectDoesNotExist:
            print "Feed %s doesn't exist" % feedName

    return HttpResponse("")