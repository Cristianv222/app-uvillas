from rest_framework.routers import SimpleRouter

from .views import FarmViewSet, PlotViewSet

router = SimpleRouter()
router.register("plots", PlotViewSet, basename="plot")
router.register("", FarmViewSet, basename="farm")
urlpatterns = router.urls
