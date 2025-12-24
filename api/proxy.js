export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    
    // Lista delle chiavi caricate da Vercel
    const keys = [
        process.env.KEY_1,
        process.env.KEY_2,
        process.env.KEY_3
    ].filter(k => k); // Rimuove chiavi vuote o non impostate

    if (keys.length === 0) {
        return res.status(500).json({ error: "Nessuna chiave API configurata su Vercel." });
    }

    let lastError = "";

    // Ciclo per provare ogni chiave
    for (let i = 0; i < keys.length; i++) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys[i]}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Azione: ${action}. Linguaggio: ${lang}. Codice:\n${code}` }] }]
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Se la chiamata ha successo, restituisce il risultato e interrompe il ciclo
                return res.status(200).json({ 
                    response: data.candidates[0].content.parts[0].text,
                    keyUsed: `Chiave ${i + 1}` 
                });
            } else {
                lastError = data.error?.message || "Errore sconosciuto";
                console.warn(`Chiave ${i + 1} fallita: ${lastError}`);
            }
        } catch (err) {
            lastError = err.message;
            console.error(`Errore tecnico con Chiave ${i + 1}`);
        }
    }

    // Se arriviamo qui, tutte le chiavi hanno fallito
    res.status(500).json({ 
        error: "Tutte le chiavi API hanno fallito.", 
        details: lastError 
    });
}

