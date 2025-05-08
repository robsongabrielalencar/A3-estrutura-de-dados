const mazeSize = 15;
let maze = [];
let playerPosition = { x: 0, y: 0 };
let moves = 0;
let startTime;
let gameInterval;

const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');
const cellSize = canvas.width / mazeSize;

let isSolving = false; // novo controle para interrupção


function generateMaze() {
    // Inicializa todas as células como parede
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

    // Começa da célula (1,1) para deixar a borda intacta
    carve(1, 1);

    // Garante entrada acessível
    maze[0][0] = 0;
    if (maze[0][1] === 1 && maze[1][0] === 1) {
        maze[0][1] = 0; // abre um dos lados
    }

    // Garante saída acessível
    maze[mazeSize - 1][mazeSize - 1] = 0;
    const adjacents = [
        [mazeSize - 2, mazeSize - 1],
        [mazeSize - 1, mazeSize - 2]
    ];
    if (adjacents.every(([y, x]) => maze[y][x] === 1)) {
        maze[mazeSize - 1][mazeSize - 2] = 0;
    }
}



function renderMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            // Preencher célula com cor apropriada
            if (maze[i][j] === 1) {
                ctx.fillStyle = 'black'; // Parede
            } else {
                ctx.fillStyle = 'white'; // Caminho
            }
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }

    // Linha de chegada em vermelho
    ctx.fillStyle = 'red';
    ctx.fillRect((mazeSize - 1) * cellSize, (mazeSize - 1) * cellSize, cellSize, cellSize);

    // Jogador como um círculo azul escuro
    ctx.fillStyle = 'darkblue';
    ctx.beginPath();
    ctx.arc(
        playerPosition.x * cellSize + cellSize / 2,
        playerPosition.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Grade do labirinto
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= mazeSize; i++) {
        // Linhas horizontais
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();

        // Linhas verticais
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
    }
}



function movePlayer(direction) {
    if (!startTime) startTime = Date.now(); // <-- Evita NaN na primeira jogada

    let dx = 0;
    let dy = 0;

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
        renderMaze();
        checkForVictory();
    }
}

function checkForVictory() {
    if (playerPosition.x === mazeSize - 1 && playerPosition.y === mazeSize - 1) {
        const endTime = Date.now();
        const elapsedTime = ((endTime - startTime) / 1000).toFixed(2);

        alert(`Parabéns! Você completou o labirinto em ${elapsedTime}s com ${moves} movimentos.`);

        // Reinicia o jogo automaticamente
        restartGame();
    }
}


function startAutoSolve() {
    const autoBtn = document.getElementById('startAutoBtn');
    autoBtn.disabled = true; // Desativa o botão
    isSolving = true;
    moves = 0;
    playerPosition = { x: 0, y: 0 };
    startTime = Date.now();
    const visited = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(false));
    const path = [];

    const delay = 200;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

        async function solve(x, y) {
        if (!isSolving) return false;
        if (x < 0 || y < 0 || x >= mazeSize || y >= mazeSize) return false;
        if (maze[y][x] !== 0 || visited[y][x]) return false;

        visited[y][x] = true;
        playerPosition = { x, y };
        renderMaze();
        await sleep(delay);

        if (!isSolving) return false; // Verificação após sleep

        if (x === mazeSize - 1 && y === mazeSize - 1) {
            path.push({ x, y });
            return true;
        }

        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];

        for (const { dx, dy } of directions) {
            if (!isSolving) return false; // Interrompe antes de chamada recursiva
            if (await solve(x + dx, y + dy)) {
                if (!isSolving) return false; // Interrompe retorno de sucesso
                path.push({ x, y });
                return true;
            }
        }

        playerPosition = { x, y };
        renderMaze();
        await sleep(delay);

        if (!isSolving) return false; // Verificação após backtrack

        return false;
    }


    solve(0, 0).then((solved) => {
        if (solved && isSolving) {
            path.reverse();
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
            const message = `Parabéns! O bot completou o labirinto em ${elapsedTime}s com ${path.length} movimentos.`;
            document.getElementById('status').innerText = message;
            alert(message);
        }
        isSolving = false;
        autoBtn.disabled = false; // Reativa o botão
        restartGame();
    });
}



function restartGame() {
    isSolving = false; // Interrompe a execução automática

    const autoBtn = document.getElementById('startAutoBtn');
    if (autoBtn) autoBtn.disabled = false; // Reativa o botão, se estiver desativado

    playerPosition = { x: 0, y: 0 };
    moves = 0;
    document.getElementById('status').innerText = '';
    generateMaze();
    renderMaze();
    startTime = null;
}


generateMaze();
renderMaze();
