const express = require('express');
const app = express();
app.use(express.json());
let serverLogs = [];
// Mapea claves a objetos con Job ID y tiempo de expiración: 
// { "claveSecreta": { jobId: "jobIdActual", expiresAt: timestamp } }
let activeKeys = {}; 
const GAME_PLACE_ID = "INGRESA_AQUI_EL_ID_DEL_JUEGO"; // <-- Tu ID del juego
const EXPIRATION_HOURS = 24; // <-- Define aquí cuántas horas quieres que dure la clave

// Endpoint para recibir datos de los bots y validar la clave
app.post('/update', (req, res) => {
    const { jobId, profit, players, key } = req.body;
    const now = Date.now();

    // 1. Verificar si la clave existe y si ha expirado
    if (activeKeys[key] && activeKeys[key].expiresAt < now) {
        delete activeKeys[key]; // Eliminar clave expirada
        return res.status(401).send("Clave expirada.");
    }
    
    // 2. Verificar uso concurrente (solo un dispositivo a la vez)
    if (activeKeys[key] && activeKeys[key].jobId !== jobId) {
        return res.status(401).send("Clave en uso en otro dispositivo.");
    }

    if (!activeKeys[key]) {
        // Registrar primer uso y tiempo de expiración (ej. 24h a partir de ahora)
        const expiresAt = now + (EXPIRATION_HOURS * 60 * 60 * 1000);
        activeKeys[key] = { jobId, expiresAt };
        console.log(`Clave ${key} registrada y expira en ${EXPIRATION_HOURS} horas.`);
    }

    // Procesa los logs si la validación es correcta
    serverLogs.push({ jobId, profit, players, timestamp: now });
    serverLogs.sort((a, b) => b.profit - a.profit);
    serverLogs = serverLogs.slice(0, 15);
    res.send("OK");
});

// ... (El resto de los endpoints /resetKey y / se quedan igual que antes) ...
app.get('/resetKey', (req, res) => {
    const keyToReset = req.query.key;
    if (activeKeys[keyToReset]) {
        delete activeKeys[keyToReset];
        res.send(`Clave ${keyToReset} reiniciada y eliminada.`);
    } else {
        res.send(`Clave ${keyToReset} no encontrada o ya reiniciada.`);
    }
});

app.get('/', (req, res) => {
    let html = "<h1>Mejores Servidores (Real-time)</h1>";
    serverLogs.forEach(s => {
        html += `<p>💰 ${s.profit}/seg - 👥 ${s.players} - <a href="roblox://placeID=${GAME_PLACE_ID}&gameInstanceId=${s.jobId}">[UNIRSE]</a></p>`;
    });
    res.send(html);
});

app.listen(10000);
