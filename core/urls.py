from django.conf.urls import patterns, url
from core import views
 
 
urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^user/login$', views.loginUser, name='login'),
    url(r'^user/logout$', views.logoutUser, name='logout'),
    url(r'^user/register$', views.registerUser, name='register'),
    url(r'^editor$', views.editor, name='editor'),
    url(r'^editor/upload$', views.editorUpload, name='editorUpload'),
    url(r'^sendFeeds$', views.sendFeeds, name='sendFeeds'),
    url(r'^browse$', views.browse, name='browse'),
    url(r'^browse/(?P<id>[\d]+)$', views.browseLook, name='browseLook'),
    url(r'^mobile/listfeeds$', views.mobileListFeeds, name='mobileListFeeds'),
    url(r'^mobile/getfeed/feedname/(?P<feedName>[\w|\W]+)$', views.mobileGetFeed, name='mobileGetFeed'),
    url(r'^mobile/unsubscribe$', views.unsubscribe, name='mobileUnsubscribe'),
    url(r'^gcm/register$', views.gcmRegister, name='gcmRegister'),
    url(r'^addFeed$', views.producerSend, name='producerSend'),
    url(r'^loginConsumer$', views.loginConsumer, name='loginConsumer'),
    url(r'^registerConsumer$', views.registerConsumer, name='registerConsumer'),
    
    url(r'^ticketForm$', views.ticketForm, name='ticketForm'),
    url(r'^ticketFormSubmit$', views.ticketFormSubmit, name='ticketFormSubmit'),
)