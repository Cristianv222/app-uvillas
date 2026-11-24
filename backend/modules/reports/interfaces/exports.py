import csv
from datetime import date

from django.http import HttpResponse
from django.utils.timezone import localtime
from openpyxl import Workbook
from openpyxl.cell import WriteOnlyCell


def _rows(summary):
    yield ("Sección", "Parte", "Código", "Enfermedad", "Fecha", "Total", "Sanos", "Enfermos", "Proporción sana")
    yield ("Resumen", None, None, None, None, summary["total"], summary["healthy"],
           summary["diseased"], summary["health_ratio"])
    for part, counts in sorted(summary["by_part"].items()):
        total, healthy = counts["total"], counts["healthy"]
        yield ("Por parte", part, None, None, None, total, healthy, total - healthy, None)
    for item in summary["by_disease"]:
        yield ("Por enfermedad", item["part"], item["code"], item["name"], None, None, None, item["count"], None)
    for item in summary["timeline"]:
        total, diseased = item["total"], item["diseased"]
        yield ("Por día", None, None, None, date.fromisoformat(item["date"]), total, total - diseased, diseased, None)


def _csv_value(value):
    if isinstance(value, str) and (value.startswith(("\t", "\r", "\n")) or value.lstrip().startswith(("=", "+", "-", "@"))):
        return "'" + value
    return value


def export_summary(summary, file_type):
    if file_type == "csv":
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response.write("\ufeff")
        writer = csv.writer(response)
        for row in _rows(summary):
            writer.writerow([_csv_value(value) for value in row])
    else:
        response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        workbook = Workbook(write_only=True)
        sheet = workbook.create_sheet("Reporte")
        sheet.freeze_panes = "A2"
        for row in _rows(summary):
            cells = []
            for value in row:
                cell = WriteOnlyCell(sheet, value=value)
                if isinstance(value, str):
                    cell.data_type = "s"
                cells.append(cell)
            sheet.append(cells)
        workbook.save(response)
    response["Content-Disposition"] = f'attachment; filename="reporte-uvillas.{file_type}"'
    return response


def export_diagnostics(records):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="reporte_diagnosticos.csv"'
    response.write("\ufeff")
    writer = csv.writer(response)
    writer.writerow(("Fecha y hora", "Parte de la planta", "Enfermedad", "Código", "Confianza %",
                     "Estado", "Latitud", "Longitud", "Notas", "Finca", "Lote"))
    for scan in records:
        row = (
            localtime(scan["captured_at"]).isoformat(), scan["part"], scan["label_name"], scan["label_code"],
            round(scan["confidence"] * 100, 6), "Sano" if scan["is_healthy"] else "Enfermo",
            scan["latitude"], scan["longitude"], scan["notes"], scan["farm__name"], scan["plot__name"],
        )
        writer.writerow(_csv_value(value) for value in row)
    return response
