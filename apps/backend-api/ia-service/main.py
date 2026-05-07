"""
Stub do serviço IA (Python/FastAPI).
Retorna resposta mockada para permitir desenvolvimento e testes do backend
antes da integração real com YOLO.
"""
from fastapi import FastAPI, File, UploadFile
import time

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "UP"}


@app.post("/analisar")
async def analisar(file: UploadFile = File(...)):
    return {
        "objetos": [
            {"nome": "person", "distancia": "perto", "isClose": True},
            {"nome": "chair", "distancia": "medio", "isClose": False},
        ],
        "timestamp": int(time.time())
    }
