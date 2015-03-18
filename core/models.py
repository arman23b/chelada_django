from django.db import models
from django.contrib.auth.models import User


class Feed(models.Model):
    name = models.CharField(max_length=50L)
    owner = models.ForeignKey(User, related_name="Owner")
    content = models.TextField()
    view_permission = models.CharField(max_length=10L) # public or private
    consumers = models.ManyToManyField(User, related_name="Consumers", null=True)

    def __unicode__(self):
        return self.name

    class Meta:
        db_table = 'feed'


class PhoneDevice(models.Model):
    name = models.CharField(max_length=100)
    reg_id = models.TextField()
    dev_id = models.CharField(max_length=255)
    account = models.ForeignKey(User, null=True)

    def __unicode__(self):
        return "%s phone device" % (self.account.username)

    class Meta:
        db_table = "phone_device"