const express = require('express');
const app = express();
app.use(express.json());
let serverLogs = [];
// Reemplaza con el ID numérico del juego (lo encuentras en la URL del juego en Roblox)
const GAME_PLACE_ID = "INGRESA_AQUI_EL_ID_DEL_JUEGO"; 

// Endpoint donde los bots enviarán la info
app.post('/update', (req, res) => {
    const { jobId, profit, players } = req.body;
    serverLogs.push({ jobId, profit, players, timestamp: Date.now() });
    serverLogs.sort((a, b) => b.profit - a.profit); // Ordena del más rentable al menos
    serverLogs = serverLogs.slice(0, 15); // Guarda solo los 15 mejores
    res.send("OK");
});

// Página web que verás en tu PC
app.get('/', (req, res) => {
    let html = "<h1>Mejores Servidores (Real-time)</h1>";
    serverLogs.forEach(s => {
        // Enlace que abre Roblox directamente en tu PC
        html += `<p>💰 ${s.profit}/seg - 👥 ${s.players} - <a href="roblox://placeID=${GAME_PLACE_ID}&gameInstanceId=${s.jobId}">[UNIRSE]</a></p>`;
    });
    res.send(html);
});
app.listen(10000);
