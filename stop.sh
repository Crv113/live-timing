#!/bin/bash

if [ -f script.pid ]; then
    PID=$(cat script.pid)
    echo "Stopping script.js with PID $PID..."
    kill -SIGTERM $PID
    rm script.pid
    echo "Stopped."
else
    echo "No script.pid file found. Is the script running?"
fi
