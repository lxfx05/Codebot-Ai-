const GROQ_KEY = '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';
const OPENAI_KEY = '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';

const providers = [];

if (GROQ_KEY) {
    providers.push({ 
        name: 'Groq', 
        key: GROQ_KEY, 
        url: 'https://api.groq.com/openai/v1/chat/completions', 
        model: 'llama3-70b-8192' 
    });
}

if (OPENAI_KEY) {
    providers.push({ 
        name: 'OpenAI', 
        key: OPENAI_KEY, 
        url: 'https://api.openai.com/v1/chat/completions', 
        model: 'gpt-3.5-turbo' 
    });
}

async function callAI(code, lang, action, outElement) {
    const promptTemplate = `You are a programming assistant. If action is 'explain', provide a brief explanation. If action is 'fix', analyze and provide the corrected code. Focus on the ${lang.toUpperCase()} code:\n\n\`\`\`${lang}\n${code}\n\`\`\``;

    outElement.innerHTML = `<span class="warning">Processing...</span> <div class="loading"></div>`;

    for (const provider of providers) {
        try {
            const fetchOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.key}`
                },
                body: JSON.stringify({
                    model: provider.model,
                    messages: [{ role: "user", content: promptTemplate }],
                    max_tokens: 1024
                }),
            };

            const response = await fetch(provider.url, fetchOptions);
            
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error("Backend service failed"); 
            }

            const text = data.choices[0]?.message?.content;

            if (text && text.trim().length > 0) {
                return { response: text }; 
            }

        } catch (error) {
        }
    }
    
    return `Backend now is unreachable. Please try again later.`;
}
