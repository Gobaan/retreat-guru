from django.urls import path
from .views import RegistrationInfo, RetreatGuruRegistrationsProxy

urlpatterns = [
    path("retreat-guru/registrations/", RetreatGuruRegistrationsProxy.as_view()),
    path("registrations/<str:registration_id>/", RegistrationInfo.as_view()),
]
