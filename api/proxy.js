export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    
    // Recupera la chiave Groq da Vercel
    const GROQ_KEY = process.env.GROQ_KEY;

    if (!GROQ_KEY) {
        return res.status(500).json({ error: "Manca la GROQ_KEY su Vercel." });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-specdec", // Il modello più veloce e potente di Groq
                messages: [
                    { role: "system", content: `Sei un esperto programmatore ${lang}.` },
                    { role: "user", content: `Azione: ${action}\nCodice:\n${code}` }
                ],
                temperature: 0.5
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(401).json({ error: "Errore Groq", details: data.error.message });
        }

        const aiText = data.choices[0]?.message?.content || "Nessuna risposta.";
        res.status(200).json({ response: aiText });

    } catch (err) {
        res.status(500).json({ error: "Errore di rete", details: err.message });
    }
}
