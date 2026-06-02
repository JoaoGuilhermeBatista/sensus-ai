# Sensus

Detecção de objetos em tempo real para dispositivos de Realidade Estendida (XR).

## 🧠 Descrição

O Sensus captura o vídeo da câmera de um dispositivo XR (como o Meta Quest), processa os frames com um modelo de visão computacional e devolve, em tempo real, a identificação dos objetos presentes no ambiente. O resultado é exibido para o usuário como *bounding boxes* sobrepostas à cena, indicando o que foi detectado e onde.

A proposta é transformar o que a câmera enxerga em informação acionável: identificar objetos, obstáculos e elementos relevantes do espaço enquanto o usuário se movimenta.

> Projeto acadêmico desenvolvido na disciplina de Soluções Web.

## 🎯 Objetivo

- Capturar o stream de vídeo do dispositivo XR via WebXR
- Enviar os frames para um pipeline de inferência baseado em IA
- Detectar e classificar objetos no ambiente em tempo real
- Renderizar as detecções (bounding boxes + labels) de volta na visão do usuário

## 🏗️ Arquitetura do Sistema

O Sensus é uma aplicação distribuída em três serviços independentes que se comunicam por rede:

```
[Frontend WebXR]  --frames-->  [Backend Spring Boot]  --frames-->  [Serviço de IA / YOLO]
   (Meta Quest)   <--boxes--    (orquestração/API)    <--boxes--    (inferência)
```

1. **Frontend (WebXR):** captura o vídeo da câmera e renderiza as detecções
2. **Backend (Spring Boot):** orquestra o fluxo, expõe a API REST e faz a ponte entre o frontend e o serviço de IA
3. **IA (Python/YOLO):** roda a inferência sobre os frames e retorna as bounding boxes

Cada serviço sobe isolado e pode ser executado via Docker.

## 🚀 Tecnologias Utilizadas

**Frontend**
- JavaScript
- WebXR
- getUserMedia (captura de mídia)

**Backend**
- Java
- Spring Boot
- API REST

**Inteligência Artificial**
- Python
- YOLO (detecção de objetos)
- OpenCV

**Infraestrutura**
- Docker

## ⚙️ Funcionamento

O sistema opera em loop contínuo:

1. O dispositivo XR captura frames do ambiente
2. Os frames são enviados ao backend via API REST
3. O backend repassa os frames ao serviço de IA
4. O modelo YOLO processa cada frame e retorna as detecções (coordenadas das boxes + classes)
5. O backend devolve o resultado ao frontend
6. O frontend desenha as bounding boxes sobre a cena

A baixa latência do pipeline é o que permite a análise dinâmica enquanto o usuário se move.

## 📁 Organização do Desenvolvimento

O projeto segue um fluxo modular, com separação por branches no Git:

- 🌐 `frontend`: interface e interação com o usuário
- ⚙️ `backend`: lógica da aplicação e API REST
- 🧠 `ia`: processamento e análise de imagens
- `main`: versão estável e integrada

Essa separação facilita o trabalho em equipe e reduz conflitos entre as camadas.

## ▶️ Execução

Pré-requisito: todos os serviços precisam estar na mesma rede.

```bash
# 1. Backend (Java / Spring Boot)
cd backend && ./mvnw spring-boot:run

# 2. Serviço de IA (Python)
cd ia && python app.py

# 3. Frontend
# Servir os arquivos e abrir no navegador do dispositivo XR
```

> Se estiver usando Docker, suba os containers com `docker compose up`.

## 📋 Requisitos

- Dispositivo com suporte a WebXR (ex: Meta Quest)
- Java (JDK) configurado
- Python configurado, com as dependências do modelo YOLO instaladas
- Rede compartilhada entre os três serviços

## 🎓 Contexto Acadêmico

Desenvolvido na disciplina de Soluções Web com o objetivo de aplicar, na prática, a integração entre frontend, backend e inteligência artificial em uma arquitetura distribuída. O desenvolvimento foi conduzido com metodologia ágil (Scrum).

## 👨‍💻 Autores

Projeto desenvolvido por um time de 7 integrantes para fins acadêmicos.
