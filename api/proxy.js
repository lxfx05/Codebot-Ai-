export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    
    // Recupero le chiavi dalle variabili d'ambiente di Vercel
    const keys = [
        process.env.KEY1,
        process.env.KEY2,
        process.env.KEY3
    ].filter(k => k && k.trim() !== "");

    if (keys.length === 0) {
        return res.status(500).json({ error: "Nessuna chiave API configurata su Vercel (KEY_1, KEY_2, KEY_3)." });
    }

    let lastError = "";

    for (let i = 0; i < keys.length; i++) {
        try {
            // Usiamo v1 invece di v1beta per maggiore stabilità
            const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${keys[i]}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Agisci come assistente programmatore. Azione: ${action}. Linguaggio: ${lang}. Codice:\n${code}` }]
                    }]
                })
            });

            const data = await response.json();

            if (response.ok && data.candidates && data.candidates[0].content) {
                return res.status(200).json({ 
                    response: data.candidates[0].content.parts[0].text,
                    info: `Successo con Chiave ${i + 1}`
                });
            } else {
                lastError = data.error?.message || "Risposta non valida dal modello";
                console.warn(`Tentativo ${i + 1} fallito: ${lastError}`);
            }
        } catch (err) {
            lastError = err.message;
            console.error(`Errore tecnico chiave ${i + 1}:`, err);
        }
    }

    res.status(500).json({ 
        error: "Non è stato possibile ottenere una risposta dalle API di Google.", 
        details: lastError 
    });
}
