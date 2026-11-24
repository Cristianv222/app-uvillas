from django.urls import path

from .consumer import RecognitionConsumer

websocket_urlpatterns = [path("ws/recognition/", RecognitionConsumer.as_asgi())]
