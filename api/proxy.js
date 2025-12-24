export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    const GROQ_KEY = process.env.GROQ_KEY;

    if (!GROQ_KEY) {
        return res.status(500).json({ error: "Configurazione mancante: GROQ_KEY non impostata su Vercel." });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-specdec",
                messages: [
                    { 
                        role: "system", 
                        content: `Sei un assistente programmatore esperto. Lingua: Italiano. Azione richiesta: ${action}.` 
                    },
                    { 
                        role: "user", 
                        content: `Linguaggio: ${lang}\nCodice:\n${code}` 
                    }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(response.status).json({ error: "Errore Groq", details: data.error.message });
        }

        res.status(200).json({ response: data.choices[0].message.content });

    } catch (err) {
        res.status(500).json({ error: "Errore interno del server", details: err.message });
    }
}
