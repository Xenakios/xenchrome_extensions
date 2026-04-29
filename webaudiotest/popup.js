document.getElementById('boostSlider').addEventListener('input', (e) => {
    const val = e.target.value;
    document.getElementById('boostVal').innerText = val + 'x';
    runAudioWork(val, 'boost');
});

document.getElementById('monoBtn').addEventListener('click', (e) => {
    const isActive = e.target.classList.toggle('active');
    e.target.innerText = `Mono Mode: ${isActive ? 'ON' : 'OFF'}`;
    runAudioWork(isActive, 'mono');
});

function runAudioWork(value, type) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (val, t) => {
                if (!window.myAudioCtx) {
                    const media = document.querySelector('video, audio');
                    if (!media) return;

                    window.myAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    window.source = window.myAudioCtx.createMediaElementSource(media);

                    // 1. Create Nodes
                    window.gainNode = window.myAudioCtx.createGain();

                    // We create a splitter and a merger to manipulate individual channels
                    window.splitter = window.myAudioCtx.createChannelSplitter(2);
                    window.merger = window.myAudioCtx.createChannelMerger(2);

                    // we could technically avoid creating this second gain node, i guess,
                    // but too much trouble to deal with that for now
                    window.gainNode2 = window.myAudioCtx.createGain();
                    // 2. Build the default Stereo path
                    window.source.connect(window.gainNode);

                    // Default connection: Gain -> Splitter -> Merger (L to L, R to R) -> Destination
                    window.gainNode.connect(window.splitter);
                    window.splitter.connect(window.merger, 0, 0); // Left to Left
                    window.splitter.connect(window.merger, 1, 1); // Right to Right
                    window.merger.connect(window.gainNode2);
                    window.gainNode2.connect(window.myAudioCtx.destination);
                }

                if (window.myAudioCtx.state === 'suspended') window.myAudioCtx.resume();

                if (t === 'boost') window.gainNode.gain.value = val;

                if (t === 'mono') {
                    // Disconnect the merger to rewire it
                    window.splitter.disconnect();

                    if (val === true) {
                        window.gainNode2.gain.value = 0.5;
                        window.splitter.connect(window.merger, 0, 0);
                        window.splitter.connect(window.merger, 0, 1);
                        window.splitter.connect(window.merger, 1, 0);
                        window.splitter.connect(window.merger, 1, 1);
                    } else {
                        // STEREO MODE: Back to normal
                        window.gainNode2.gain.value = 1.0;
                        window.splitter.connect(window.merger, 0, 0);
                        window.splitter.connect(window.merger, 1, 1);
                    }
                }
            },
            args: [value, type]
        });
    });
}