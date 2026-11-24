from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from rest_framework.test import APITestCase
from modules.recognition.domain.entities import Classification, Prediction


class LaboratoryAccessTests(APITestCase):
    def setUp(self):
        cache.clear()

    @patch('modules.recognition.interfaces.api.views.get_classifier')
    @patch('modules.recognition.interfaces.api.views.ClassifyImage.execute')
    def test_anonymous_classification(self, execute, classifier):
        execute.return_value = Classification('hojas', [Prediction('sana', 'Sana', .9, True)])
        response = self.client.post('/api/recognition/laboratory/', {
            'part': 'hojas', 'image': SimpleUploadedFile('leaf.jpg', b'image', content_type='image/jpeg'),
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['best']['name'], 'Sana')

    def test_private_endpoints_remain_private(self):
        self.assertEqual(self.client.get('/api/scans/').status_code, 401)
        self.assertEqual(self.client.post('/api/recognition/classify/').status_code, 401)

    def test_missing_image(self):
        self.assertEqual(self.client.post('/api/recognition/laboratory/', {'part': 'hojas'}).status_code, 400)
