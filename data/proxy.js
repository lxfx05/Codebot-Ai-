const fetch = require('node-fetch');

const GEMINI_KEY = process.env.GEMINI_KEY;

const providers = [];

if (GEMINI_KEY) {
    providers.push({ name: 'Gemini', type: 'Gemini', key: GEMINI_KEY, model: 'gemini-2.5-flash' });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    
    if (!req.body) {
        return res.status(400).json({ error: 'Request body is empty.' });
    }

    const { code, lang, action } = req.body; 

    if (!code || !lang || !action) {
        return res.status(400).json({ error: 'Missing code, language, or action.' });
    }

    const promptTemplate = `You are a programming assistant. If action is 'explain', provide a brief explanation. If action is 'fix', analyze and provide the corrected code. Focus on the ${lang.toUpperCase()} code:\n\n\`\`\`${lang}\n${code}\n\`\`\``;

    for (const provider of providers) {
        try {
            let text = '';

            if (provider.type === 'Gemini') {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${provider.key}`;
                
                const geminiResponse = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: promptTemplate }] }],
                        config: { maxOutputTokens: 1024 }
                    }),
                });
                
                const data = await geminiResponse.json();
                if (!geminiResponse.ok || data.error) {
                    throw new Error("Gemini call failed");
                }
                text = data.candidates[0]?.content?.parts[0]?.text || '';
            }

            if (text && text.trim().length > 0) {
                return res.status(200).json({ 
                    response: text, 
                    source: "Backend" 
                });
            }

        } catch (error) {
        }
    }

    res.status(500).json({ 
        error: `Backend now is unreachable. Please try again later...` 
    });
};
