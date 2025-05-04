#!/bin/bash
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $@"
}

# Chemins (à adapter si besoin)
LIVETIMING_DIR="$HOME/Documents/livetiming"
SERVER_DIR="$HOME/Documents/server1"
MXB_SERVER_EXE="$HOME/mxbserver/mxbikes.exe"
SERVER_PORT=54213

log "========== [ $(date) ] Reboot du serveur MXB =========="

# 1. Arrêt du livetiming.js
log "🔄 Vérification et arrêt de livetiming.js si actif..."
cd "$LIVETIMING_DIR"

if [ -f livetiming.pid ]; then
    PID=$(cat livetiming.pid)
    if ps -p $PID > /dev/null; then
        log "🛑 livetiming.js actif avec PID $PID. Arrêt..."
        ./stop.sh
    else
        log "⚠️ livetiming.pid trouvé mais process $PID inactif. Nettoyage..."
        rm livetiming.pid
    fi
else
    log "✅ livetiming.js n’est pas actif."
fi

# 2. Arrêt du serveur MXBikes
log "🔄 Arrêt du serveur MXBikes..."
MXB_PID=$(pgrep -f "mxbikes.exe.*-dedicated $SERVER_PORT")

if [ -n "$MXB_PID" ]; then
    log "🛑 Serveur MXBikes trouvé avec PID $MXB_PID. Arrêt..."
    kill "$MXB_PID"
    sleep 5
    if ps -p "$MXB_PID" > /dev/null; then
        log "⚠️ Serveur toujours actif, tentative de kill forcé..."
        kill -9 "$MXB_PID"
    fi
else
    log "✅ Aucun serveur MXBikes en cours."
fi

# 3. Démarrage du serveur MXBikes
log "🚀 Démarrage du serveur MXBikes..."
cd "$SERVER_DIR"
./start.sh

# 4. Attente pour stabilisation
log "⏳ Attente de 60 secondes pour stabilisation..."
sleep 60

# 5. Démarrage du livetiming.js
log "🚀 Redémarrage de livetiming.js..."
cd "$LIVETIMING_DIR"
./start.sh

log "✅ Redémarrage terminé."
