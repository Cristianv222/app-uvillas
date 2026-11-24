import json
from dataclasses import asdict, replace
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import create_autospec

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.test import SimpleTestCase, TestCase

from modules.catalog.application.use_cases import GetDisease, ListDiseases, SeedCatalog
from modules.catalog.domain.entities import DiseaseInfo
from modules.catalog.domain.repositories import DiseaseRepository
from modules.catalog.infrastructure.repositories import DjangoDiseaseRepository
from shared.domain.errors import NotFoundError, ValidationError


DISEASE = DiseaseInfo("hojas", "mancha", "Mancha", "Descripción", "medium", False, ["Manchas"], ["Revisar"])


class CatalogUseCaseTests(SimpleTestCase):
    def setUp(self):
        self.repo = create_autospec(DiseaseRepository, instance=True)

    def test_list_all_or_filter_by_normalized_part(self):
        self.repo.find_all.return_value = [DISEASE]
        for part, expected in [(None, None), (" Hojas ", "hojas")]:
            with self.subTest(part=part):
                self.assertEqual(ListDiseases(self.repo).execute(part), [DISEASE])
                self.repo.find_all.assert_called_with(expected)

    def test_invalid_part_is_rejected_before_query(self):
        with self.assertRaises(NotFoundError):
            ListDiseases(self.repo).execute("raíces")
        with self.assertRaises(NotFoundError):
            GetDisease(self.repo).execute("raíces", "mancha")
        self.repo.find_all.assert_not_called()
        self.repo.get.assert_not_called()

    def test_detail_and_missing_disease(self):
        self.repo.get.return_value = DISEASE
        self.assertEqual(GetDisease(self.repo).execute("HOJAS", "mancha"), DISEASE)
        self.repo.get.assert_called_once_with("hojas", "mancha")
        self.repo.get.return_value = None
        with self.assertRaises(NotFoundError):
            GetDisease(self.repo).execute("hojas", "ausente")

    def test_seed_validates_entire_input_before_writing(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "catalog.json"
            items = [asdict(DISEASE), asdict(replace(DISEASE, part="raíces"))]
            path.write_text(json.dumps(items), encoding="utf-8")
            with self.assertRaises(ValidationError):
                SeedCatalog(self.repo).execute(path)
        self.repo.upsert_many.assert_not_called()


class CatalogPersistenceTests(TestCase):
    def test_reseeding_updates_existing_entry_and_keeps_parts_distinct(self):
        repo = DjangoDiseaseRepository()
        fruit = replace(DISEASE, part="frutos")
        updated = replace(DISEASE, treatment=["Tratamiento actualizado"])
        with TemporaryDirectory() as directory:
            path = Path(directory) / "catalog.json"
            for leaf in (DISEASE, updated):
                path.write_text(json.dumps([asdict(leaf), asdict(fruit)]), encoding="utf-8")
                self.assertEqual(SeedCatalog(repo).execute(path), 2)
        self.assertCountEqual(repo.find_all(), [fruit, updated])
        self.assertEqual(repo.find_all("hojas"), [updated])
        self.assertEqual(repo.get("frutos", fruit.code), fruit)
        self.assertIsNone(repo.get("tallos", fruit.code))


class CatalogEndpointTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.api.force_authenticate(get_user_model().objects.create_user(username="uno", email="uno@example.org"))
        DjangoDiseaseRepository().upsert_many([DISEASE, replace(DISEASE, part="frutos")])
        self.url = "/api/catalog/diseases/"

    def test_list_filter_and_detail(self):
        self.assertCountEqual([row["part"] for row in self.api.get(self.url).data], ["hojas", "frutos"])
        self.assertEqual(self.api.get(self.url, {"part": "hojas"}).data, [asdict(DISEASE)])
        self.assertEqual(self.api.get(self.url + "hojas/mancha/").data, asdict(DISEASE))

    def test_unknown_parts_and_codes_return_404(self):
        for suffix in ("?part=raices", "raices/mancha/", "hojas/ausente/"):
            with self.subTest(suffix=suffix):
                self.assertEqual(self.api.get(self.url + suffix).status_code, 404)
