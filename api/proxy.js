export default async function handler(req, res) {
    // Gestione CORS per permettere al frontend di comunicare col backend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    const GEMINI_KEY = process.env.GEMINI_KEY; // Prende la chiave dalle impostazioni Vercel

    if (!GEMINI_KEY) {
        return res.status(500).json({ error: "Configurazione mancante: GEMINI_KEY non impostata su Vercel." });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Azione: ${action}. Linguaggio: ${lang}. Codice:\n${code}` }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(response.status).json({ error: "Google API Error", details: data.error.message });
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessuna risposta ricevuta.";
        res.status(200).json({ response: aiText });

    } catch (err) {
        res.status(500).json({ error: "Errore interno", details: err.message });
    }
}
