from django.urls import path

from .views import ClassifyView, LaboratoryClassifyView

urlpatterns = [path("laboratory/", LaboratoryClassifyView.as_view()), path("classify/", ClassifyView.as_view())]
