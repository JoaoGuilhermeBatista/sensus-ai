#!/bin/sh
set -e

# Render injects DATABASE_URL as postgres://user:pass@host:port/db
# Spring Boot needs jdbc:postgresql://host:port/db
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
    export SPRING_DATASOURCE_URL="jdbc:postgresql://$(echo "$DATABASE_URL" | sed 's|.*@||')"
    [ -z "$DB_USER" ] && export DB_USER="$(echo "$DATABASE_URL" | sed 's|.*://\([^:]*\):.*|\1|')"
    [ -z "$DB_PASS" ] && export DB_PASS="$(echo "$DATABASE_URL" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|')"
fi

exec java -jar "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod}" /app/app.jar
