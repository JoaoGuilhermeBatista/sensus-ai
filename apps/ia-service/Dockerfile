FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Dependências do sistema necessárias para OpenCV, ffmpeg e utilitários
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python (requirements em config/requirements.txt)
COPY config/requirements.txt /tmp/requirements.txt
RUN pip install -U pip && pip install -r /tmp/requirements.txt --no-cache-dir

# Copiar apenas o necessário para executar a API e scripts de treino.
# Datasets, runs e models não são copiados (use bind-mount em `docker run`).
COPY app.py /app/
COPY models.py /app/

COPY config/ /app/config/
COPY scripts/ /app/scripts/
COPY static/ /app/static/

# Copy model weights into the image for local development.
# For production, mount models as an external volume instead.
RUN mkdir -p /app/models /app/runs /app/datasets
# Model weights are excluded from git (.gitignore). Copy what's available locally.
# If no custom weights are present, yolov8n.pt is auto-downloaded at first startup.
COPY models/ /app/models/


# Expor porta da API
EXPOSE 8000

# Entrada padrão (para API). Use o Makefile/`docker run` para rodar comandos de treino.
CMD ["sh", "-c", "exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]