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


def loginUser(request):
    email = request.POST["email"]
    password = request.POST['password']

    response_data = {}
    user = authUser(email, password)
    if user is None:
        response_data['result'] = 0
    else:
        response_data['result'] = 1
        login(request, user)
    return HttpResponse(json.dumps(response_data), content_type="application-json")


def logoutUser(request):
    logout(request)
    return HttpResponseRedirect('/')


def registerUser(request):
    email = request.POST["email"]
    password = request.POST['password']
    password_repeat = request.POST['password_repeat']
    nickname = request.POST['nickname']

    response_data = {}
    # 1. Validate email
    if not validateEmail(email):
        response_data['result'] = 1
    # 2. Validate passwords
    elif password != password_repeat:
        response_data['result'] = 2
    # 4. Empty password
    elif len(password) == 0:
        response_data['result'] = 4
    # 3. Email registered
    elif authUser(email, password) is not None:
        response_data['result'] = 3
    # 5. Empty nickname
    elif len(nickname) == 0:
        response_data['result'] = 5
    # 6. Create user
    else:
        new_user = models.User.objects.create_user(username=email, password=password, first_name=nickname)
        new_user.save()
        new_user = authUser(email, password)
        login(request, new_user)
        response_data['result'] = 0
    return HttpResponse(json.dumps(response_data), content_type="application-json")


def authUser(email, password):
    return authenticate(username=email, password=password)


def validateEmail(email):
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False