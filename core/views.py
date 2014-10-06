# Create your views here.
from django.http import HttpResponse
from core import models
from django.shortcuts import get_object_or_404, render_to_response, redirect
from django.template import RequestContext

from django import forms

#################
##### FORMS #####
#################

#################
##### VIEWS #####
#################

def index(request):
    data = {'projectName': 'chelada-django',
            'successMessage': "Great success!"}
    return render_to_response("index.html", data, context_instance=RequestContext(request))

###################
##### HELPERS #####
###################