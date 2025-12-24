export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { code, lang, action } = req.body || {};
    const GROQ_KEY = process.env.GROQ_KEY;

    if (!GROQ_KEY) {
        return res.status(500).json({ error: "System Error: Missing Backend Configuration." });
    }

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
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
                        { 
                            role: "system", 
                            content: `Agisci come un motore di analisi statica del codice integrato nel backend. 
                            NON salutare. NON dire 'Ecco il codice'. NON menzionare di essere un'IA o un modello linguistico. 
                            Fornisci solo l'analisi tecnica o il codice corretto. 
                            Usa un tono puramente tecnico e professionale.` 
                        },
                        { role: "user", content: `ENTRY_POINT: ${action}\nTARGET_LANG: ${lang}\nSOURCE_CODE:\n${code}` }
                    ],
                    temperature: 0.2 // Più basso per risposte più precise e meno "chiacchierone"
                })
            });

            const data = await response.json();

            if (response.ok) {
                let cleanResponse = data.choices[0].message.content;
                
                // Rimuove eventuali scorie residue che citano l'IA (sicurezza extra)
                cleanResponse = cleanResponse.replace(/come un modello di linguaggio/gi, "")
                                             .replace(/in quanto IA/gi, "")
                                             .replace(/Ecco la spiegazione/gi, "");

                return res.status(200).json({ 
                    response: cleanResponse 
                });
            } else {
                lastError = data.error?.message || "Unknown internal error";
                if (lastError.includes("decommissioned") || lastError.includes("not found")) continue;
                break;
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    res.status(500).json({ error: "Backend Analysis Failed", details: lastError });
}
