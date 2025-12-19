const express = require('express');
const app = express();
app.use(express.json());
let serverLogs = [];

// Recibir datos de los bots
app.post('/update', (req, res) => {
    const { jobId, profit, players } = req.body;
    serverLogs.push({ jobId, profit, players, timestamp: Date.now() });
    serverLogs.sort((a, b) => b.profit - a.profit); // Ordenar por mejor ganancia
    serverLogs = serverLogs.slice(0, 15); // Guardar solo los 15 mejores
    res.send("OK");
});

// Ver lista desde iPhone
app.get('/', (req, res) => {
    let html = "<h1>Mejores Servidores (Real-time)</h1>";
    serverLogs.forEach(s => {
        html += `<p>💰 ${s.profit}/seg - 👥 ${s.players} - <a href="roblox://placeID=EL_ID_DEL_JUEGO&gameInstanceId=${s.jobId}">[UNIRSE]</a></p>`;
    });
    res.send(html);
});
app.listen(10000);
