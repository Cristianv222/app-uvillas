from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from modules.catalog.application.use_cases import SeedCatalog
from modules.catalog.infrastructure.repositories import DjangoDiseaseRepository


class Command(BaseCommand):
    help = "Carga el catálogo de enfermedades desde ml-models/catalog.json"

    def handle(self, *args, **options):
        path = settings.ML_MODELS_DIR / "catalog.json"
        if not path.exists():
            raise CommandError(f"No existe {path}")
        count = SeedCatalog(DjangoDiseaseRepository()).execute(path)
        self.stdout.write(self.style.SUCCESS(f"{count} enfermedades cargadas"))
