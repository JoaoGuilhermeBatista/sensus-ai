#!/bin/bash
set -e

# 🚀 SCRIPT RÁPIDO DE RETREINAMENTO MELHORADO
# 
# Mudanças aplicadas:
#  • Modelo: yolov8n → yolov8s (small, 3x mais parâmetros = melhor accuracy)
#  • Confidence threshold: 0.25 → 0.18 (detecta mais objetos)
#  • Resolução de inferência: 640 → 1024 (mais detalhe)
#  • Epochs: 150 → 200 (convergência melhor)
#  • Imgsz treino: 640 → 768 (mais contexto)
#  • Per-class confidence: reduzido 30-40%
#
# Esperado: Recall +50-100%, Precision melhor com mais treino

cd "$(dirname "$0")/.."

echo "📦 [1/4] Verificando dependências..."
python3 -c "from ultralytics import YOLO; print('✅ YOLO OK')"

echo "🎯 [2/4] Iniciando treino com yolov8s por 200 epochs..."
echo "    Resolução: 768x768"
echo "    Batch: 16"
echo "    Target mAP: 0.60"
echo ""

python3 scripts/train.py \
  --model yolov8s.pt \
  --data config/data.yaml \
  --max-epochs 200 \
  --imgsz 768 \
  --batch 16 \
  --device auto

echo ""
echo "✅ Treino finalizado!"
echo ""
echo "📊 Resultados esperados:"
echo "  • Recall:      +50-100% (detecta mais objetos)"
echo "  • Precision:   +20-40% (menos falsos positivos com mais epochs)"
echo "  • mAP@50-95:   +200-300% (de 17.4% → 35-50%)"
echo ""
echo "🔄 Próximas ações:"
echo "  1. Validar melhorias com: python3 -m pytest tests/test_detection_pipeline.py"
echo "  2. Para MUITO mais dados: rodar expand_dataset.py"
echo "  3. Para fine-tuning: usar dataset customizado em data_custom.yaml"
echo ""
