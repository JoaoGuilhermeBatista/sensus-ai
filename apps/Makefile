# Sensus AI — orquestrador de dev local
#
# Sobe os três serviços do monorepo:
#   - ia-service  (FastAPI + YOLOv8)  porta 8002
#   - backend-api (Spring Boot)       porta 8080  (perfil dev)
#   - frontend-xr (Vite + React)      porta 5173/5174
#
# Uso:
#   make ia        - inicia só a IA
#   make backend   - inicia só o backend
#   make t     - inicia só o frontend
#   make all       - inicia os três juntos (logs em logs/, encerra todos no Ctrl+C)
#   make stop      - mata o que estiver nas portas 8002/8080/5173/5174
#   make status    - mostra o que está rodando nas portas

ROOT       := $(CURDIR)
IA_DIR     := $(ROOT)/ia-service
BACK_DIR   := $(ROOT)/backend-api
FRONT_DIR  := $(ROOT)/frontend-xr
LOG_DIR    := $(ROOT)/logs

IA_PORT    := 8002
BACK_PORT  := 8080
FRONT_PORT := 5173

.PHONY: help ia backend front all stop status quest-wifi quest-usb quest quest-test ip

help:
	@echo "Sensus AI — dev local:"
	@echo "  make ia         - inicia a IA (FastAPI, porta $(IA_PORT))"
	@echo "  make backend    - inicia o backend (Spring Boot, porta $(BACK_PORT))"
	@echo "  make front      - inicia o frontend (Vite, http)"
	@echo "  make all        - inicia os três juntos"
	@echo "  make stop       - encerra todos os serviços"
	@echo "  make status     - lista o que está rodando"
	@echo ""
	@echo "Meta Quest (WebXR/AR exige origem segura):"
	@echo "  make quest      - USB: espelha portas E abre a URL no navegador do Quest"
	@echo "  make quest-test - sobe IA+backend+front e abre no Quest (tudo-em-um)"
	@echo "  make quest-wifi - front em HTTPS; abra https://<IP>:$(FRONT_PORT) no Quest (WiFi)"
	@echo "  make quest-usb  - só espelha as portas via adb (não abre o browser)"
	@echo "  make ip         - mostra o IP do notebook na rede"

ia:
	@if [ ! -f $(IA_DIR)/.venv/bin/uvicorn ]; then \
		echo "venv da IA não encontrado; rode 'make setup' em ia-service"; exit 1; \
	fi
	cd $(IA_DIR) && ./.venv/bin/uvicorn app:app --host 0.0.0.0 --port $(IA_PORT)

backend:
	cd $(BACK_DIR) && mvn spring-boot:run

front:
	cd $(FRONT_DIR) && npm run dev

all:
	@mkdir -p $(LOG_DIR)
	@echo "Iniciando IA, backend e frontend... (Ctrl+C encerra todos)"
	@echo "Logs em $(LOG_DIR)/"
	@trap 'kill 0' INT TERM EXIT; \
	( cd $(IA_DIR)    && ./.venv/bin/uvicorn app:app --host 0.0.0.0 --port $(IA_PORT) > $(LOG_DIR)/ia.log 2>&1 ) & \
	( cd $(BACK_DIR)  && mvn spring-boot:run > $(LOG_DIR)/backend.log 2>&1 ) & \
	( cd $(FRONT_DIR) && npm run dev > $(LOG_DIR)/front.log 2>&1 ) & \
	wait

stop:
	@for p in $(IA_PORT) $(BACK_PORT) $(FRONT_PORT) 5174; do \
		fuser -k $$p/tcp 2>/dev/null && echo "porta $$p encerrada" || echo "porta $$p já livre"; \
	done

status:
	@for p in $(IA_PORT) $(BACK_PORT) $(FRONT_PORT) 5174; do \
		printf "porta %-5s: " $$p; \
		ss -tlnp 2>/dev/null | grep -q ":$$p " && echo "OCUPADA" || echo "livre"; \
	done

# IP do notebook na rede local (primeiro endereço não-loopback)
ip:
	@ip -4 addr show scope global 2>/dev/null | awk '/inet /{sub(/\/.*/,"",$$2); print $$2; exit}'

# WiFi: front em HTTPS para WebXR funcionar via IP. Backend e IA precisam estar de pé
# (make backend / make ia). O Vite faz proxy de /ws -> backend, sem mixed-content.
quest-wifi:
	@IP=$$(ip -4 addr show scope global 2>/dev/null | awk '/inet /{sub(/\/.*/,"",$$2); print $$2; exit}'); \
	echo "════════════════════════════════════════════════════"; \
	echo " No Quest (mesma WiFi), abra:"; \
	echo "   https://$$IP:$(FRONT_PORT)"; \
	echo " Aceite o aviso de certificado autoassinado."; \
	echo "════════════════════════════════════════════════════"; \
	cd $(FRONT_DIR) && HTTPS=1 npm run dev

# USB: espelha as portas do notebook no Quest como localhost (origem segura).
# Requer Modo Desenvolvedor ligado e depuração USB autorizada no Quest.
quest-usb:
	@if ! adb devices | grep -qw device; then \
		echo "Nenhum Quest conectado/autorizado. Verifique o cabo e o popup de depuração USB no headset."; \
		adb devices; exit 1; \
	fi
	adb reverse tcp:$(FRONT_PORT) tcp:$(FRONT_PORT)
	adb reverse tcp:$(BACK_PORT) tcp:$(BACK_PORT)
	adb reverse tcp:$(IA_PORT) tcp:$(IA_PORT)
	@echo "════════════════════════════════════════════════════"
	@echo " Portas espelhadas. No Quest, abra:"
	@echo "   http://localhost:$(FRONT_PORT)"
	@echo " (mantenha backend e IA rodando no notebook)"
	@echo "════════════════════════════════════════════════════"

# Teste focado no Meta Quest: espelha portas via USB (localhost = origem segura
# p/ WebXR) e abre a URL direto no navegador do headset via adb.
# URL=... sobrescreve (padrão http://localhost:$(FRONT_PORT)).
QUEST_URL ?= http://localhost:$(FRONT_PORT)
quest: quest-usb
	@echo "Abrindo $(QUEST_URL) no navegador do Quest..."
	@OPENED=0; \
	for PKG in com.oculus.browser com.meta.browser; do \
		if adb shell pm list packages 2>/dev/null | grep -q "$$PKG"; then \
			adb shell am start -a android.intent.action.VIEW -d "$(QUEST_URL)" "$$PKG" >/dev/null 2>&1 \
				&& { echo "  -> lançado via $$PKG"; OPENED=1; break; }; \
		fi; \
	done; \
	if [ "$$OPENED" = "0" ]; then \
		echo "  navegador do Quest não encontrado automaticamente; tentando intent genérico..."; \
		adb shell am start -a android.intent.action.VIEW -d "$(QUEST_URL)" >/dev/null 2>&1 \
			&& echo "  -> intent enviado" \
			|| echo "  falhou; abra $(QUEST_URL) manualmente no Quest"; \
	fi

# Tudo-em-um para o Meta: sobe IA + backend + front (background) e abre no Quest.
quest-test:
	@mkdir -p $(LOG_DIR)
	@echo "Subindo IA, backend e front em background (logs em $(LOG_DIR)/)..."
	@( cd $(IA_DIR)    && ./.venv/bin/uvicorn app:app --host 0.0.0.0 --port $(IA_PORT) > $(LOG_DIR)/ia.log 2>&1 & )
	@( cd $(BACK_DIR)  && mvn -q spring-boot:run > $(LOG_DIR)/backend.log 2>&1 & )
	@( cd $(FRONT_DIR) && npm run dev > $(LOG_DIR)/front.log 2>&1 & )
	@echo "Aguardando serviços subirem..."
	@for i in $$(seq 1 60); do \
		curl -sf -m 1 http://localhost:$(FRONT_PORT) >/dev/null 2>&1 && \
		curl -sf -m 1 http://localhost:$(BACK_PORT)/actuator/health >/dev/null 2>&1 && break; \
		sleep 2; \
	done
	@$(MAKE) quest
