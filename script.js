// Initialize Lucide Icons
lucide.createIcons();

const dangerLevels = [
    { label: 'SAFE', color: 'text-green-400', desc: 'Wholesome results', hex: '#22c55e' },
    { label: 'EUCLID', color: 'text-yellow-400', desc: 'Slightly quirky', hex: '#eab308' },
    { label: 'KETER', color: 'text-orange-400', desc: 'Getting weird', hex: '#f97316' },
    { label: 'THAUMIEL', color: 'text-red-400', desc: 'Very edgy', hex: '#dc2626' },
    { label: 'APOLLYON', color: 'text-red-600', desc: 'Maximum chaos', hex: '#991b1b' }
];

// Elements
const urlInput = document.getElementById('urlInput');
const dangerRange = document.getElementById('dangerRange');
const dangerLabel = document.getElementById('dangerLabel');
const dangerDesc = document.getElementById('dangerDesc');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsArea = document.getElementById('resultsArea');
const scanlines = document.getElementById('scanlines');

// Setup Scanlines
for (let i = 0; i < 50; i++) {
    const line = document.createElement('div');
    line.className = 'scanline';
    scanlines.appendChild(line);
}

// Update UI based on range
dangerRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const level = dangerLevels[val];
    
    dangerLabel.textContent = level.label;
    dangerLabel.className = `text-2xl font-bold ${level.color}`;
    dangerDesc.textContent = level.desc;
    
    // Update slider background gradient
    const percentage = (val / 4) * 100;
    dangerRange.style.background = `linear-gradient(to right, ${level.hex} ${percentage}%, #292524 ${percentage}%)`;
});

// Main Analysis Logic
async function analyzeSite() {
    const url = urlInput.value;
    if (!url) return;

    const danger = dangerRange.value;
    
    // Set UI to Loading State
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '⚠ ANALYZING ⚠';
    analyzeBtn.classList.add('animate-pulse', 'bg-yellow-900', 'text-yellow-200');
    scanlines.style.display = 'block';
    resultsArea.classList.add('hidden');

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": "YOUR_API_KEY_HERE", // NOTE: Needs API Key
                "anthropic-version": "2023-06-01",
                "dangerously-allow-browser": "true" // For demo purposes only
            },
            body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `Given this URL: "${url}", suggest 3 similar websites or links. Danger level: ${danger}/4. Respond ONLY with valid JSON: {"sites": [{"name": "Site Name", "url": "https://example.com", "reason": "Why"}], "classification": "DESC", "warning": "WARN"}`
                }]
            })
        });

        const data = await response.json();
        const text = data.content[0].text;
        const parsed = JSON.parse(text);

        renderResults(parsed);
    } catch (err) {
        console.error(err);
        renderResults({
            sites: [],
            classification: "ERROR",
            warning: "Analysis failed. Ensure API key is valid and URL is correct."
        });
    } finally {
        // Reset UI State
        setTimeout(() => {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'INITIATE ANALYSIS';
            analyzeBtn.classList.remove('animate-pulse', 'bg-yellow-900', 'text-yellow-200');
            scanlines.style.display = 'none';
        }, 1000);
    }
}

function renderResults(data) {
    resultsArea.classList.remove('hidden');
    resultsArea.innerHTML = `
        <div class="mb-4 pb-4 border-b border-stone-800">
            <div class="text-xs text-stone-500 mb-1">CLASSIFICATION:</div>
            <div class="text-green-400 font-bold">${data.classification}</div>
        </div>
        ${data.warning ? `
            <div class="mb-6 p-4 bg-yellow-900/20 border border-yellow-700">
                <div class="text-xs text-yellow-400 mb-1">⚠ WARNING:</div>
                <div class="text-yellow-300 text-sm">${data.warning}</div>
            </div>
        ` : ''}
        <div class="text-xs text-stone-500 mb-3">SIMILAR ENTITIES DETECTED:</div>
        <div class="space-y-4">
            ${data.sites.map((site, i) => `
                <div class="border border-stone-800 p-4 hover:border-green-800 transition-colors">
                    <div class="flex items-start justify-between mb-2">
                        <div class="text-green-400 font-bold">SCP-████-${i + 1}</div>
                        <div class="text-xs text-stone-600">INSTANCE ${i + 1}/3</div>
                    </div>
                    <div class="text-white mb-2">${site.name}</div>
                    <a href="${site.url}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm break-all underline">
                        ${site.url}
                    </a>
                    <div class="mt-2 text-sm text-stone-400 italic">${site.reason}</div>
                </div>
            `).join('')}
        </div>
    `;
}

analyzeBtn.addEventListener('click', analyzeSite);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeSite();
});
