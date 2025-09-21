window.AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();
const source = context.createBufferSource();
const analyser = context.createAnalyser();
analyser.fftSize = 2048;
const data = new Uint8Array(analyser.frequencyBinCount);

let canvas = document.querySelector('#main-canvas');
let ctx = canvas.getContext('2d');
ctx.canvas.width =  window.innerWidth - 10;
ctx.canvas.height = window.innerHeight - 10;

const decodeAudio = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
}

let buffer = null;
decodeAudio("https://corsproxy.io/?url=" + encodeURIComponent('https://audio-download.ngfiles.com/549000/549201_Lightforce-S.mp3')).then((b) => {
    buffer = b;
});

source.connect(analyser);
analyser.connect(context.destination);

function createSource() {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    analyser.connect(context.destination);
    return source;
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// our analyser will put frequency info into our data aray
	analyser.getByteFrequencyData(data);
	
	ctx.strokeStyle = `white`;
	ctx.beginPath();
	ctx.moveTo(0, canvas.height);
	
	for (let i = 0; i < data.length; i++) {
		// data[i] is the amplitude height
		// we normalize it like below:
		const value = data[i] / 1024;
		
		const y = canvas.height - canvas.height * value;

		ctx.lineTo(i, y);
	}
	
	ctx.stroke();
	
	requestAnimationFrame(draw);
}

let isPlaying = false;
let playbackStart = 0;
let pausedAt = 0;
let currentSource = null;

canvas.addEventListener('click', async () => {
	if (!buffer) return;
	if (!isPlaying) {
		if (context.state === 'suspended') {
			await context.resume();
		}
		currentSource = createSource();
		currentSource.start(0, pausedAt);
		playbackStart = context.currentTime - pausedAt;
		isPlaying = true;
		draw();
		currentSource.onended = () => {
			isPlaying = false;
			pausedAt = 0;
			currentSource = null;
		};
	} else {
		currentSource.stop();
		pausedAt = context.currentTime - playbackStart;
		currentSource = null;
		isPlaying = false;
	}
});
