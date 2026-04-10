import requests as http_requests

from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Registration
from .serializers import RegistrationSerializer


class RetreatGuruRegistrationsProxy(APIView):
    """Proxy to Retreat Guru API — avoids browser CORS restrictions."""

    def get(self, request):
        response = http_requests.get(
            settings.RETREAT_GURU_URL,
            params={"token": settings.RETREAT_GURU_TOKEN},
            timeout=10,
        )
        response.raise_for_status()
        return Response(response.json())


class RegistrationInfo(APIView):
    """Get, save, or delete supplemental info for a single registration."""

    def get(self, request, registration_id):
        reg = self._get(registration_id)
        if reg is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(RegistrationSerializer(reg).data)

    def put(self, request, registration_id):
        # atomic() ensures _sync_activities (delete + bulk_create) can't be
        # interleaved by a concurrent PUT to the same registration_id.
        # Note: under high concurrent write load, SQLite will still raise
        # "database is locked" — that is a SQLite limitation, not a bug here.
        # Production deployments should use Postgres.
        with transaction.atomic():
            reg, _ = Registration.objects.get_or_create(registration_id=registration_id)
            serializer = RegistrationSerializer(reg, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(serializer.data)

    def delete(self, request, registration_id):
        reg = self._get(registration_id)
        if reg is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        reg.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _get(self, registration_id):
        try:
            return Registration.objects.get(registration_id=registration_id)
        except Registration.DoesNotExist:
            return None
