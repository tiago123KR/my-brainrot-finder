const express = require('express');
const app = express();
app.use(express.json());
let serverLogs = [];
// Almacena las claves activas: { "claveEjemplo": { clientName: "NombreCliente", jobId: "ID_Servidor", expiresAt: timestamp } }
let activeKeys = {}; 
const GAME_PLACE_ID = "INGRESA_AQUI_EL_ID_DEL_JUEGO"; // <-- Tu ID del juego

function generateKey() {
    return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

// -- ENDPOINTS PÚBLICOS (Bots) --
app.post('/update', (req, res) => {
    const { jobId, profit, players, key } = req.body;
    const now = Date.now();

    if (!activeKeys[key] || activeKeys[key].expiresAt < now) {
        if (activeKeys[key]) delete activeKeys[key];
        return res.status(401).send("Clave invalida o expirada.");
    }
    
    if (activeKeys[key].jobId && activeKeys[key].jobId !== jobId) {
        return res.status(401).send("Clave en uso en otro dispositivo.");
    }

    if (!activeKeys[key].jobId) {
        activeKeys[key].jobId = jobId;
    }

    serverLogs.push({ jobId, profit, players, timestamp: now });
    serverLogs.sort((a, b) => b.profit - a.profit);
    serverLogs = serverLogs.slice(0, 15);
    res.send("OK");
});

// -- ENDPOINTS DE ADMINISTRACIÓN (Tú) --

// Página principal con lista de servidores
app.get('/', (req, res) => {
    let html = "<h1>Mejores Servidores (Real-time)</h1>";
    serverLogs.forEach(s => {
        html += `<p>💰 ${s.profit}/seg - 👥 ${s.players} - <a href="roblox://placeID=${GAME_PLACE_ID}&gameInstanceId=${s.jobId}">[UNIRSE]</a></p>`;
    });
    html += '<hr><a href="/admin">Panel de Administración de Claves</a>';
    res.send(html);
});

// Panel de administración: Ver, crear y resetear claves
app.get('/admin', (req, res) => {
    let html = '<h1>Administración de Claves</h1>';
    html += '<h2>Generar Nueva Clave:</h2>';
    html += '<form method="POST" action="/admin/generate">';
    html += 'Cliente: <input type="text" name="clientName" required> ';
    html += 'Duración (Horas): <input type="number" name="hours" value="24"> ';
    html += '<button type="submit">Generar</button>';
    html += '</form><hr><h2>Claves Activas:</h2>';
    
    for (const key in activeKeys) {
        const data = activeKeys[key];
        const expiryDate = new Date(data.expiresAt).toLocaleString();
        html += `<p><strong>${key}</strong> (Cliente: ${data.clientName}) - Expira: ${expiryDate} - Usado en JobID: ${data.jobId || 'N/A'} `;
        html += `<a href="/admin/resetKey?key=${key}">[Resetear Uso]</a></p>`;
    }
    res.send(html);
});

// Endpoint POST para generar la clave
app.post('/admin/generate', (req, res) => {
    const hours = parseInt(req.body.hours) || 24;
    const clientName = req.body.clientName || 'Desconocido';
    const newKey = generateKey();
    const expiresAt = Date.now() + (hours * 60 * 60 * 1000);
    
    activeKeys[newKey] = { clientName, jobId: null, expiresAt };
    res.redirect('/admin');
});

// Endpoint GET para resetear el uso de la clave por dispositivo
app.get('/admin/resetKey', (req, res) => {
    const keyToReset = req.query.key;
    if (activeKeys[keyToReset]) {
        activeKeys[keyToReset].jobId = null; // Quita el registro del dispositivo actual
        res.send(`Uso de la clave ${keyToReset} reiniciado. Se puede usar en un nuevo dispositivo ahora.`);
    } else {
        res.send(`Clave ${keyToReset} no encontrada.`);
    }
});

app.listen(10000);
