from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User

class ConsumerAccount(models.Model):
    name = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    phone = models.CharField(max_length=100)

class Cans(models.Model):
    name = models.CharField(max_length=50L)
    owner = models.ForeignKey(User)
    content = models.TextField()
    view_permission = models.CharField(max_length=10L) # public or private
    class Meta:
        db_table = 'cans'

class PhoneDevice(models.Model):
    name = models.CharField(max_length=100)
    reg_id = models.TextField()
    dev_id = models.CharField(max_length=255)
    account = models.ForeignKey(ConsumerAccount)
    class Meta:
        db_table = "phone_device"
