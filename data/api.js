const VERCEL_ENDPOINT = 'TUA_URL_VERCEL/api/proxy'; 

async function callAI(code, lang, action, outElement) {
    
    outElement.innerHTML = `<span class="warning">Processing...</span> <div class="loading"></div>`;

    try {
        const response = await fetch(VERCEL_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, lang, action }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "Backend failed without specific message.");
        }

        return { response: data.response };

    } catch (error) {
        return `Backend now is unreachable. Please try again later.`;
    }
}
