let tamanhoLabirinto = 30;
let labirinto = [];
let posicaoJogador = { x: 0, y: 0 };
let movimentos = 0;
let tempoInicio = null;
let intervaloTemporizador = null;
let resolvendo = false;

let visitadoPeloBot = [];

const canvas = document.getElementById('maze');
const context = canvas.getContext('2d');
let tamanhoCelula = canvas.width / tamanhoLabirinto;

function gerarLabirinto() {
    labirinto = Array.from({ length: tamanhoLabirinto }, () => Array(tamanhoLabirinto).fill(1));

    function randomizarOLabirinto(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function gerarCaminho (x, y) {
        labirinto[y][x] = 0;
        const direcoes = randomizarOLabirinto([
            { dx: 0, dy: -2 },
            { dx: 2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }
        ]);
        for (const { dx, dy } of direcoes) {
            const nx = x + dx;
            const ny = y + dy;
            if (ny > 0 && ny < tamanhoLabirinto && nx > 0 && nx < tamanhoLabirinto && labirinto[ny][nx] === 1) {
                labirinto[y + dy / 2][x + dx / 2] = 0;
                gerarCaminho (nx, ny);
            }
        }
    }

    gerarCaminho (1, 1);
    labirinto[0][0] = 0;
    if (labirinto[0][1] === 1 && labirinto[1][0] === 1) labirinto[0][1] = 0;
    labirinto[tamanhoLabirinto - 1][tamanhoLabirinto - 1] = 0;
    const adjacentes = [
        [tamanhoLabirinto - 2, tamanhoLabirinto - 1],
        [tamanhoLabirinto - 1, tamanhoLabirinto - 2]
    ];
    if (adjacentes.every(([y, x]) => labirinto[y][x] === 1)) labirinto[tamanhoLabirinto - 1][tamanhoLabirinto - 2] = 0;
}

function desenharLabirinto() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < tamanhoLabirinto; i++) {
        for (let j = 0; j < tamanhoLabirinto; j++) {
            if (labirinto[i][j] === 1) {
                context.fillStyle = '#00ffff';
                context.shadowColor = '#00ffff';
                context.shadowBlur = 10;
            } else if (visitadoPeloBot[i][j] === 'forward') {
                context.fillStyle = '#39FF14';
                context.shadowColor = '#39FF14';
                context.shadowBlur = 5;
            } else if (visitadoPeloBot[i][j] === 'back') {
                context.fillStyle = '#FFEF00';
                context.shadowColor = '#FFEF00';
                context.shadowBlur = 10;
            } else {
                context.fillStyle = '#000000';
                context.shadowBlur = 0;
            }
            context.strokeStyle = '#444';
            context.fillRect(j * tamanhoCelula, i * tamanhoCelula, tamanhoCelula, tamanhoCelula);
        }
    }

    context.fillStyle = '#ffff00';
    context.shadowColor = '#ffff00';
    context.shadowBlur = 15;
    context.fillRect((tamanhoLabirinto - 1) * tamanhoCelula, (tamanhoLabirinto - 1) * tamanhoCelula, tamanhoCelula, tamanhoCelula);

    context.fillStyle = '#ff00ff';
    context.shadowColor = '#ff00ff';
    context.shadowBlur = 15;
    context.beginPath();
    context.arc(
        posicaoJogador.x * tamanhoCelula + tamanhoCelula / 2,
        posicaoJogador.y * tamanhoCelula + tamanhoCelula / 2,
        tamanhoCelula / 3,
        0,
        Math.PI * 2
    );
    context.fill();

    context.strokeStyle = '#222';
    context.lineWidth = 1;
    for (let i = 0; i <= tamanhoLabirinto; i++) {
        context.beginPath();
        context.moveTo(0, i * tamanhoCelula);
        context.lineTo(canvas.width, i * tamanhoCelula);
        context.stroke();

        context.beginPath();
        context.moveTo(i * tamanhoCelula, 0);
        context.lineTo(i * tamanhoCelula, canvas.height);
        context.stroke();
    }
}

function moverJogador(direcao) {
    if (!tempoInicio) {
        tempoInicio = Date.now();
        iniciarTemporizador();
    }
    let dx = 0, dy = 0;
    switch (direcao) {
        case 'up': dy = -1; break;
        case 'down': dy = 1; break;
        case 'left': dx = -1; break;
        case 'right': dx = 1; break;
    }
    const novoX = posicaoJogador.x + dx;
    const novoY = posicaoJogador.y + dy;
    if (novoX >= 0 && novoX < tamanhoLabirinto && novoY >= 0 && novoY < tamanhoLabirinto && labirinto[novoY][novoX] === 0) {
        posicaoJogador.x = novoX;
        posicaoJogador.y = novoY;
        movimentos++;
        atualizarContadorMovimentos();
        desenharLabirinto();
        verificarVitoria();
    }
}

function verificarVitoria() {
    if (posicaoJogador.x === tamanhoLabirinto - 1 && posicaoJogador.y === tamanhoLabirinto - 1) {
        pararTemporizador();
        const tempoDecorrido = ((Date.now() - tempoInicio) / 1000).toFixed(2);
        const mensagemVitoria = `Parabéns! Você completou o labirinto em ${tempoDecorrido}s com ${movimentos} movimentos!`;
        mostrarMensagemVitoria(mensagemVitoria);
    }
}

function atualizarTamanhoLabirinto() {
    const entrada = document.getElementById('mazeSizeInput');
    const novoTamanho = parseInt(entrada.value, 10);
    if (isNaN(novoTamanho) || novoTamanho < 5 || novoTamanho > 100) {
        alert("Por favor, insira um valor entre 5 e 100.");
        return;
    }
    tamanhoLabirinto = novoTamanho;
    tamanhoCelula = canvas.width / tamanhoLabirinto;
    reiniciarJogo();
}

function alternarBotoesSetas(desabilitar) {
    document.querySelectorAll('.arrow').forEach(botao => botao.disabled = desabilitar);
}

function iniciarResolucaoAutomatica() {
    const botaoAuto = document.getElementById('startAutoBtn');
    botaoAuto.disabled = true;
    alternarBotoesSetas(true);
    resolvendo = true;
    movimentos = 0;
    atualizarContadorMovimentos();
    tempoInicio = Date.now();
    iniciarTemporizador();
    posicaoJogador = { x: 0, y: 0 };

    const visitado = Array.from({ length: tamanhoLabirinto }, () => Array(tamanhoLabirinto).fill(false));
    visitadoPeloBot = Array.from({ length: tamanhoLabirinto }, () => Array(tamanhoLabirinto).fill(null));
    const caminho = [];
    const caminhoCompleto = [];

    function resolver(x, y) {
        if (!resolvendo || x < 0 || x >= tamanhoLabirinto || y < 0 || y >= tamanhoLabirinto || labirinto[y][x] === 1 || visitado[y][x]) return false;

        visitado[y][x] = true;
        caminhoCompleto.push({ x, y, type: 'forward' });
        caminho.push({ x, y });

        if (x === tamanhoLabirinto - 1 && y === tamanhoLabirinto - 1) return true;

        const direcoes = [ { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 } ];

        for (const { dx, dy } of direcoes) {
            if (resolver(x + dx, y + dy)) return true;
        }

        caminho.pop();
        caminhoCompleto.push({ x, y, type: 'back' });
        return false;
    }

    resolver(0, 0);

    let passo = 0;
    const atraso = 150;

    const intervalo = setInterval(() => {
        if (!resolvendo || passo >= caminhoCompleto.length) {
            clearInterval(intervalo);
            pararTemporizador();

            if (resolvendo && passo >= caminhoCompleto.length) {
                const tempoDecorrido = ((Date.now() - tempoInicio) / 1000).toFixed(2);
                const mensagem = `O bot completou o labirinto em ${tempoDecorrido}s com ${movimentos} movimentos!`;
                mostrarMensagemVitoria(mensagem);
            }

            resolvendo = false;
            botaoAuto.disabled = false;
            alternarBotoesSetas(false);
            return;
        }

        const passoAtual = caminhoCompleto[passo];
        posicaoJogador = { x: passoAtual.x, y: passoAtual.y };

        visitadoPeloBot[passoAtual.y][passoAtual.x] = passoAtual.type;

        movimentos++;
        atualizarContadorMovimentos();
        desenharLabirinto();
        passo++;
    }, atraso);
}

function alternarTodosBotoes(desabilitar) {
    document.querySelectorAll('button').forEach(botao => {
        botao.disabled = desabilitar;
    });
}

function mostrarMensagemVitoria(mensagem) {
    const divMensagem = document.getElementById('victory-message');
    const bloqueador = document.getElementById('interaction-blocker');

    divMensagem.textContent = mensagem;
    divMensagem.style.display = 'block';

    alternarTodosBotoes(true);
    bloqueador.style.display = 'block';

    function bloquearTeclado(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    window.addEventListener('keydown', bloquearTeclado, true);

    setTimeout(() => {
        divMensagem.style.display = 'none';
        alternarTodosBotoes(false);
        bloqueador.style.display = 'none';
        window.removeEventListener('keydown', bloquearTeclado, true);
        reiniciarJogo();
    }, 5000);
}

function reiniciarJogo() {
    resolvendo = false;
    pararTemporizador();
    tempoInicio = null;
    const botaoAuto = document.getElementById('startAutoBtn');
    if (botaoAuto) botaoAuto.disabled = false;
    alternarBotoesSetas(false);
    posicaoJogador = { x: 0, y: 0 };
    movimentos = 0;
    document.getElementById('status').innerText = '';
    document.getElementById('move-counter').textContent = '0';
    document.getElementById('timer').textContent = '0.00';
    visitadoPeloBot = Array.from({ length: tamanhoLabirinto }, () => Array(tamanhoLabirinto).fill(null));
    gerarLabirinto();
    desenharLabirinto();
}

function atualizarContadorMovimentos() {
    const elementoMovimentos = document.getElementById('move-counter');
    if (elementoMovimentos) elementoMovimentos.textContent = movimentos;
}

function iniciarTemporizador() {
    pararTemporizador();
    intervaloTemporizador = setInterval(() => {
        const decorrido = ((Date.now() - tempoInicio) / 1000).toFixed(2);
        const elementoTemporizador = document.getElementById('timer');
        if (elementoTemporizador) elementoTemporizador.textContent = decorrido;
    }, 100);
}

function pararTemporizador() {
    if (intervaloTemporizador !== null) {
        clearInterval(intervaloTemporizador);
        intervaloTemporizador = null;
    }
}

document.addEventListener('keydown', function (e) {
    if (resolvendo) return;
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': moverJogador('up'); break;
        case 'ArrowDown': case 's': case 'S': moverJogador('down'); break;
        case 'ArrowLeft': case 'a': case 'A': moverJogador('left'); break;
        case 'ArrowRight': case 'd': case 'D': moverJogador('right'); break;
    }
});

window.addEventListener('DOMContentLoaded', function() {
    reiniciarJogo();
});
