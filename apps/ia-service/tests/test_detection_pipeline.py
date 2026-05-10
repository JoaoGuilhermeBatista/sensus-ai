"""
Unit tests for the IA service detection pipeline.

Tests the distance classification, bbox normalization, and detection logic
using mocked YOLO results — no GPU or model weights required.
"""
from __future__ import annotations

import base64
import importlib
import sys
import types
from unittest.mock import MagicMock, patch

import pytest


# ─── Bootstrap: mock heavy dependencies before importing app ─────────────────

def _make_yolo_mock():
    yolo_cls = MagicMock()
    instance = MagicMock()
    yolo_cls.return_value = instance
    return yolo_cls, instance


def _fake_result(boxes_data: list[dict], img_shape=(480, 640)):
    """Build a fake YOLO result mimicking ultralytics output."""
    import numpy as np

    result = MagicMock()
    fake_boxes = []
    for d in boxes_data:
        box = MagicMock()
        x1, y1, x2, y2 = d["xyxy"]
        box.xyxy = [MagicMock(tolist=lambda: [x1, y1, x2, y2])]
        box.conf = [d.get("conf", 0.9)]
        box.cls = [d["cls"]]
        box.id = [d["track_id"]] if d.get("track_id") is not None else None
        fake_boxes.append(box)

    result.boxes = fake_boxes
    return result


def _make_fake_cv2():
    cv2 = types.ModuleType("cv2")
    cv2.IMREAD_COLOR = 1
    cv2.INTER_AREA = 3
    cv2.imdecode = MagicMock(return_value=None)
    cv2.resize = MagicMock(side_effect=lambda img, size, **kw: img)
    return cv2


def _make_fake_numpy():
    np = types.ModuleType("numpy")
    np.frombuffer = MagicMock(return_value=b"")
    np.uint8 = "uint8"
    np.isscalar = lambda x: isinstance(x, (int, float, bool, complex))
    np.ndarray = type("ndarray", (), {})
    np.bool_ = bool
    return np


@pytest.fixture(autouse=True)
def mock_ultralytics(monkeypatch):
    """Inject fake ultralytics, cv2 and numpy so app.py can be imported."""
    yolo_cls, yolo_instance = _make_yolo_mock()

    fake_ultra = types.ModuleType("ultralytics")
    fake_ultra.YOLO = yolo_cls

    fake_cv2 = _make_fake_cv2()
    fake_np = _make_fake_numpy()

    monkeypatch.setitem(sys.modules, "ultralytics", fake_ultra)
    monkeypatch.setitem(sys.modules, "cv2", fake_cv2)
    monkeypatch.setitem(sys.modules, "numpy", fake_np)

    # Also mock httpx and fastapi sub-modules used at import time
    fake_httpx = types.ModuleType("httpx")
    fake_httpx.AsyncClient = MagicMock()
    monkeypatch.setitem(sys.modules, "httpx", fake_httpx)

    fake_fastapi = types.ModuleType("fastapi")
    fake_fastapi.FastAPI = MagicMock(return_value=MagicMock(
        on_event=lambda *a, **kw: (lambda f: f),
        get=lambda *a, **kw: (lambda f: f),
        post=lambda *a, **kw: (lambda f: f),
        mount=MagicMock(),
    ))
    fake_fastapi.Header = MagicMock(return_value=None)
    fake_fastapi.HTTPException = Exception
    fake_fastapi.UploadFile = MagicMock()
    monkeypatch.setitem(sys.modules, "fastapi", fake_fastapi)

    fake_responses = types.ModuleType("fastapi.responses")
    fake_responses.FileResponse = MagicMock()
    fake_responses.JSONResponse = MagicMock()
    monkeypatch.setitem(sys.modules, "fastapi.responses", fake_responses)

    fake_static = types.ModuleType("fastapi.staticfiles")
    fake_static.StaticFiles = MagicMock()
    monkeypatch.setitem(sys.modules, "fastapi.staticfiles", fake_static)

    monkeypatch.setenv("MODEL_PATH", "fake.pt")
    monkeypatch.setenv("DEVICE", "cpu")

    yield yolo_instance


@pytest.fixture
def app_module(mock_ultralytics, tmp_path):
    """Import (or reimport) app with the mocked ultralytics in place."""
    # Force re-import so monkeypatched sys.modules take effect
    if "app" in sys.modules:
        del sys.modules["app"]

    import importlib.util, pathlib
    spec = importlib.util.spec_from_file_location(
        "app",
        pathlib.Path(__file__).parent.parent / "app.py",
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules["app"] = module
    spec.loader.exec_module(module)
    return module


# ─── Distance Classification Tests ───────────────────────────────────────────

class TestDistanceClassification:
    """_classify_distance is a pure function — no mocking needed."""

    @pytest.fixture(autouse=True)
    def load_app(self, app_module):
        self.app = app_module

    def test_close_object(self):
        assert self.app._classify_distance(0.40) == "perto"

    def test_medium_object(self):
        assert self.app._classify_distance(0.20) == "medio"

    def test_far_object(self):
        assert self.app._classify_distance(0.05) == "longe"

    def test_threshold_boundary_close(self):
        assert self.app._classify_distance(0.35) == "perto"

    def test_threshold_boundary_medium(self):
        assert self.app._classify_distance(0.12) == "medio"

    def test_just_below_medium(self):
        assert self.app._classify_distance(0.11) == "longe"


# ─── Bbox Plausibility Tests ──────────────────────────────────────────────────

class TestBboxPlausibility:
    @pytest.fixture(autouse=True)
    def load_app(self, app_module):
        self.app = app_module

    def test_valid_person_box(self):
        # Person occupying ~20% of a 640x480 frame
        assert self.app._box_is_plausible(200, 100, 440, 400, 640, 480) is True

    def test_too_small_box(self):
        # 2x2 box in 640x480 — area ratio way below minimum
        assert self.app._box_is_plausible(319, 239, 321, 241, 640, 480) is False

    def test_full_frame_box(self):
        # Entire frame — exceeds max area ratio
        assert self.app._box_is_plausible(0, 0, 640, 480, 640, 480) is False

    def test_extreme_aspect_ratio(self):
        # Very thin horizontal sliver (aspect ratio >> 8)
        assert self.app._box_is_plausible(0, 239, 640, 241, 640, 480) is False


# ─── Detection Normalization Tests ────────────────────────────────────────────

class TestToDetectedObject:
    """_to_detected_object converts raw dict → SDD DetectedObject contract."""

    @pytest.fixture(autouse=True)
    def load_app(self, app_module):
        self.app = app_module

    def _make_raw(self, nome, x1, y1, x2, y2, img_w=640, img_h=480, conf=0.85):
        height_ratio = (y2 - y1) / img_h
        return {
            "nome": nome,
            "lado": "centro",
            "bbox": [x1, y1, x2, y2],
            "confidence": conf,
            "height_ratio": height_ratio,
            "distance_cm": None,
            "track_id": None,
            "img_w": img_w,
            "img_h": img_h,
        }

    def test_person_normalized_coords(self):
        raw = self._make_raw("person", 0, 0, 320, 480)
        obj = self.app._to_detected_object(raw)
        assert obj.name == "person"
        assert obj.x == pytest.approx(0.0)
        assert obj.y == pytest.approx(0.0)
        assert obj.width == pytest.approx(0.5)
        assert obj.height == pytest.approx(1.0)
        assert obj.isClose is True  # height_ratio = 1.0

    def test_chair_at_medium_distance(self):
        # height = 100, img_h = 480 → height_ratio = 0.208 → "medio"
        raw = self._make_raw("chair", 100, 100, 300, 200)
        obj = self.app._to_detected_object(raw)
        assert obj.name == "chair"
        assert obj.distance == "medio"
        assert obj.isClose is False

    def test_table_far_away(self):
        # height_ratio ≈ 0.05 → longe
        raw = self._make_raw("dining table", 200, 400, 440, 424)
        obj = self.app._to_detected_object(raw)
        assert obj.name == "dining table"
        assert obj.distance == "longe"
        assert obj.isClose is False

    def test_cell_phone_detectable(self):
        raw = self._make_raw("cell phone", 300, 200, 340, 260, conf=0.75)
        obj = self.app._to_detected_object(raw)
        assert obj.name == "cell phone"
        assert 0.0 <= obj.confidence <= 1.0

    def test_coords_clamped_to_zero_one(self):
        # Bbox slightly outside image bounds — must be clamped
        raw = self._make_raw("person", -10, -5, 650, 490, conf=0.9)
        obj = self.app._to_detected_object(raw)
        assert 0.0 <= obj.x <= 1.0
        assert 0.0 <= obj.y <= 1.0
        assert 0.0 <= obj.width <= 1.0
        assert 0.0 <= obj.height <= 1.0


# ─── Target Object Recognition Config Tests ──────────────────────────────────

class TestTargetObjectClasses:
    """
    Verify that chairs, persons, tables, and cell phones pass the
    class-level minimum confidence filter and are treated as obstacles.
    """

    @pytest.fixture(autouse=True)
    def load_app(self, app_module):
        self.app = app_module

    def test_person_is_obstacle_class(self):
        assert "person" in self.app._OBSTACLE_CLASSES

    def test_chair_is_obstacle_class(self):
        assert "chair" in self.app._OBSTACLE_CLASSES

    def test_table_is_obstacle_class(self):
        # SDD uses "dining table" for COCO table class
        assert "dining table" in self.app._OBSTACLE_CLASSES

    def test_cell_phone_is_obstacle_class_and_detectable(self):
        # cell phone is an obstacle class so it contributes to orientation scoring
        assert "cell phone" in self.app._OBSTACLE_CLASSES

    def test_cell_phone_min_conf(self):
        assert self.app._CLASS_MIN_CONF["cell phone"] == 0.28

    def test_person_min_conf(self):
        assert self.app._CLASS_MIN_CONF["person"] == 0.28

    def test_chair_min_conf(self):
        # chair uses lower threshold than person to improve non-person detection
        assert self.app._CLASS_MIN_CONF["chair"] == 0.22

    def test_person_priority_highest(self):
        person_priority = self.app._CLASS_PRIORITY["person"]
        chair_priority = self.app._CLASS_PRIORITY.get("chair", 0)
        assert person_priority > chair_priority


# ─── Orientation Message Tests ────────────────────────────────────────────────

class TestBuildOrientation:
    """_build_orientation produces a human-readable accessibility string."""

    @pytest.fixture(autouse=True)
    def load_app(self, app_module):
        self.app = app_module

    def _raw(self, nome, lado, height_ratio, conf=0.85):
        return {
            "nome": nome,
            "lado": lado,
            "height_ratio": height_ratio,
            "confidence": conf,
            "bbox": [0, 0, 100, 100],
            "img_w": 640,
            "img_h": 480,
        }

    def test_free_path_when_no_obstacles(self):
        msg = self.app._build_orientation([])
        assert "livre" in msg.lower()

    def test_person_in_front(self):
        raw = [self._raw("person", "centro", 0.5)]
        msg = self.app._build_orientation(raw)
        assert "pessoa" in msg.lower() or "person" in msg.lower()

    def test_chair_on_left(self):
        raw = [self._raw("chair", "esquerda", 0.4)]
        msg = self.app._build_orientation(raw)
        assert "esquerda" in msg.lower()

    def test_table_on_right(self):
        raw = [self._raw("dining table", "direita", 0.4)]
        msg = self.app._build_orientation(raw)
        assert "direita" in msg.lower()

    def test_obstacle_at_center_triggers_warning(self):
        raw = [self._raw("chair", "centro", 0.5)]
        msg = self.app._build_orientation(raw)
        assert "obst" in msg.lower() or "cuidado" in msg.lower() or "livre" not in msg.lower()
