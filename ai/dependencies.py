import json
import functools
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"


@functools.lru_cache(maxsize=1)
def load_roads_data() -> dict:
    return json.loads((DATA_DIR / "roads.json").read_text(encoding="utf-8"))


@functools.lru_cache(maxsize=1)
def load_cameras_data() -> dict:
    return json.loads((DATA_DIR / "cameras.json").read_text(encoding="utf-8"))
