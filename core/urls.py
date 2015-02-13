from django.conf.urls import patterns, url
 
from core import views
 
urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^user/login$', views.loginUser, name='login'),
    url(r'^user/logout$', views.logoutUser, name='logout'),
    url(r'^user/register$', views.registerUser, name='register'),
    url(r'^editor$', views.editor, name='editor'),
    url(r'^editor/upload$', views.editorUpload, name='editorUpload'),
    url(r'^browse$', views.browse, name='browse'),
    url(r'^browse/(?P<id>[\d]+)$', views.browseLook, name='browseLook'),
    url(r'^mobile/listcans$', views.mobileListCans, name='mobileListCans'),
    url(r'^mobile/getcan/canname/(?P<canName>[\w|\W]+)$', views.mobileGetCan, name='mobileGetCan'),
    url(r'^gcm/register$', views.gcmRegister, name='gcmRegister'),
    url(r'^addFeed$', views.producerSend, name='producerSend'),
    url(r'^loginConsumer$', views.loginConsumer, name='loginConsumer'),
    url(r'^registerConsumer$', views.registerConsumer, name='registerConsumer'),
)