from django.test import SimpleTestCase

from shared.domain.labels import parse_labels


class LabelsTests(SimpleTestCase):
    def test_all_prefix_styles(self):
        labels = parse_labels("0 F.Pudricion Dura\n5 F.Fruto Sano\n3 H_Marchitez_Bacterial\n6 H_Hoja_Sana\n0 T.Sano\n")
        by_code = {lb.code: lb for lb in labels}
        self.assertEqual(by_code["pudricion_dura"].name, "Pudricion Dura")
        self.assertEqual(by_code["marchitez_bacterial"].name, "Marchitez Bacterial")
        self.assertTrue(by_code["fruto_sano"].is_healthy)
        self.assertTrue(by_code["hoja_sana"].is_healthy)
        self.assertTrue(by_code["sano"].is_healthy)
        self.assertFalse(by_code["pudricion_dura"].is_healthy)
