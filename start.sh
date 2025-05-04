#!/bin/bash

echo "Starting livetiming.js..."

nohup node livetiming.js > livetiming.log 2>&1 &
echo $! > livetiming.pid

echo "Started with PID $(cat livetiming.pid)"
