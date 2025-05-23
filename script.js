let mazeSize = 30;
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moves = 0;
let startTime = null;
let timerInterval = null;
let isSolving = false;

const canvas = document.getElementById('maze');
const context = canvas.getContext('2d');
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            if (maze[i][j] === 1) {
                context.fillStyle = '#00ffff';
                context.shadowColor = '#00ffff';
                context.shadowBlur = 10;
            } else {
                context.fillStyle = '#000000';
                context.shadowBlur = 0;
            }
            context.strokeStyle = '#444';
            context.shadowColor = '#00ffff';
            context.shadowBlur = 5;
            context.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
    context.fillStyle = '#ffff00';
    context.shadowColor = '#ffff00';
    context.shadowBlur = 15;
    context.fillRect((mazeSize - 1) * cellSize, (mazeSize - 1) * cellSize, cellSize, cellSize);
    context.fillStyle = '#ff00ff';
    context.shadowColor = '#ff00ff';
    context.shadowBlur = 15;
    context.beginPath();
    context.arc(
        playerPosition.x * cellSize + cellSize / 2,
        playerPosition.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
    );
    context.fill();
    context.strokeStyle = '#222';
    context.lineWidth = 1;
    for (let i = 0; i <= mazeSize; i++) {
        context.beginPath();
        context.moveTo(0, i * cellSize);
        context.lineTo(canvas.width, i * cellSize);
        context.stroke();
        context.beginPath();
        context.moveTo(i * cellSize, 0);
        context.lineTo(i * cellSize, canvas.height);
        context.stroke();
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
        stopTimer();
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        const victoryMessage = `Parabéns! Você completou o labirinto em ${elapsedTime}s com ${moves} movimentos!`;
        showVictoryMessage(victoryMessage); // NÃO chama restartGame() aqui
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
    const fullPath = [];

    function solve(x, y) {
        if (!isSolving || x < 0 || x >= mazeSize || y < 0 || y >= mazeSize || maze[y][x] === 1 || visited[y][x]) return false;

        visited[y][x] = true;
        fullPath.push({ x, y }); // Marca tentativa
        path.push({ x, y });

        if (x === mazeSize - 1 && y === mazeSize - 1) return true;

        const directions = [ { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 } ];

        for (const { dx, dy } of directions) {
            if (solve(x + dx, y + dy)) return true;
        }

        path.pop();
        fullPath.push({ x, y }); // Marca retrocesso visual
        return false;
    }

    solve(0, 0);

    let step = 0;
    const delay = 150;

    const interval = setInterval(() => {
        if (!isSolving || step >= fullPath.length) {
            clearInterval(interval);
            stopTimer();

            if (isSolving && step >= fullPath.length) {
                const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
                const message = `O bot completou o labirinto em ${elapsedTime}s com ${moves} movimentos!`;
                showVictoryMessage(message);
            }

            isSolving = false;
            autoBtn.disabled = false;
            toggleArrowButtons(false);
            return;
        }

        const currentStep = fullPath[step];
        playerPosition = { x: currentStep.x, y: currentStep.y };
        moves++;
        updateMoveCounter();
        renderMaze();
        step++;
    }, delay);
}



function toggleAllButtons(disabled) {
  document.querySelectorAll('button').forEach(btn => {
    btn.disabled = disabled;
  });
}

function showVictoryMessage(message) {
  const messageDiv = document.getElementById('victory-message');
  const blocker = document.getElementById('interaction-blocker');

  messageDiv.textContent = message;
  messageDiv.style.display = 'block';

  toggleAllButtons(true);
  blocker.style.display = 'block';

  function blockKeyboard(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  window.addEventListener('keydown', blockKeyboard, true);

  // Mantém a bolinha na linha de chegada por 5 segundos
  setTimeout(() => {
    messageDiv.style.display = 'none';
    toggleAllButtons(false);
    blocker.style.display = 'none';
    window.removeEventListener('keydown', blockKeyboard, true);

    // Só agora reinicia o jogo e move a bolinha de volta
    restartGame();
  }, 5000);
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