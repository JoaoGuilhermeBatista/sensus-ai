CREATE TABLE analise (
    id         BIGSERIAL PRIMARY KEY,
    timestamp  BIGINT    NOT NULL,
    resultado  TEXT
);

CREATE TABLE objeto_detectado (
    id         BIGSERIAL PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    distancia  VARCHAR(50),
    is_close   BOOLEAN,
    analise_id BIGINT REFERENCES analise(id) ON DELETE CASCADE
);

CREATE INDEX idx_analise_timestamp ON analise(timestamp DESC);
CREATE INDEX idx_objeto_analise_id ON objeto_detectado(analise_id);
CREATE INDEX idx_objeto_is_close   ON objeto_detectado(is_close);