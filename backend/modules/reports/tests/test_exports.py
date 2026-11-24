import csv
from datetime import datetime, timezone
from io import BytesIO, StringIO

from django.contrib.auth import get_user_model
from django.test import TestCase
from openpyxl import load_workbook
from rest_framework.test import APIClient

from modules.farms.application.use_cases import CreateFarm, CreatePlot
from modules.scans.application.use_cases import CreateScan, DeleteScan


class ExportTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="uno", email="uno@example.org")
        cls.other = get_user_model().objects.create_user(username="dos", email="dos@example.org")
        cls.farm = CreateFarm().execute(cls.user, "Norte")
        cls.plot = CreatePlot().execute(cls.user, cls.farm.id, "A")
        day = datetime(2026, 1, 2, 12, tzinfo=timezone.utc)
        fields = dict(part="hojas", confidence=0.9, label_code="mancha", label_name='=Mancha, "gris"')
        create = CreateScan().execute
        create(cls.user, plot=cls.plot, captured_at=day, latitude=0, longitude=-78.5, notes="Línea 1, línea 2", **fields)
        create(cls.user, plot=cls.plot, captured_at=day.replace(day=1), **fields)
        create(cls.user, plot=cls.plot, captured_at=day.replace(day=3), **fields)
        create(cls.user, farm=cls.farm, captured_at=day, **fields)
        create(cls.user, captured_at=day, **fields)
        create(cls.other, captured_at=day, part="frutos", confidence=1, label_name="Fruto sano", label_code="fruto_sano")
        DeleteScan().execute(create(cls.user, captured_at=day, **fields))

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_csv_contains_all_sections_and_respects_filters(self):
        response = self.client.get("/api/reports/export/csv/", {
            "farm": self.farm.id, "plot": self.plot.id, "date_from": "2026-01-02", "date_to": "2026-01-02",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Disposition"], 'attachment; filename="reporte-uvillas.csv"')
        rows = list(csv.DictReader(StringIO(response.content.decode("utf-8-sig"))))
        self.assertEqual([r["Sección"] for r in rows], ["Resumen", "Por parte", "Por enfermedad", "Por día"])
        self.assertEqual((rows[0]["Total"], rows[0]["Enfermos"]), ("1", "1"))
        self.assertEqual(rows[1]["Parte"], "hojas")
        self.assertEqual(rows[2]["Enfermedad"], "'" + '=Mancha, "gris"')
        self.assertEqual(rows[3]["Fecha"], "2026-01-02")

    def test_excel_preserves_numbers_dates_and_literal_text(self):
        response = self.client.get("/api/reports/export/xlsx/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("spreadsheetml", response["Content-Type"])
        self.assertIn("reporte-uvillas.xlsx", response["Content-Disposition"])
        book = load_workbook(BytesIO(response.content))
        sheet = book["Reporte"]
        self.assertEqual(sheet["F2"].value, 5)
        self.assertEqual(sheet["D4"].value, '=Mancha, "gris"')
        self.assertEqual(sheet["D4"].data_type, "s")
        self.assertEqual(sheet["E5"].value.date().isoformat(), "2026-01-01")
        book.close()

    def test_empty_report_has_headers_and_zero_totals(self):
        for fmt in ("csv", "xlsx"):
            with self.subTest(fmt=fmt):
                response = self.client.get(f"/api/reports/export/{fmt}/", {"date_to": "2025-12-31"})
                self.assertEqual(response.status_code, 200)
                if fmt == "csv":
                    rows = list(csv.reader(StringIO(response.content.decode("utf-8-sig"))))
                else:
                    book = load_workbook(BytesIO(response.content))
                    rows = list(book.active.values)
                    book.close()
                self.assertEqual(len(rows), 2)
                self.assertEqual(int(rows[1][5]), 0)

    def test_requires_authentication_and_valid_filters(self):
        for params in ({"date_from": "2026-02-30"}, {"plot": "inválido"}, {"farm": "x"}):
            with self.subTest(params=params):
                self.assertEqual(self.client.get("/api/reports/export/csv/", params).status_code, 400)
        self.assertEqual(self.client.get("/api/reports/export/pdf/").status_code, 400)
        for fmt in ("csv", "xlsx"):
            self.assertEqual(APIClient().get(f"/api/reports/export/{fmt}/").status_code, 401)

    def diagnostic_rows(self, **params):
        response = self.client.get("/api/reports/export/", params)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertEqual(response["Content-Disposition"], 'attachment; filename="reporte_diagnosticos.csv"')
        return list(csv.DictReader(StringIO(response.content.decode("utf-8-sig"))))

    def test_diagnostics_file_contents_and_filters(self):
        rows = self.diagnostic_rows(farm=self.farm.id, plot=self.plot.id, date_from="2026-01-02", date_to="2026-01-02")
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(datetime.fromisoformat(row["Fecha y hora"]), datetime(2026, 1, 2, 12, tzinfo=timezone.utc))
        self.assertEqual(row["Parte de la planta"], "hojas")
        self.assertEqual(row["Enfermedad"], "'" + '=Mancha, "gris"')
        self.assertEqual((row["Código"], float(row["Confianza %"]), row["Estado"]), ("mancha", 90, "Enfermo"))
        self.assertEqual((row["Latitud"], row["Longitud"]), ("0.0", "-78.5"))
        self.assertEqual((row["Notas"], row["Finca"], row["Lote"]), ("Línea 1, línea 2", "Norte", "A"))
        self.assertEqual(len(self.diagnostic_rows(farm=self.farm.id)), 4)
        self.assertEqual(self.diagnostic_rows(date_to="2020-01-01"), [])

    def test_diagnostics_scope_by_role(self):
        self.assertEqual(APIClient().get("/api/reports/export/").status_code, 401)
        farmer_rows = self.diagnostic_rows(user=self.other.id)
        self.assertEqual(len(farmer_rows), 5)
        self.assertTrue(all(r["Código"] == "mancha" for r in farmer_rows))
        admin = get_user_model().objects.create_user(username="admin", email="admin@example.org", role="admin")
        self.client.force_authenticate(admin)
        self.assertEqual(len(self.diagnostic_rows()), 6)
        rows = self.diagnostic_rows(user=self.other.id)
        self.assertEqual([(r["Estado"], r["Finca"], r["Latitud"]) for r in rows], [("Sano", "", "")])
        self.assertEqual(self.client.get("/api/reports/export/", {"user": "invalido"}).status_code, 400)
