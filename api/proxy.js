export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    
    // Lista delle chiavi caricate da Vercel
    const keys = [
        process.env.GROQ_KEY_1,
        process.env.GROQ_KEY_2,
        process.env.GROQ_KEY_3
    ].filter(k => k);

    if (keys.length === 0) {
        return res.status(500).json({ error: "[SYSTEM_ERROR] No Keys Configured" });
    }

    let lastError = "";

    // Ciclo di rotazione chiavi
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
                        { role: "system", content: "Agisci come Backend Engine. Analisi tecnica pura, no AI talk." },
                        { role: "user", content: `ACTION: ${action}\nLANG: ${lang}\nCODE:\n${code}` }
                    ],
                    temperature: 0.1
                })
            });

            const data = await response.json();

            if (response.ok) {
                return res.status(200).json({ 
                    response: data.choices[0].message.content 
                });
            } else {
                lastError = data.error?.message || "Key Failure";
                console.warn(`Chiave ${i+1} fallita, provo la prossima...`);
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    res.status(500).json({ error: "[BACKEND_EXHAUSTED]", details: lastError Vercel
