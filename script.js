
const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const shareButton = document.getElementById('share');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const ctx = canvas.getContext('2d');
let head = document.getElementById('head');


setTimeout(() => {
    head.innerHTML = " ";
}, 3000);

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.width = window.innerWidth - canvasOffsetX;
canvas.height = window.innerHeight - canvasOffsetY;

let isPainting = false;
let lineWidth = 5;
let startX;
let startY;

let undoStack = [];
let redoStack = [];

// Save the current state of the canvas
function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = []; // Clear the redo stack on new action
    updateButtons();
}

// Undo function
function undo() {
    if (undoStack.length === 0) return;

    redoStack.push(canvas.toDataURL()); // Save current state for redo
    const previousState = undoStack.pop();

    const img = new Image();
    img.src = previousState;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };

    updateButtons();
}

// Redo function
function redo() {
    if (redoStack.length === 0) return;

    undoStack.push(canvas.toDataURL()); // Save current state for undo
    const nextState = redoStack.pop();

    const img = new Image();
    img.src = nextState;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };

    updateButtons();
}

// Update the state of the undo and redo buttons
function updateButtons() {
    undoButton.disabled = undoStack.length === 0;
    redoButton.disabled = redoStack.length === 0;
}

// Drawing function
const draw = (e) => {
    if (!isPainting) return;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    let x, y;
    if (e.touches) {
        x = e.touches[0].clientX - canvasOffsetX;
        y = e.touches[0].clientY - canvasOffsetY;
    } else {
        x = e.clientX - canvasOffsetX;
        y = e.clientY - canvasOffsetY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
}

// Event listeners for drawing
canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    startX = e.clientX;
    startY = e.clientY;
    ctx.beginPath();
    saveState(); // Save state when starting a new action
});

canvas.addEventListener('mouseup', () => {
    isPainting = false;
    ctx.beginPath();
});

canvas.addEventListener('mousemove', draw);

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isPainting = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    ctx.beginPath();
    saveState();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isPainting = false;
    ctx.beginPath();
});

canvas.addEventListener('touchmove', draw);

// Toolbar actions
toolbar.addEventListener('click', (e) => {
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
    }
});

toolbar.addEventListener('change', (e) => {
    if (e.target.id === 'stroke') {
        ctx.strokeStyle = e.target.value;
    }

    if (e.target.id === 'lineWidth') {
        lineWidth = e.target.value;
    }
});

// Undo/Redo button actions
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

shareButton.addEventListener('click', async () => {
    // Ensure the canvas has a white background
    const ctx = canvas.getContext('2d');
    ctx.save(); // Save the current canvas state
    ctx.globalCompositeOperation = 'destination-over'; // Draw background below existing content
    ctx.fillStyle = 'white'; // Set the background color to white
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas
    ctx.restore(); // Restore the canvas state

    const dataUrl = canvas.toDataURL();
    const blob = await (await fetch(dataUrl)).blob();
    const filesArray = [
        new File([blob], 'drawing.png', {
            type: blob.type,
            lastModified: new Date().getTime(),
        }),
    ];
    const shareData = { files: filesArray };

    if (navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            console.log('Drawing shared successfully');
        } catch (err) {
            console.error('Error sharing drawing:', err);
        }
    } else {
        console.warn('Sharing not supported on this browser');
    }
});
