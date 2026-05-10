#!/usr/bin/env bash
set -euo pipefail

MODEL=${1:-yolov8s.pt}
OUT_DIR="$(dirname "$0")/../models"
OUT_PATH="$OUT_DIR/$MODEL"

mkdir -p "$OUT_DIR"

URLS=(
  "https://github.com/ultralytics/assets/releases/download/v0.0/$MODEL"
  "https://github.com/ultralytics/ultralytics/releases/latest/download/$MODEL"
  "https://github.com/ultralytics/assets/releases/download/v8.0.0/$MODEL"
  "https://huggingface.co/ultralytics/$MODEL/resolve/main/$MODEL"
)

echo "Downloading $MODEL to $OUT_PATH"

for url in "${URLS[@]}"; do
  echo "Trying: $url"
  if curl -fSL "$url" -o "$OUT_PATH"; then
    echo "Downloaded $MODEL from $url"
    ls -lh "$OUT_PATH"
    exit 0
  else
    echo "Failed: $url"
  fi
done

# Fallback: try letting Ultralytics download via Python (requires ultralytics installed)
cat <<'PY'
print('Fallback: attempting to trigger Ultralytics to download the model into cache...')
PY

if command -v python3 >/dev/null 2>&1; then
  python3 - <<PY || true
try:
    from ultralytics import YOLO
    m = YOLO('$MODEL')
    print('Ultralytics loaded model (may have cached it).')
except Exception as e:
    print('Ultralytics fallback failed:', e)
PY
  echo "If the Python fallback succeeded, the model may be in the ultralytics cache."
  echo "You can start the service which will auto-download the model:"
  echo "  MODEL_PATH=$MODEL .venv/bin/python3 -m uvicorn app:app --host 0.0.0.0 --port 8000"
else
  echo "Python3 not found; cannot run Ultralytics fallback."
fi

echo "All download attempts failed. If you have the model locally, copy it to: $OUT_PATH"
exit 1
