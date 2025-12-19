const express = require('express');
const app = express();
app.use(express.json());
let serverLogs = [];
// Mapea claves a Job IDs activos: { "claveSecreta": "jobIdActual" }
let activeKeys = {}; 
const GAME_PLACE_ID = "INGRESA_AQUI_EL_ID_DEL_JUEGO"; // <-- Tu ID del juego

// Endpoint para recibir datos de los bots y validar el dispositivo
app.post('/update', (req, res) => {
    const { jobId, profit, players, key } = req.body;
    
    // Validar clave y dispositivo actual
    if (activeKeys[key] && activeKeys[key] !== jobId) {
        return res.status(401).send("Clave en uso en otro dispositivo.");
    }

    if (!activeKeys[key]) {
        // Registrar el primer uso de la clave en este dispositivo
        activeKeys[key] = jobId;
        console.log(`Clave ${key} registrada al JobId ${jobId}`);
    }

    // Procesa los logs si la validación es correcta
    serverLogs.push({ jobId, profit, players, timestamp: Date.now() });
    serverLogs.sort((a, b) => b.profit - a.profit);
    serverLogs = serverLogs.slice(0, 15);
    res.send("OK");
});

// Endpoint para "resetear" una clave perdida (puedes usarlo desde el navegador)
app.get('/resetKey', (req, res) => {
    const keyToReset = req.query.key;
    if (activeKeys[keyToReset]) {
        delete activeKeys[keyToReset];
        res.send(`Clave ${keyToReset} reiniciada. Se puede usar en un nuevo dispositivo ahora.`);
    } else {
        res.send(`Clave ${keyToReset} no encontrada o ya reiniciada.`);
    }
});

// Página web que verás en tu PC
app.get('/', (req, res) => {
    let html = "<h1>Mejores Servidores (Real-time)</h1>";
    serverLogs.forEach(s => {
        html += `<p>💰 ${s.profit}/seg - 👥 ${s.players} - <a href="roblox://placeID=${GAME_PLACE_ID}&gameInstanceId=${s.jobId}">[UNIRSE]</a></p>`;
    });
    res.send(html);
});

app.listen(10000);
