// Corrigido: controle de temporizador para evitar valores incorretos

let mazeSize = 30;
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moves = 0;
let startTime = null;
let timerInterval = null;
let isSolving = false;

const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
let cellSize = canvas.width / mazeSize;

function generateMaze() {
    maze = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(1));

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function carve(x, y) {
        maze[y][x] = 0;
        const directions = shuffle([
            { dx: 0, dy: -2 },
            { dx: 2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }
        ]);
        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (ny > 0 && ny < mazeSize && nx > 0 && nx < mazeSize && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);
    maze[0][0] = 0;
    if (maze[0][1] === 1 && maze[1][0] === 1) maze[0][1] = 0;
    maze[mazeSize - 1][mazeSize - 1] = 0;
    const adjacents = [
        [mazeSize - 2, mazeSize - 1],
        [mazeSize - 1, mazeSize - 2]
    ];
    if (adjacents.every(([y, x]) => maze[y][x] === 1)) maze[mazeSize - 1][mazeSize - 2] = 0;
}

function renderMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            if (maze[i][j] === 1) {
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
            } else {
                ctx.fillStyle = '#000000';
                ctx.shadowBlur = 0;
            }
            ctx.strokeStyle = '#444';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 5;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.fillRect((mazeSize - 1) * cellSize, (mazeSize - 1) * cellSize, cellSize, cellSize);
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(
        playerPosition.x * cellSize + cellSize / 2,
        playerPosition.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= mazeSize; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
    }
}

function movePlayer(direction) {
    if (!startTime) {
        startTime = Date.now();
        startTimer();
    }
    let dx = 0, dy = 0;
    switch (direction) {
        case 'up': dy = -1; break;
        case 'down': dy = 1; break;
        case 'left': dx = -1; break;
        case 'right': dx = 1; break;
    }
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;
    if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && maze[newY][newX] === 0) {
        playerPosition.x = newX;
        playerPosition.y = newY;
        moves++;
        updateMoveCounter();
        renderMaze();
        checkForVictory();
    }
}

function checkForVictory() {
    if (playerPosition.x === mazeSize - 1 && playerPosition.y === mazeSize - 1) {
        setTimeout(() => {
            stopTimer();
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
            alert(`Parabéns! Você completou o labirinto em ${elapsedTime}s com ${moves} movimentos.`);
            restartGame();
        }, 100);
    }
}

function updateMazeSize() {
    const input = document.getElementById('mazeSizeInput');
    const newSize = parseInt(input.value, 10);
    if (isNaN(newSize) || newSize < 5 || newSize > 100) {
        alert("Por favor, insira um valor entre 5 e 100.");
        return;
    }
    mazeSize = newSize;
    cellSize = canvas.width / mazeSize;
    restartGame();
}

function toggleArrowButtons(disabled) {
    document.querySelectorAll('.arrow').forEach(btn => btn.disabled = disabled);
}

function startAutoSolve() {
    const autoBtn = document.getElementById('startAutoBtn');
    autoBtn.disabled = true;
    toggleArrowButtons(true);
    isSolving = true;
    moves = 0;
    updateMoveCounter();
    startTime = Date.now();
    startTimer();
    playerPosition = { x: 0, y: 0 };
    const visited = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(false));
    const path = [];
    function solve(x, y) {
        if (!isSolving || x < 0 || x >= mazeSize || y < 0 || y >= mazeSize || maze[y][x] === 1 || visited[y][x]) return false;
        visited[y][x] = true;
        path.push({ x, y });
        if (x === mazeSize - 1 && y === mazeSize - 1) return true;
        const directions = [ { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 } ];
        for (const { dx, dy } of directions) {
            if (solve(x + dx, y + dy)) return true;
        }
        path.push({ x, y });
        return false;
    }
    solve(0, 0);
    let step = 0;
    const delay = 150;
    const interval = setInterval(() => {
        if (!isSolving || step >= path.length) {
            clearInterval(interval);
            stopTimer();
            if (isSolving && step >= path.length) {
                const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
                const message = `Parabéns! O bot completou o labirinto em ${elapsedTime}s com ${moves} movimentos.`;
                document.getElementById('status').innerText = message;
                alert(message);
            }
            isSolving = false;
            autoBtn.disabled = false;
            toggleArrowButtons(false);
            restartGame();
            return;
        }
        playerPosition = { x: path[step].x, y: path[step].y };
        moves++;
        updateMoveCounter();
        renderMaze();
        step++;
    }, delay);
}

function restartGame() {
    isSolving = false;
    stopTimer();
    startTime = null;
    const autoBtn = document.getElementById('startAutoBtn');
    if (autoBtn) autoBtn.disabled = false;
    toggleArrowButtons(false);
    playerPosition = { x: 0, y: 0 };
    moves = 0;
    document.getElementById('status').innerText = '';
    document.getElementById('move-counter').textContent = '0';
    document.getElementById('timer').textContent = '0.00';
    generateMaze();
    renderMaze();
}

function updateMoveCounter() {
    const moveEl = document.getElementById('move-counter');
    if (moveEl) moveEl.textContent = moves;
}

function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = elapsed;
    }, 100);
}

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

document.addEventListener('keydown', function (e) {
    if (isSolving) return;
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer('up'); break;
        case 'ArrowDown': case 's': case 'S': movePlayer('down'); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer('left'); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer('right'); break;
    }
});

generateMaze();
renderMaze();