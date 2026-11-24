from django.urls import path

from .views import DiseaseDetailView, DiseaseListView

urlpatterns = [
    path("diseases/", DiseaseListView.as_view()),
    path("diseases/<str:part>/<str:code>/", DiseaseDetailView.as_view()),
]
