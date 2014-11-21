from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import models, authenticate, login, logout
from core import models
from django.shortcuts import get_object_or_404, render_to_response, redirect
from django.template import RequestContext

from django import forms
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db.models import Q

from collections import OrderedDict

import json, unicodedata

#################
##### FORMS #####
#################

#################
##### VIEWS #####
#################

#################
##### Index #####
#################

def index(request):
    data = {}
    data['user'] = request.user
    return render_to_response("index.html", data, context_instance=RequestContext(request))

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
		

#################
#### Editor #####
#################

def editor(request):
	data = {}
	user = request.user
	data['user'] = user
	cans = models.Cans.objects.filter(owner=user)
	data['cansData'] = getCansData(cans)
	data['sharedCans'] = models.Cans.objects.filter(Q(view_permission="public") and ~Q(owner=user))
	return render_to_response("editor.html", data, context_instance=RequestContext(request))

def editorUpload(request):
	response_data = {}
	user = request.user
	decoded = json.loads(request.POST['json'],object_pairs_hook=OrderedDict)

	# Option 1. Delete all cans and create new to account for name edits
	# Option 2. Restrict changing can names as they are used as primary keys in DB

	models.Cans.objects.filter(owner=user).delete()

	for canData in decoded:
		name = canData['can-name']
		view_permission = canData.get('view-permission', "public")
		content = json.dumps(canData)
		new_can = models.Cans.objects.create(name=name, 
											 owner=user, 
											 content=content, 
											 view_permission=view_permission)
		new_can.save()	
	return HttpResponse(json.dumps(response_data), content_type="application-json")


#################
#### Browse #####
#################

def browse(request):
	user = request.user
	data = {}
	cans = models.Cans.objects.filter(view_permission="public")

	data['user'] = user
	data['cans'] = cans
	return render_to_response("browse.html", data, context_instance=RequestContext(request))

def browseLook(request):
	user = request.user
	data = {}
	cans = models.Cans.objects.filter(view_permission="public")

	data['user'] = user
	data['cans'] = cans
	data['cansData'] = getCansData(cans)
	return render_to_response("browseLook.html", data, context_instance=RequestContext(request))


#################
#### Mobile #####
#################

def mobileListCans(request):
	data = {}
	cans = models.Cans.objects.filter(view_permission="public")
	data['cans'] = map(lambda x: convert(x.name), cans)
	return render_to_response("mobileListCans.html", data, context_instance=RequestContext(request))

def mobileGetCan(request, canName):
	data = {}
	# Change "+" to space
	canName = canName.replace("+", " ")
	can = models.Cans.objects.get(name=canName, view_permission="public")
	data['canContent'] = convert(can.content)
	return render_to_response("mobileGetCan.html", data, context_instance=RequestContext(request))


###################
##### HELPERS #####
###################

def getCansData(cans):
	if len(cans) == 0:
		return ""
	return",".join(map(lambda x : x.content, cans))

def convert(input):
    if isinstance(input, dict):
        return {convert(key): convert(value) for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [convert(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input

def authUser(email, password):
	return authenticate(username=email, password=password)

def validateEmail(email):
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False