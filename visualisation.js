let canvas = document.querySelector('#main-canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width = window.innerWidth - 10;
ctx.canvas.height = window.innerHeight - 10;

// audio context setup
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();
const analyser = context.createAnalyser();
analyser.fftSize = 2048;
const data = new Uint8Array(analyser.frequencyBinCount);

let buffer = null;
let source = null;
let startedAt;
let pausedAt;
let paused = true;

// decode audio
const decodeAudio = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
}

// load mp3
decodeAudio("https://corsproxy.io/?url=" + encodeURIComponent(
    'https://audio-download.ngfiles.com/549000/549201_Lightforce-S.mp3'
)).then((b) => {
    buffer = b;
});

// draw frequency
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    analyser.getByteFrequencyData(data);

    ctx.strokeStyle = `white`;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let i = 0; i < data.length; i++) {
        const value = data[i] / 256; // normalize
        const y = canvas.height - canvas.height * value;
        ctx.lineTo(i, y);
    }

    ctx.stroke();

    requestAnimationFrame(draw);
}

// play audio
function play() {
    source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    analyser.connect(context.destination);

    paused = false;

    if (pausedAt) {
        startedAt = Date.now() - pausedAt;
        source.start(0, pausedAt / 1000);
    } else {
        startedAt = Date.now();
        source.start(0);
    }

    draw();
}

// stop/pause audio
function stop() {
    if (source) {
        source.stop(0);
        pausedAt = Date.now() - startedAt;
        paused = true;
    }
}

// toggle play/pause on click
canvas.addEventListener('click', async () => {
    if (paused) {
        if (context.state === 'suspended') {
            await context.resume();
        }
        play();
    } else {
        stop();
    }
});