#!/usr/bin/env python
# -*- coding: utf-8 -*- 

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


def ticketForm(request):
    data = {}
    return render_to_response("ticketDemo.html", data, context_instance=RequestContext(request))


def ticketFormSubmit(request):
    data = {}
    if request.method == "POST":
        consumerUsername = request.POST["email"]
        producerUsername = "arman23b@gmail.com"
        origin = request.POST["origin"]
        destination = request.POST["destination"]
        date = request.POST["date"]
        time = request.POST["time"]
        feed_name = "Flight Demo"
        feed = """{"feed-name":"Flight Demo","items":[{"item-name":"Announcement","rules":[{"if":[{"block-type":"Times executed","amount":"1"}],"then":[{"block-type":"Push Notification","title":"Your Flight Info","content":"US Airways 8845 Date: 3/6/2015 Time: 1:30 pm From: %s To: %s","sticky":"Regular"}]}]},{"item-name":"Online Check-in","rules":[{"if":[{"block-type":"Time","time-rel":"After","time":"10:00"},{"block-type":"And"},{"block-type":"Times executed","amount":"1"}],"then":[{"block-type":"Push Notification","title":"Check-in Available","content":"Follow this link: www.usairways.com","sticky":"Regular"}]}]},{"item-name":"Travel Day","rules":[{"if":[{"block-type":"Time","time-rel":"After","time":"10:00"},{"block-type":"And"},{"block-type":"Times executed","amount":"1"}],"then":[{"block-type":"Push Notification","title":"Gate and Seat Info","content":"You gate is B34 and your seat is 3A","sticky":"Regular"}]}]}]}""" % (destination, origin)
        testSendFeed(producerUsername, consumerUsername, feed_name, feed)
        return render_to_response("ticketDemo.html", data, context_instance=RequestContext(request))
    else:
        return redirect("/ticketForm")


def testSendFeed(producerUsername, consumerUsername, feed_name, feed):
    url = "http://localhost:7000/addFeed"
    opener = urllib2.build_opener(urllib2.HTTPHandler)
    message = { "producerUsername" : producerUsername,
                "consumerUsername" : consumerUsername,
                "feed-name" : feed_name, 
                "feed" : feed }
    request = urllib2.Request(url, data=json.dumps(message))
    request.add_header("Content-Type", "application/json")
    result = opener.open(request)
    return