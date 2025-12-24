export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    
    // Lista chiavi (assicurati di averle messe su Vercel Settings)
    const keys = [
        process.env.GROQ_KEY_1, 
        process.env.GROQ_KEY_2, 
        process.env.GROQ_KEY_3
    ].filter(k => k);

    for (const key of keys) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "Technical Backend Engine. Rispondi solo con codice o analisi tecnica. No saluti, no AI mentions." },
                        { role: "user", content: `ACTION: ${action}\nLANG: ${lang}\nCODE:\n${code}` }
                    ],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                return res.status(200).json({ response: data.choices[0].message.content });
            }
            // Se non è ok, il ciclo continua alla prossima chiave
        } catch (err) {
            continue; 
        }
    }
    res.status(500).json({ error: "BACKEND_ERROR", details: "Tutte le chiavi fallite." });
}
