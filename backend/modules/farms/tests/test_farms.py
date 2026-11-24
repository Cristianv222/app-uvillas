from uuid import uuid4

from rest_framework.test import APIClient

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase

from modules.farms.application.use_cases import CreateFarm, CreatePlot, DeleteFarm
from modules.farms.domain.entities import clean_name, validate_area
from modules.farms.infrastructure.models import Plot
from shared.domain.errors import NotFoundError, ValidationError


class FarmValidationTests(SimpleTestCase):
    def test_clean_name_trims_and_accepts_limit(self):
        self.assertEqual(clean_name(" Norte "), "Norte")
        self.assertEqual(clean_name("a" * 120), "a" * 120)

    def test_clean_name_rejects_blank_and_over_limit(self):
        for value, code in [(None, "name_required"), ("  ", "name_required"), ("a" * 121, "name_too_long")]:
            with self.subTest(value=value), self.assertRaises(ValidationError) as caught:
                clean_name(value)
            self.assertEqual(caught.exception.code, code)

    def test_area_accepts_optional_zero_and_positive_values(self):
        for area in (None, 0, 1.25):
            with self.subTest(area=area):
                self.assertEqual(validate_area(area), area)

    def test_area_rejects_negative_values(self):
        with self.assertRaises(ValidationError) as caught:
            validate_area(-0.1)
        self.assertEqual(caught.exception.code, "invalid_area")


class FarmUseCaseTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = get_user_model().objects.create_user(username="uno", email="uno@example.org")
        cls.other = get_user_model().objects.create_user(username="dos", email="dos@example.org")
        cls.farm = CreateFarm().execute(cls.owner, " Norte ")

    def test_create_preserves_client_id_and_normalizes_names(self):
        client_id = uuid4()
        plot = CreatePlot().execute(self.owner, self.farm.id, " Lote A ", 1.5, id=client_id)
        plot.refresh_from_db()
        self.assertEqual((self.farm.name, self.farm.owner), ("Norte", self.owner))
        self.assertEqual((plot.id, plot.name, plot.farm, plot.area_hectares), (client_id, "Lote A", self.farm, 1.5))

    def test_plot_requires_active_owned_farm(self):
        for owner, farm_id in [(self.other, self.farm.id), (self.owner, uuid4())]:
            with self.subTest(farm_id=farm_id), self.assertRaises(NotFoundError):
                CreatePlot().execute(owner, farm_id, "A")
        DeleteFarm().execute(self.farm)
        with self.assertRaises(NotFoundError):
            CreatePlot().execute(self.owner, self.farm.id, "A")
        self.assertFalse(Plot.objects.exists())

    def test_delete_marks_only_this_farm_and_its_plots_for_sync(self):
        plots = [CreatePlot().execute(self.owner, self.farm.id, name) for name in ("A", "B")]
        other_farm = CreateFarm().execute(self.other, "Sur")
        other_plot = CreatePlot().execute(self.other, other_farm.id, "C")
        DeleteFarm().execute(self.farm)
        self.farm.refresh_from_db()
        self.assertTrue(self.farm.is_deleted)
        for plot in plots:
            plot.refresh_from_db()
            self.assertTrue(plot.is_deleted)
            self.assertEqual(plot.updated_at, self.farm.updated_at)
        other_plot.refresh_from_db()
        other_farm.refresh_from_db()
        self.assertFalse(other_plot.is_deleted)
        self.assertFalse(other_farm.is_deleted)


    def test_farmer_endpoints_scope_farms_and_plots(self):
        api = APIClient()
        api.force_authenticate(self.owner)
        foreign = CreateFarm().execute(self.other, "Ajena")
        second = CreateFarm().execute(self.owner, "Sur")
        CreatePlot().execute(self.owner, second.id, "B")
        self.assertCountEqual([f["name"] for f in api.get("/api/farms/").data["results"]], ["Norte", "Sur"])
        url = "/api/farms/plots/"
        self.assertEqual(api.post(url, {"farm": str(foreign.id), "name": "A"}).status_code, 404)
        self.assertEqual(api.post(url, {"farm": str(self.farm.id), "name": "A"}).status_code, 201)
        result = api.get(url, {"farm": self.farm.id})
        self.assertEqual([p["name"] for p in result.data["results"]], ["A"])
