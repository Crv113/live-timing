#!/bin/bash

if [ -f livetiming.pid ]; then
    PID=$(cat livetiming.pid)
    echo "Stopping livetiming.js with PID $PID..."
    kill -SIGTERM $PID
    rm livetiming.pid
    echo "Stopped."
else
    echo "No livetiming.pid file found. Is the livetiming running?"
fi
