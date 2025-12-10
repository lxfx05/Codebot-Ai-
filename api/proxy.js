const OpenAI = require('openai');
const Groq = require('groq-sdk');
const fetch = require('node-fetch');

const GROQ_KEY = process.env.GROQ_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;

const providers = [];

if (GROQ_KEY) {
    providers.push({ name: 'Groq', type: 'OpenAI_Compatible', key: GROQ_KEY, model: 'llama3-70b-8192' });
}
if (OPENAI_KEY) {
    providers.push({ name: 'OpenAI', type: 'OpenAI_Compatible', key: OPENAI_KEY, model: 'gpt-3.5-turbo' });
}
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

            if (provider.type === 'OpenAI_Compatible') {
                const client = provider.name === 'Groq' ? new Groq({ apiKey: provider.key }) : new OpenAI({ apiKey: provider.key });
                
                const chatCompletion = await client.chat.completions.create({
                    messages: [{ role: "user", content: promptTemplate }],
                    model: provider.model,
                    max_tokens: 1024
                });
                text = chatCompletion.choices[0]?.message?.content || '';

            } else if (provider.type === 'Gemini') {
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
