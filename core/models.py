from django.db import models
from django.contrib.auth.models import User


class ConsumerAccount(models.Model):
    email = models.CharField(max_length=100, unique=True)
    passwordHash = models.CharField(max_length=100)

    def __unicode__(self):
        return self.email

    class Meta:
        db_table = 'consumer_account'


class Feed(models.Model):
    name = models.CharField(max_length=50L)
    owner = models.ForeignKey(User)
    content = models.TextField()
    view_permission = models.CharField(max_length=10L) # public or private
    consumers = models.ManyToManyField(ConsumerAccount, null=True)

    def __unicode__(self):
        return self.name

    class Meta:
        db_table = 'feed'


class PhoneDevice(models.Model):
    name = models.CharField(max_length=100)
    reg_id = models.TextField()
    dev_id = models.CharField(max_length=255)
    account = models.ForeignKey(ConsumerAccount, null=True)

    def __unicode__(self):
        return "%s phone device" % (self.account.email)

    class Meta:
        db_table = "phone_device"