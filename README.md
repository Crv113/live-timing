# Live-timing

📅 Q1 2025

👋 Hey ! Part of the MXB Timing ecosystem, Live-timing is a Node.js script that listens to live UDP packets sent by the Mx Bikes game server to extract real-time telemetry and lap timing data.
This service acts as a bridge between the game and the Laravel backend, making live race insights available to the platform.

---

## 🏁 What It Does

- Listens for live UDP data from Mx Bikes during races.
- Parses packets to extract lap times, sector splits, speed, and player info.
- Computes best lap times and personal records in real-time.
- Sends parsed data to the Laravel backend via authenticated REST API requests.
- Can be extended to support additional telemetry or race events.

---

## 🛠️ Tech Stack

- **NodeJs**
- **UDP (dgram module)**
- **Axios (API communication)**
- **React Hook Form**
- **TanStack Query**
- **Axios**
- **Discord OAuth2**
- **Docker**

