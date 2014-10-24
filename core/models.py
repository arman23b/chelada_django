# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#     * Rearrange models' order
#     * Make sure each model has one field with primary_key=True
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.
from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User

class Cans(models.Model):
    name = models.CharField(max_length=50L, primary_key=True)
    owner = models.ForeignKey(User)
    content = models.TextField()
    view_permission = models.CharField(max_length=10L) # public or private
    # token = models.CharField(max_length=40L)
    # edit_permission = models.CharField(max_length=10L)
    class Meta:
        db_table = 'cans'

class EditPermissions(models.Model):
    email = models.CharField(max_length=50L, primary_key=True)
    can_id = models.IntegerField()
    class Meta:
        db_table = 'edit_permissions'

class Issues(models.Model):
    type = models.CharField(max_length=20L, blank=True)
    tag = models.CharField(max_length=40L, blank=True)
    content = models.TextField(primary_key=True)
    reply_to_id = models.IntegerField(null=True, blank=True)
    date_time = models.DateTimeField()
    class Meta:
        db_table = 'issues'

# Using django built-in User

# class Users(models.Model):
#     id = models.IntegerField(primary_key=True)
#     email = models.CharField(max_length=40L, primary_key=True)
#     password = models.CharField(max_length=40L)
#     nickname = models.CharField(max_length=40L)
#     status = models.IntegerField(null=True)
#     class Meta:
#         db_table = 'users'