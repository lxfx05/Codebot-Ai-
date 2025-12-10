const OpenAI = require('openai');
const Groq = require('groq-sdk');

const GROQ_KEY = process.env.GROQ_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

const providers = [];

if (GROQ_KEY) {
    providers.push({ name: 'Groq', key: GROQ_KEY, model: 'llama3-70b-8192' });
}
if (OPENAI_KEY) {
    providers.push({ name: 'OpenAI', key: OPENAI_KEY, model: 'gpt-3.5-turbo' });
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

            if (provider.name === 'Groq') {
                const groq = new Groq({ apiKey: provider.key });
                const chatCompletion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: promptTemplate }],
                    model: provider.model,
                });
                text = chatCompletion.choices[0]?.message?.content || '';

            } else if (provider.name === 'OpenAI') {
                const openai = new OpenAI({ apiKey: provider.key });
                const chatCompletion = await openai.chat.completions.create({
                    messages: [{ role: "user", content: promptTemplate }],
                    model: provider.model,
                });
                text = chatCompletion.choices[0]?.message?.content || '';
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
        error: `Backend now is unreachable. Please try again later.` 
    });
};
                  
