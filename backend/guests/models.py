from django.db import models


class MealPreference(models.TextChoices):
    OMNIVORE = "omnivore"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"


class Activity(models.TextChoices):
    YOGA = "yoga_class", "Yoga Class"
    JUICE_DETOX = "juice_detox", "Juice Detox"
    MASSAGE = "massage", "Massage"
    BREATH_WORK = "breath_work", "Breath Work"


class Registration(models.Model):
    """Supplemental info for a single Retreat Guru registration/participant."""
    registration_id = models.CharField(max_length=100, unique=True)
    flight_info = models.TextField(blank=True)
    meal_preference = models.CharField(
        max_length=20,
        choices=MealPreference.choices,
        default=MealPreference.OMNIVORE,
    )

    def __str__(self):
        return self.registration_id


class RegistrationActivity(models.Model):
    registration = models.ForeignKey(
        Registration, related_name="activities", on_delete=models.CASCADE
    )
    activity = models.CharField(max_length=20, choices=Activity.choices)

    class Meta:
        unique_together = ("registration", "activity")

    def __str__(self):
        return f"{self.registration.registration_id} — {self.activity}"
