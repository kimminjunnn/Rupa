import os
import unittest
from unittest.mock import patch

import numpy as np
import cv2

from app.image_loader import _decode_heif_payload, load_image_payload


class _FakeHeifImage:
    def __array__(self, dtype=None):
        image = np.array([[[10, 20, 30], [40, 50, 60]]], dtype=np.uint8)
        if dtype is not None:
            return image.astype(dtype)
        return image


class ImageLoaderTests(unittest.TestCase):
    def setUp(self):
        self._previous_max_long_edge = os.environ.get("RUPA_ANALYSIS_MAX_LONG_EDGE")

    def tearDown(self):
        if self._previous_max_long_edge is None:
            os.environ.pop("RUPA_ANALYSIS_MAX_LONG_EDGE", None)
        else:
            os.environ["RUPA_ANALYSIS_MAX_LONG_EDGE"] = self._previous_max_long_edge

    def test_decodes_uploaded_jpeg_payload_to_opencv_bgr_image(self):
        source = np.array([[[10, 20, 30], [40, 50, 60]]], dtype=np.uint8)
        success, encoded = cv2.imencode(".jpg", source)
        self.assertTrue(success)

        image = load_image_payload("wall.jpg", encoded.tobytes())

        self.assertEqual(image.shape, source.shape)
        self.assertEqual(image.dtype, np.uint8)
        self.assertLess(np.abs(image.astype(np.int16) - source.astype(np.int16)).max(), 5)

    def test_downscales_large_uploaded_images_before_analysis(self):
        os.environ["RUPA_ANALYSIS_MAX_LONG_EDGE"] = "1000"
        source = np.zeros((1200, 2400, 3), dtype=np.uint8)
        success, encoded = cv2.imencode(".png", source)
        self.assertTrue(success)

        image = load_image_payload("wall.png", encoded.tobytes())

        self.assertEqual(image.shape, (500, 1000, 3))
        self.assertEqual(image.dtype, np.uint8)

    def test_decodes_heif_payload_to_opencv_bgr_image(self):
        with patch("app.image_loader.pillow_heif.read_heif", return_value=_FakeHeifImage()):
            image = _decode_heif_payload(b"heif-bytes")

        expected = np.array([[[30, 20, 10], [60, 50, 40]]], dtype=np.uint8)
        np.testing.assert_array_equal(image, expected)


if __name__ == "__main__":
    unittest.main()
