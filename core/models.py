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

class Cans(models.Model):
    id = models.IntegerField(primary_key=True)
    owner_id = models.IntegerField()
    content = models.TextField()
    token = models.CharField(max_length=40L)
    can_name = models.CharField(max_length=50L)
    view_permission = models.CharField(max_length=10L)
    edit_permission = models.CharField(max_length=10L)
    class Meta:
        db_table = 'cans'

class EditPermissions(models.Model):
    id = models.IntegerField(primary_key=True)
    email = models.CharField(max_length=50L)
    can_id = models.IntegerField()
    class Meta:
        db_table = 'edit_permissions'

class Issues(models.Model):
    id = models.IntegerField(primary_key=True)
    type = models.CharField(max_length=20L, blank=True)
    tag = models.CharField(max_length=40L, blank=True)
    content = models.TextField()
    reply_to_id = models.IntegerField(null=True, blank=True)
    date_time = models.DateTimeField()
    class Meta:
        db_table = 'issues'

class Users(models.Model):
    id = models.IntegerField(primary_key=True)
    email = models.CharField(max_length=40L)
    password = models.CharField(max_length=40L)
    nickname = models.CharField(max_length=40L)
    status = models.IntegerField()
    class Meta:
        db_table = 'users'

