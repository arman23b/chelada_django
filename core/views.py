# Create your views here.
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import models, authenticate, login, logout
from core import models
from django.shortcuts import get_object_or_404, render_to_response, redirect
from django.template import RequestContext

from django import forms
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

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
	data['cans'] = cans
	if len(cans) == 0:
		cansData = []
	else:
		s = ""
		for can in cans:
			# print convert(can.content)
			s += convert(can.content)
	data['cansData'] = s
	print type(s)
	return render_to_response("editor.html", data, context_instance=RequestContext(request))

def convert(input):
    if isinstance(input, dict):
        return {convert(key): convert(value) for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [convert(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input

def editorUpload(request):
	response_data = {}
	user = request.user
	decoded = json.loads(request.POST['json'])
	# print decoded

	for canData in decoded:
		name = canData['can-name']
		content = json.dumps(canData['tasks'])
		print content
		try:
			can = models.Cans.objects.get(name=name, owner=user)
			# Edit
			can.content = content
			can.save()
		except models.Cans.DoesNotExist:
			# Create
			new_can = models.Cans.objects.create(name=name, owner=user, content=content)
			new_can.save()
	return HttpResponse(json.dumps(response_data), content_type="application-json")


###################
##### HELPERS #####
###################

def authUser(email, password):
	return authenticate(username=email, password=password)

def validateEmail(email):
    try:
        validate_email(email)
        return True
    except ValidationError:
        return False