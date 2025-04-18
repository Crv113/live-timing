require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const dgram = require("dgram");

const IS_LOCAL = process.env.LOCAL === "1";
const allowedTypes = ["ENTRY", "LAP", "BESTLAP"];

const bestLapCache = {};
const eventCache = {};

if (IS_LOCAL) {
  // === Mode LOCAL : lecture depuis fichier ===
  const data = fs.readFileSync("test.txt", "utf-8");

  processData(data);
} else {
  const SERVER_IP = "127.0.0.1";
  const SERVER_PORT = 54220;
  const PASSWORD = "mxbTimingLiveClient";

  const client = dgram.createSocket("udp4");
  let isConnected = false;
  let keepAliveInterval;

  function send(message) {
    try {
      const msg = Buffer.from(message + "\n");
      client.send(msg, 0, msg.length, SERVER_PORT, SERVER_IP);
    } catch (e) {
      console.warn("Erreur lors de l’envoi UDP :", e.message);
    }
  }

  client.on("message", (msg) => {
    const raw = msg.toString();
    const lines = raw.trim().split("\n");
    const firstLine = lines[0];

    if (!isConnected) {
      if (firstLine === "OK") {
        isConnected = true;
        console.log("✅ Connecté au serveur, envoi de START...");
        send("START\n0\n0");

        keepAliveInterval = setInterval(() => {
          console.log("KEEPALIVE");
          send("KEEPALIVE");
        }, 15000);
      } else {
        console.error("❌ Connexion échouée :", firstLine);
        client.close();
      }
      return;
    }

    if (firstLine === "MSG") {
      const msgId = lines[1];
      processData(raw);
      send(`ACK\n${msgId}`);
    }
  });

  client.on("error", (err) => {
    console.error("Erreur UDP :", err);
    client.close();
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 Déconnexion propre...");
    clearInterval(keepAliveInterval);

    try {
      send("DISCONNECT");
    } catch (e) {
      console.warn("Impossible d’envoyer DISCONNECT :", e.message);
    }

    setTimeout(() => {
      client.close();
      console.log("✅ Socket fermé.");
      process.exit(0);
    }, 200);
  });

  console.log("🔌 Tentative de connexion...");
  send(`CONNECT\n${PASSWORD}`);
}

function splitDataIntoBlocks(data) {
  const lines = data.split("\n").slice(2);

  const blocks = [];
  let group = [];

  for (const line of lines) {
    if (line.trim() === "") {
      if (group.length) {
        blocks.push(group);
        group = [];
      }
    } else {
      group.push(line);
    }
  }
  if (group.length) blocks.push(group);

  return blocks;
}

async function sendLapTime(number) {
  console.log(
    "Send Api: " +
      number +
      " | newBestLap: " +
      formatLapTime(bestLapCache[number].lapTime)
  );

  const payload = {
    event_name: "MXGP Portugal",
    track_name: "Agueda",
    lap_time: "55500",
    lap_time_sector_1: "20000",
    lap_time_sector_2: "15500",
    average_speed: "65",
    bike_name: "Honda CRF450",
    category_name: "MX1",
    player_guid: "GUID-PLAYER-1234",
    player_name: "Tim Gajser",
  };

  try {
    const response = await axios.post(
      "http://localhost:8080/api/laptimes",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
        },
      }
    );
    console.log("✅ [LapTime enregistré]");
    console.log(response.data);
  } catch (error) {
    console.error("❌ [Erreur envoi LapTime]");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Erreur:", error.response.data);
    } else {
      console.error("Erreur:", error.message);
    }
  }
}

function processData(data) {
  const blocks = splitDataIntoBlocks(data);

  blocks.forEach((block) => {
    let number, lapTime;
    switch (block[0]) {
      case "EVENT":
        const eventName = block[2];
        const trackName = block[3];
        const trackLength = block[4];

        if (
          !Object.keys(eventCache).length ||
          eventName !== eventCache.event_name ||
          trackName !== eventCache.track_name
        ) {
          eventCache.event_name = eventName;
          eventCache.track_name = trackName;
          eventCache.track_length = trackLength;
          console.log(eventCache);
        }
        break;

      case "ENTRY":
        number = block[1];

        if (!bestLapCache[number]) {
          bestLapCache[number] = {
            number,
            player_name: block[2],
            player_guid: block[6],
            bike_name: block[3],
            category_name: block[5],
          };
        }
        break;

      case "BESTLAP":
        lapTime = block[3];
        number = block[1];

        if (bestLapCache[number]) {
          if (
            bestLapCache[number].lapTime === undefined ||
            lapTime < bestLapCache[number].lapTime
          ) {
            bestLapCache[number].lap_time = lapTime;
            bestLapCache[number].lap_time_sector_1 = block[5];
            bestLapCache[number].lap_time_sector_2 = block[6];
            bestLapCache[number].average_speed = block[7];

            sendLapTime(number);
          }
        }
        break;

      case "LAP":
        lapTime = block[4];
        number = block[1];
        const lapInvalid = block[2];

        const isValidLap = lapInvalid === "0" && lapTime !== "0";
        const hasEntry = !!bestLapCache[number];
        const isBetterLap =
          hasEntry &&
          (bestLapCache[number].lap_time === undefined ||
            parseInt(lapTime) < parseInt(bestLapCache[number].lap_time));

        if (!isBetterLap) {
          console.log("newLap for " + number + " but not enough: " + lapTime);
        }

        if (isValidLap && isBetterLap) {
          Object.assign(bestLapCache[number], {
            lap_time: lapTime,
            lap_time_sector_1: block[5],
            lap_time_sector_2: block[6],
            average_speed: block[7],
          });

          sendLapTime(number);
        }
        break;
    }
  });
}

function formatLapTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  const padded = (num, length) => String(num).padStart(length, "0");

  return `${padded(minutes, 2)}.${padded(seconds, 2)}.${padded(
    milliseconds,
    3
  )}`;
}
