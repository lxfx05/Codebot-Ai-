export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    

    const keys = [process.env.KEY1, process.env.KEY2, process.env.KEY3].filter(k => k);


    const models = [
        "gemini-3-flash",      
        "gemini-3-pro",       
        "gemini-2.0-flash",    
        "gemini-1.5-pro",      
        "gemini-1.5-flash"     
    ];

    if (keys.length === 0) {
        return res.status(500).json({ error: "Nessuna chiave configurata (KEY_1, KEY_2, KEY_3)" });
    }

    let lastError = "";

    // GIRA TRA LE CHIAVI
    for (const currentKey of keys) {
        // GIRA TRA I MODELLI
        for (const modelName of models) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${currentKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: `Azione: ${action}. Linguaggio: ${lang}. Codice:\n${code}` }]
                        }]
                    })
                });

                const data = await response.json();

                if (response.ok && data.candidates?.[0]?.content) {
                    return res.status(200).json({ 
                        response: data.candidates[0].content.parts[0].text,
                        info: `Key attiva: ${currentKey.substring(0, 6)}... | Modello: ${modelName}`
                    });
                } else {
                    lastError = data.error?.message || "Errore sconosciuto";
                    // Se il modello non è trovato o non supportato dalla chiave, prova il prossimo modello
                    if (lastError.includes("not found") || lastError.includes("not supported")) continue;
                    // Se è un errore di quota, passa alla prossima CHIAVE
                    if (lastError.includes("quota")) break;
                }
            } catch (err) {
                lastError = err.message;
            }
        }
    }

    res.status(500).json({ error: "Tutte le combinazioni fallite", details: lastError });
}
