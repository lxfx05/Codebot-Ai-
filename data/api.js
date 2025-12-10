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

    let lastError = null;

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
                const errorMessage = data.error?.message || data.statusText || 'Unknown failure.';
                throw new Error(errorMessage);
            }

            const text = data.choices[0]?.message?.content;

            if (text && text.trim().length > 0) {
                return { response: text, source: provider.name };
            }

        } catch (error) {
            lastError = `${provider.name}: ${error.message}`;
        }
    }
    
    return `Backend now is unreachable, so try again later... Last error: ${lastError}`;
}
