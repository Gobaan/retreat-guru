from rest_framework import serializers
from .models import Activity, Registration, RegistrationActivity


class RegistrationSerializer(serializers.ModelSerializer):
    activities = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = ["registration_id", "flight_info", "meal_preference", "activities"]

    def get_activities(self, instance):
        return list(instance.activities.values_list("activity", flat=True))

    def to_internal_value(self, data):
        # activities is a SerializerMethodField (read-only by default), so DRF
        # ignores it during write. We handle it manually here: strip it from
        # the payload before calling super(), validate it separately, then
        # re-attach it so create() / update() can access it in validated_data.
        activities = data.get("activities")
        internal = super().to_internal_value({k: v for k, v in data.items() if k != "activities"})
        if activities is not None:
            internal["activities"] = self._validate_activities(list(activities))
        return internal

    def create(self, validated_data):
        activities = validated_data.pop("activities", [])
        registration = Registration.objects.create(**validated_data)
        self._sync_activities(registration, activities)
        return registration

    def update(self, instance, validated_data):
        activities = validated_data.pop("activities", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if activities is not None:
            self._sync_activities(instance, activities)
        return instance

    def _validate_activities(self, values):
        valid = set(Activity.values)
        invalid = [a for a in values if a not in valid]
        if invalid:
            raise serializers.ValidationError(f"Invalid activities: {invalid}. Choose from {valid}.")
        return values

    def _sync_activities(self, registration, activities):
        registration.activities.all().delete()
        RegistrationActivity.objects.bulk_create(
            [RegistrationActivity(registration=registration, activity=a) for a in activities]
        )
