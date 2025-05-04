#!/bin/bash

echo "Starting script.js..."

nohup node script.js > script.log 2>&1 &
echo $! > script.pid

echo "Started with PID $(cat script.pid)"
