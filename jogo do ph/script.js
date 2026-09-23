/* ===================================================
   FORTUNE TIGER SLOTS - JAVASCRIPT PURO
   Código limpo, com multiplicadores e apostas ajustáveis!
   =================================================== */

// Símbolos temáticos inspirados no Fortune Tiger
const SIMBOLOS = ['🐯', '🪙', '🧧', '💎', '🔔', '🍊'];

// Multiplicadores para 3 símbolos iguais (Trinca)
const MULTIPLICADORES = {
  '🐯': 50, // Tigre da Sorte (Jackpot Máximo: 50x)
  '🪙': 30, // Lingote de Ouro (30x)
  '🧧': 20, // Envelope Vermelho (20x)
  '💎': 15, // Diamante Celestial (15x)
  '🔔': 10, // Sino Dourado (10x)
  '🍊': 5   // Tangerina da Fortuna (5x)
};

const MULTIPLICADOR_DUPLA = 1.5; // Multiplicador para 2 símbolos iguais

// Opções de valores de aposta
const VALORES_APOSTA = [10, 25, 50, 100, 250, 500];

// Estado do Jogo
let saldo = 1000;
let apostaAtual = 10;
let estaGirando = false;
let somAtivo = true;

// Elementos do DOM
const balanceEl = document.getElementById('balance');
const currentBetEl = document.getElementById('current-bet-display');
const lastWinEl = document.getElementById('last-win');
const messageEl = document.getElementById('message-bar');
const spinBtn = document.getElementById('spin-btn');
const spinSubTextEl = document.getElementById('spin-sub-text');
const resetBtn = document.getElementById('reset-btn');
const soundBtn = document.getElementById('sound-btn');

const betMinusBtn = document.getElementById('bet-minus-btn');
const betPlusBtn = document.getElementById('bet-plus-btn');
const betChips = document.querySelectorAll('.bet-chip');

const reel1El = document.getElementById('reel1');
const reel2El = document.getElementById('reel2');
const reel3El = document.getElementById('reel3');

const reelBoxes = document.querySelectorAll('.reel-box');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

/* ===================================================
   1. SISTEMA DE SOM SINTETIZADO (Web Audio API)
   =================================================== */
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function tocarSom(tipo) {
  if (!somAtivo) return;
  try {
    const actx = getAudioContext();

    if (tipo === 'click') {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.frequency.setValueAtTime(450, actx.currentTime);
      gain.gain.setValueAtTime(0.08, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.04);
    } 
    else if (tipo === 'bet') {
      // Som ao alterar o valor da aposta
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, actx.currentTime);
      gain.gain.setValueAtTime(0.1, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.06);
    }
    else if (tipo === 'stop') {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, actx.currentTime);
      gain.gain.setValueAtTime(0.12, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.07);
    } 
    else if (tipo === 'win') {
      // Fanfarra festiva oriental alegre
      const notas = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notas.forEach((nota, i) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(nota, actx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.2, actx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + i * 0.09 + 0.22);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(actx.currentTime + i * 0.09);
        osc.stop(actx.currentTime + i * 0.09 + 0.22);
      });
    }
  } catch (e) {
    console.warn('Áudio não suportado ou bloqueado:', e);
  }
}

/* ===================================================
   2. CONTROLE DE APOSTAS
   =================================================== */
function definirAposta(novoValor) {
  if (estaGirando) return;

  apostaAtual = novoValor;
  currentBetEl.textContent = apostaAtual;
  spinSubTextEl.textContent = `APOSTA: ${apostaAtual} 🪙`;

  // Atualiza destaque visual dos botões de aposta
  betChips.forEach(chip => {
    const valorChip = parseInt(chip.getAttribute('data-bet'), 10);
    if (valorChip === apostaAtual) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  tocarSom('bet');
}

function alterarApostaPorPasso(direcao) {
  if (estaGirando) return;

  const indiceAtual = VALORES_APOSTA.indexOf(apostaAtual);
  let novoIndice = indiceAtual + direcao;

  if (novoIndice >= 0 && novoIndice < VALORES_APOSTA.length) {
    definirAposta(VALORES_APOSTA[novoIndice]);
  }
}

/* ===================================================
   3. MECÂNICA DE GIRO DOS ROLOS
   =================================================== */
function sortearSimbolo() {
  const indice = Math.floor(Math.random() * SIMBOLOS.length);
  return SIMBOLOS[indice];
}

function girar() {
  if (estaGirando) return;

  // Validação: Saldo suficiente para a aposta selecionada
  if (saldo < apostaAtual) {
    if (saldo >= 10) {
      messageEl.textContent = `⚠️ Saldo insuficiente para ${apostaAtual} 🪙. Escolha uma aposta menor!`;
      messageEl.className = 'message-bar';
    } else {
      messageEl.textContent = '❌ Moedas esgotadas! Clique em RECOMEÇAR.';
      messageEl.className = 'message-bar';
      resetBtn.classList.remove('hidden');
    }
    return;
  }

  // Deduz o valor da aposta atual
  saldo -= apostaAtual;
  balanceEl.textContent = saldo;
  estaGirando = true;
  spinBtn.disabled = true;

  // Limpa estados e rolos premiados anteriores
  messageEl.className = 'message-bar';
  messageEl.textContent = `🐯 Girando com aposta de ${apostaAtual} moedas... Boa sorte!`;
  reelBoxes.forEach(box => box.classList.remove('winner'));

  tocarSom('click');

  // Ativa efeito de rotação visual rápida
  reel1El.classList.add('spinning');
  reel2El.classList.add('spinning');
  reel3El.classList.add('spinning');

  // Alterna símbolos rapidamente criando o efeito de roleta
  const intervaloGiro = setInterval(() => {
    reel1El.textContent = sortearSimbolo();
    reel2El.textContent = sortearSimbolo();
    reel3El.textContent = sortearSimbolo();
    tocarSom('click');
  }, 70);

  // Parada sequencial e cadenciada dos rolos (Suspense)
  // Rolo 1 para aos 850ms
  setTimeout(() => {
    reel1El.classList.remove('spinning');
    reel1El.textContent = sortearSimbolo();
    tocarSom('stop');
  }, 850);

  // Rolo 2 para aos 1250ms
  setTimeout(() => {
    reel2El.classList.remove('spinning');
    reel2El.textContent = sortearSimbolo();
    tocarSom('stop');
  }, 1250);

  // Rolo 3 para aos 1650ms e encerra a rodada
  setTimeout(() => {
    clearInterval(intervaloGiro);
    reel3El.classList.remove('spinning');
    reel3El.textContent = sortearSimbolo();
    tocarSom('stop');

    // Analisa o resultado obtido
    verificarResultado(reel1El.textContent, reel2El.textContent, reel3El.textContent);

    estaGirando = false;
    spinBtn.disabled = false;

    // Se o saldo for inferior à aposta mínima (10), ativa botão para recomeçar
    if (saldo < 10) {
      resetBtn.classList.remove('hidden');
    }
  }, 1650);
}

/* ===================================================
   4. VERIFICAÇÃO DE VITÓRIAS E MULTIPLICADORES
   =================================================== */
function verificarResultado(s1, s2, s3) {
  let ganho = 0;
  let mensagem = '';

  // Caso 1: 3 símbolos iguais (Trinca / Grande Vitória)
  if (s1 === s2 && s2 === s3) {
    const multi = MULTIPLICADORES[s1] || 10;
    ganho = Math.floor(apostaAtual * multi);
    
    if (s1 === '🐯') {
      mensagem = `🔥 MEGA JACKPOT DO TIGRINHO! (${multi}x) +${ganho} MOEDAS! 🔥`;
    } else {
      mensagem = `🎉 GRANDE VITÓRIA! TRINCA DE ${s1}! (${multi}x) +${ganho} MOEDAS!`;
    }

    reelBoxes.forEach(box => box.classList.add('winner'));
  }
  // Caso 2: 2 símbolos iguais (Dupla)
  else if (s1 === s2 || s2 === s3 || s1 === s3) {
    ganho = Math.floor(apostaAtual * MULTIPLICADOR_DUPLA);
    mensagem = `✨ BOA! 2 SÍMBOLOS IGUAIS! (1.5x) +${ganho} MOEDAS!`;

    // Destaca os rolos que combinaram
    if (s1 === s2) {
      reelBoxes[0].classList.add('winner');
      reelBoxes[1].classList.add('winner');
    } else if (s2 === s3) {
      reelBoxes[1].classList.add('winner');
      reelBoxes[2].classList.add('winner');
    } else if (s1 === s3) {
      reelBoxes[0].classList.add('winner');
      reelBoxes[2].classList.add('winner');
    }
  }

  // Processa o pagamento
  if (ganho > 0) {
    saldo += ganho;
    balanceEl.textContent = saldo;
    lastWinEl.textContent = ganho;
    messageEl.textContent = mensagem;
    messageEl.className = 'message-bar win';
    tocarSom('win');
    dispararConfetes();
  } else {
    lastWinEl.textContent = 0;
    messageEl.textContent = '🐯 O Tigrinho continua com você! Gire novamente!';
    messageEl.className = 'message-bar';
  }
}

/* ===================================================
   5. RECOMEÇAR JOGO (Restaura Saldo)
   =================================================== */
function recomecar() {
  saldo = 1000;
  definirAposta(10);
  balanceEl.textContent = saldo;
  lastWinEl.textContent = 0;
  messageEl.textContent = '🐯 Saldo restaurado! Boa sorte!';
  messageEl.className = 'message-bar';
  resetBtn.classList.add('hidden');
  reelBoxes.forEach(box => box.classList.remove('winner'));
  tocarSom('click');
}

/* ===================================================
   6. ANIMAÇÃO DE CONFETES NO CANVAS
   =================================================== */
let confetes = [];
let animandoConfetes = false;

function redimensionarCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionarCanvas);
redimensionarCanvas();

function dispararConfetes() {
  confetes = [];
  const cores = ['#ffd700', '#ff0055', '#06d6a0', '#ff9e00', '#ffffff', '#ff3366'];

  for (let i = 0; i < 90; i++) {
    confetes.push({
      x: canvas.width / 2 + (Math.random() * 240 - 120),
      y: canvas.height / 2 - 60,
      raio: Math.random() * 6 + 4,
      cor: cores[Math.floor(Math.random() * cores.length)],
      velocidadeX: (Math.random() - 0.5) * 14,
      velocidadeY: Math.random() * -12 - 4,
      gravidade: 0.35,
      rotacao: Math.random() * 360,
      velRotacao: (Math.random() - 0.5) * 10,
      opacidade: 1
    });
  }

  if (!animandoConfetes) {
    animandoConfetes = true;
    requestAnimationFrame(atualizarConfetes);
  }
}

function atualizarConfetes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let aindaVisiveis = false;

  confetes.forEach(p => {
    p.velocidadeY += p.gravidade;
    p.x += p.velocidadeX;
    p.y += p.velocidadeY;
    p.rotacao += p.velRotacao;
    p.opacidade -= 0.007;

    if (p.opacidade > 0) {
      aindaVisiveis = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotacao * Math.PI) / 180);
      ctx.globalAlpha = Math.max(p.opacidade, 0);
      ctx.fillStyle = p.cor;
      ctx.fillRect(-p.raio, -p.raio, p.raio * 2, p.raio * 1.5);
      ctx.restore();
    }
  });

  if (aindaVisiveis) {
    requestAnimationFrame(atualizarConfetes);
  } else {
    animandoConfetes = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/* ===================================================
   7. EVENTOS E INTERAÇÃO
   =================================================== */
spinBtn.addEventListener('click', girar);
resetBtn.addEventListener('click', recomecar);

// Botões de diminuir / aumentar aposta
betMinusBtn.addEventListener('click', () => alterarApostaPorPasso(-1));
betPlusBtn.addEventListener('click', () => alterarApostaPorPasso(1));

// Botões rápidos de aposta (10, 25, 50, 100, 250, MÁX)
betChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const valor = parseInt(chip.getAttribute('data-bet'), 10);
    definirAposta(valor);
  });
});

// Atalho: Barra de Espaço para girar
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !estaGirando) {
    e.preventDefault();
    girar();
  }
});

// Ativar / Desativar som
soundBtn.addEventListener('click', () => {
  somAtivo = !somAtivo;
  soundBtn.textContent = somAtivo ? '🔊' : '🔇';
  soundBtn.title = somAtivo ? 'Desativar Som' : 'Ativar Som';
});
