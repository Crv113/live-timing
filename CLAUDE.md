# CLAUDE.md

Ce fichier fournit des instructions à Claude Code (claude.ai/code) pour travailler sur ce dépôt.

## Vue d'ensemble

Script Node.js qui écoute les paquets UDP live envoyés par le serveur dédié Mx Bikes, en extrait la télémétrie et les temps au tour, et relaie les données vers l'API `seek-and-stock` (Laravel) en REST authentifié.

## Documentation du protocole serveur

`doc.txt` — spec officielle du protocole live-timing du serveur dédié Mx Bikes (handshake CONNECT/START/KEEPALIVE, format de chaque type de message : EVENT, ENTRY, ENTRYREMOVE, SESSION, BESTLAP, LAP, CLASSIFICATION, etc.). **Toujours consulter ce fichier avant d'ajouter le traitement d'un nouveau type de message** — le format exact des champs (ordre, unités) y est décrit.

`test.txt` — exemple de payload brut capturé, utilisé en mode `LOCAL` pour rejouer des données sans serveur de jeu.

## Commandes

```bash
npm install
node livetiming.js       # lancement direct

./start.sh                # lance en arrière-plan (nohup), écrit livetiming.pid
./stop.sh                  # arrête proprement via le PID
./reboot_server.sh         # redémarre le serveur MXBikes + livetiming.js (usage prod, chemins en dur à adapter)
```

## Configuration (`.env`)

- `API_KEY` — token envoyé en `Authorization: Bearer` vers l'API `seek-and-stock` (middleware `VerifyApiKey`)
- `SERVER_PASSWORD` — mot de passe de connexion au serveur dédié Mx Bikes
- `API_BASE_URL` — base URL de l'API `seek-and-stock` cible (ex: `https://api.mxbtiming.com`), utilisée par `sendLapTime`/`sendServerStatus`. Pointer vers une instance locale pour tester sans écrire dans l'API de prod.
- `LOCAL=1` — active le mode local : lit `test.txt` au lieu d'ouvrir une socket UDP, pratique pour tester `processData()` sans serveur de jeu. Ne change QUE la source des données reçues, pas la destination des POST — `API_BASE_URL` reste utilisée telle quelle, donc pointer vers une instance locale pour un test qui n'écrit pas en prod.

## Conventions non-obvieuses

- Un seul client peut être connecté à la fois au flux live-timing du serveur de jeu (limite du protocole, cf. `doc.txt`)
- Le handshake est : `CONNECT` → `OK` → `START\n0\n0` → puis `KEEPALIVE` toutes les 15s pour garder la connexion active
- Chaque message reçu (`MSG`) doit être acquitté avec `ACK\n<msgId>`, sinon le serveur de jeu le renvoie
- `processData()` découpe le payload en blocs (`splitDataIntoBlocks`) puis route chaque bloc par son premier élément (type de message, ex. `ENTRY`, `LAP`) — seuls certains types sont actuellement traités dans le `switch`, les autres sont ignorés silencieusement
- `bestLapCache` est indexé par numéro de course (`Race Number`), pas par GUID joueur — persiste tant que le script tourne, jamais nettoyé sur `ENTRYREMOVE`
- `eventCache` est mis à jour uniquement quand le nom d'event ou de piste change, pour éviter de spammer les logs
- Un lap n'est envoyé à l'API que s'il bat le meilleur temps connu en cache (`isBetterLap`) — l'API ne reçoit donc que des améliorations, jamais tous les tours
- `customLog()` déduit le numéro de ligne appelant via `Error().stack` — ne pas le wrapper dans une fonction intermédiaire, ça fausserait le numéro de ligne loggué
