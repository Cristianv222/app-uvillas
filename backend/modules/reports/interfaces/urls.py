from django.urls import path

from .views import DiagnosticExportView, ExportView, SummaryView

urlpatterns = [
    path("summary/", SummaryView.as_view()),
    path("export/", DiagnosticExportView.as_view()),
    path("export/<str:file_type>/", ExportView.as_view()),
]
