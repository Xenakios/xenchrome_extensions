const elements = {
    inv: document.getElementById('invertToggle'),
    con: document.getElementById('contrastSlider'),
    pit: document.getElementById('pitchToggle'),
    conDisp: document.getElementById('conVal')
};

// 1. Load saved settings when popup opens
chrome.storage.local.get(['invert', 'contrast', 'pitch'], (data) => {
    if (data.invert !== undefined) elements.inv.checked = data.invert;
    if (data.contrast !== undefined) {
        elements.con.value = data.contrast;
        elements.conDisp.innerText = data.contrast;
    }
    if (data.pitch !== undefined) elements.pit.checked = data.pitch;
});

function updateVideo() {
    const settings = {
        invert: elements.inv.checked,
        contrast: elements.con.value,
        pitch: elements.pit.checked
    };

    elements.conDisp.innerText = settings.contrast;
    chrome.storage.local.set(settings);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (s) => {
                const v = document.querySelector('video');
                if (v) {
                    // Apply Video Filter
                    const inv = s.invert ? 'invert(1) grayscale(1)' : '';
                    v.style.filter = `${inv} contrast(${s.contrast})`;

                    // Apply Audio Logic (preservesPitch is usually true by default)
                    // If "Tape Mode" is ON, we set preservesPitch to FALSE.
                    v.preservesPitch = !s.pitch;
                }
            },
            args: [settings]
        });
    });
}

elements.inv.addEventListener('change', updateVideo);
elements.con.addEventListener('input', updateVideo);
elements.pit.addEventListener('change', updateVideo);
