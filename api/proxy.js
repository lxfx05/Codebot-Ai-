export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    const GROQ_KEY = process.env.GROQ_KEY;

    if (!GROQ_KEY) {
        return res.status(500).json({ error: "Manca la GROQ_KEY su Vercel." });
    }

    // Lista modelli aggiornata al 2025
    // Proviamo il versatile 3.3, il 3.1 stabile o il nuovo Llama 4 se disponibile
    const models = [
        "llama-3.3-70b-versatile", 
        "llama-3.1-8b-instant"
    ];

    let lastError = "";

    for (const modelId of models) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        { role: "system", content: "Sei un esperto programmatore. Rispondi in modo conciso." },
                        { role: "user", content: `Azione: ${action}\nLinguaggio: ${lang}\nCodice:\n${code}` }
                    ]
                })
            });

            const data = await response.json();

            if (response.ok) {
                return res.status(200).json({ 
                    response: data.choices[0].message.content,
                    info: `Modello usato: ${modelId}`
                });
            } else {
                lastError = data.error?.message || "Errore sconosciuto";
                if (lastError.includes("decommissioned") || lastError.includes("not found")) continue;
                break; // Se l'errore è altro (es. Key errata), fermati
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    res.status(500).json({ error: "Errore Groq", details: lastError });
}
