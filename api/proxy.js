export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    
    // Recupero chiavi
    const keys = [
        process.env.GROQ_KEY_1, 
        process.env.GROQ_KEY_2, 
        process.env.GROQ_KEY_3
    ].filter(k => k && k.startsWith("gsk_")); // Filtra solo chiavi valide

    if (keys.length === 0) {
        return res.status(500).json({ error: "ERR_NO_KEYS_CONFIGURED" });
    }

    let lastErrorMessage = "";

    for (let i = 0; i < keys.length; i++) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${keys[i]}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "Technical Backend Engine. Solo output tecnico, no AI talk." },
                        { role: "user", content: `ACTION: ${action}\nLANG: ${lang}\nCODE:\n${code}` }
                    ],
                    temperature: 0.1
                })
            });

            const data = await response.json();

            // Se la risposta è OK, restituisci i dati e interrompi il ciclo
            if (response.ok && data.choices?.[0]?.message?.content) {
                return res.status(200).json({ 
                    response: data.choices[0].message.content 
                });
            } else {
                // Se la chiave è scaduta o limitata, salva l'errore e continua il ciclo
                lastErrorMessage = data.error?.message || "Errore sconosciuto sulla chiave " + (i+1);
                console.log(`Key ${i+1} fallita: ${lastErrorMessage}`);
                continue; 
            }
        } catch (err) {
            lastErrorMessage = err.message;
            continue; 
        }
    }

    // Se arriviamo qui, tutte le chiavi hanno fallito
    res.status(500).json({ 
        error: "BACKEND_EXHAUSTED", 
        details: "Tutte le chiavi (1, 2, 3) sono state provate ma hanno fallito: " + lastErrorMessage 
    });
}
