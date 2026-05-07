# API Documentation — Sensus Backend

Backend de visão assistiva com IA. Recebe frames de imagem, encaminha ao serviço YOLO/Python e retorna objetos detectados em tempo real.

**Base URL:** `http://localhost:8080`

---

## Envelope de Resposta

Todos os endpoints REST (exceto paginação) retornam um envelope padrão:

```json
{
  "sucesso": true,
  "mensagem": "OK",
  "dados": { ... },
  "timestamp": 1711370000
}
```

| Campo       | Tipo    | Descrição                                    |
|-------------|---------|----------------------------------------------|
| `sucesso`   | boolean | `true` em caso de sucesso, `false` em erro   |
| `mensagem`  | string  | Mensagem descritiva                          |
| `dados`     | object  | Payload da resposta (null em caso de erro)   |
| `timestamp` | long    | Unix timestamp em segundos                   |

---

## Endpoints REST

### POST /api/analisar

Envia uma imagem para análise e retorna os objetos detectados.

**Request**

```
Content-Type: application/json
```

```json
{
  "imagemBase64": "<imagem codificada em Base64>",
  "formato": "jpeg"
}
```

| Campo          | Tipo   | Obrigatório | Descrição                          |
|----------------|--------|-------------|------------------------------------|
| `imagemBase64` | string | Sim         | Imagem codificada em Base64        |
| `formato`      | string | Não         | Formato da imagem: `"jpeg"`, `"png"` |

**Response `200 OK`**

```json
{
  "sucesso": true,
  "mensagem": "OK",
  "dados": {
    "id": 42,
    "timestamp": 1711370000,
    "objetos": [
      { "nome": "person", "distancia": "perto", "isClose": true },
      { "nome": "chair",  "distancia": "medio", "isClose": false }
    ]
  },
  "timestamp": 1711370000
}
```

**Erros**

| Status | Condição                             | Mensagem                   |
|--------|--------------------------------------|----------------------------|
| 400    | Base64 inválido                      | `"Imagem base64 inválida"` |
| 400    | Campo obrigatório ausente            | Mensagem de validação      |
| 503    | Serviço de IA indisponível           | `"Serviço de IA indisponível"` |

---

### GET /api/analises

Lista o histórico de análises em ordem decrescente de timestamp.

**Query Parameters**

| Parâmetro | Tipo    | Padrão | Descrição                          |
|-----------|---------|--------|------------------------------------|
| `page`    | integer | 0      | Número da página (base 0)          |
| `size`    | integer | 20     | Itens por página                   |
| `sort`    | string  | timestamp | Campo de ordenação              |

**Response `200 OK`**

Retorna um objeto `Page` do Spring:

```json
{
  "content": [
    {
      "id": 42,
      "timestamp": 1711370000,
      "objetos": [
        { "nome": "person", "distancia": "perto", "isClose": true }
      ]
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "size": 20,
  "number": 0
}
```

---

### GET /api/analises/{id}

Busca uma análise específica pelo ID.

**Path Parameter**

| Parâmetro | Tipo | Descrição       |
|-----------|------|-----------------|
| `id`      | long | ID da análise   |

**Response `200 OK`**

```json
{
  "sucesso": true,
  "mensagem": "OK",
  "dados": {
    "id": 42,
    "timestamp": 1711370000,
    "objetos": [
      { "nome": "person", "distancia": "perto", "isClose": true }
    ]
  },
  "timestamp": 1711370000
}
```

**Erros**

| Status | Condição             | Mensagem                    |
|--------|----------------------|-----------------------------|
| 404    | ID não encontrado    | `"Análise não encontrada"`  |

---

### GET /api/status

Verifica a saúde do backend e do serviço de IA.

**Response `200 OK`**

```json
{
  "sucesso": true,
  "mensagem": "OK",
  "dados": {
    "backend":   "UP",
    "iaService": "UP",
    "timestamp": 1711370000
  },
  "timestamp": 1711370000
}
```

| Campo       | Valores possíveis |
|-------------|-------------------|
| `backend`   | `"UP"`            |
| `iaService` | `"UP"`, `"DOWN"`  |

---

### GET /actuator/health

Health check para Docker e orquestração.

**Response `200 OK`**

```json
{ "status": "UP" }
```

---

## WebSocket

### Endpoint

```
ws://localhost:8080/ws
```

SockJS disponível como fallback no mesmo endpoint.

### Envio de frame (cliente → servidor)

**Opção 1 — Texto (JSON com Base64)**

```json
{
  "tipo":      "imagem",
  "dados":     "<frame codificado em Base64>",
  "sessionId": "opcional"
}
```

**Opção 2 — Binário**

Envie os bytes da imagem diretamente como mensagem binária WebSocket.

### Resposta (servidor → cliente)

```json
{
  "id":        42,
  "timestamp": 1711370000,
  "objetos": [
    { "nome": "person", "distancia": "perto", "isClose": true },
    { "nome": "door",   "distancia": "medio", "isClose": false }
  ]
}
```

**Resposta de erro (IA indisponível)**

```json
{ "erro": "IA indisponível" }
```

### Rate Limiting

- Máximo de **5 frames/segundo** por sessão (configurável via `app.rate-limit.fps`).
- Frames excedentes são descartados silenciosamente — nenhuma resposta de erro é enviada ao cliente.

---

## Objetos Detectados

### Campos

| Campo       | Tipo    | Descrição                                              |
|-------------|---------|--------------------------------------------------------|
| `nome`      | string  | Classe do objeto (ex.: `"person"`, `"chair"`, `"car"`) |
| `distancia` | string  | `"perto"`, `"medio"` ou `"longe"`                      |
| `isClose`   | boolean | `true` quando `distancia == "perto"`                   |

### Ordenação na resposta

1. Objetos com `isClose = true` aparecem primeiro.
2. Dentro do mesmo grupo, ordem alfabética por `nome`.

### Classes filtradas

Somente as classes configuradas em `app.filtro.classes-relevantes` são retornadas.

Padrão: `person`, `chair`, `table`, `door`, `stairs`, `car`.

---

## Erros Globais

| Status | Exceção                       | Mensagem                        |
|--------|-------------------------------|---------------------------------|
| 400    | Validação de campos           | Detalhes do campo inválido      |
| 400    | Base64 inválido               | `"Imagem base64 inválida"`      |
| 404    | Análise não encontrada        | `"Análise não encontrada"`      |
| 503    | Serviço de IA indisponível    | `"Serviço de IA indisponível"`  |
| 500    | Erro interno não tratado      | `"Erro interno do servidor"`    |

Todos os erros seguem o mesmo envelope:

```json
{
  "sucesso":   false,
  "mensagem":  "<descrição do erro>",
  "dados":     null,
  "timestamp": 1711370000
}
```