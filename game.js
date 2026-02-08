// Global game state
let gameState = {
  phase: 'idle', // idle, running, crashed
  multiplier: 1.0,
  startTime: null,
  crashPoint: null,
  crashTime: null,
  history: [],
  animationId: null,
  previousMultiplier: 1.0,
  lastUpdateTime: null,
  currentVolatility: null,
  trend: 1,             // +1 = up trend, -1 = down trend (never 0 / flat)
  trendChangeTime: null // when trend last flipped
};

let inventory = {};
let stats = {
  total: 0,
  bottles: 0,
  shirts: 0,
  decks: 0,
  fans: 0,
  lanyards: 0,
  stickers: 0
};

// Last 5 items won (for game page display)
const RECENT_WINS_MAX = 5;
let recentWins = [];

// Canvas and drawing
let canvas, ctx;
let graphData = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  loadInventory();
  loadStats();
  loadRecentWins();
  updateUI();
});

function initGame() {
  // Set society branding
  document.getElementById('society-name').textContent = CONFIG.society.name;
  document.getElementById('society-tagline').textContent = CONFIG.society.tagline;

  // Initialize canvas
  canvas = document.getElementById('game-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
    // Wait for DOM to be fully loaded before sizing
    setTimeout(() => {
      resizeCanvas();
    }, 100);
    window.addEventListener('resize', resizeCanvas);
  }

  // Home page: click prize card to show larger image
  const prizeGrid = document.getElementById('home-prize-grid');
  const lightbox = document.getElementById('prize-lightbox');
  if (prizeGrid && lightbox) {
    prizeGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.prize-card');
      if (!card) return;
      const img = card.querySelector('img');
      const nameEl = card.querySelector('.prize-name');
      const tierEl = card.querySelector('.prize-tier');
      if (img && nameEl && tierEl) {
        document.getElementById('prize-lightbox-img').src = img.src;
        document.getElementById('prize-lightbox-img').alt = img.alt;
        document.getElementById('prize-lightbox-name').textContent = nameEl.textContent;
        document.getElementById('prize-lightbox-tier').textContent = tierEl.textContent;
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
      }
    });
    function closePrizeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
    }
    lightbox.querySelector('.prize-lightbox-backdrop').addEventListener('click', closePrizeLightbox);
    lightbox.querySelector('.prize-lightbox-close').addEventListener('click', closePrizeLightbox);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closePrizeLightbox();
    });

  // Sticker icon rotation: cycle sticker1–3 every 2s
  applyStickerRotation();
  setInterval(advanceStickerRotation, 2000);

    // Enter key on focused prize card opens lightbox
    prizeGrid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.prize-card');
      if (!card) return;
      e.preventDefault();
      card.click();
    });
  }
}

function resizeCanvas() {
  if (!canvas) return;
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width || container.clientWidth || 800;
  canvas.height = rect.height || container.clientHeight || 400;
  console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
  drawGraph();
}

// Inventory Management
function loadInventory() {
  const saved = localStorage.getItem('crashGameInventory');
  if (saved) {
    inventory = JSON.parse(saved);
    // Merge in any new prize types from config (e.g. deck, shirt) with defaults
    Object.keys(CONFIG.inventory).forEach(key => {
      if (inventory[key] === undefined) {
        inventory[key] = CONFIG.inventory[key];
      }
    });
    saveInventory();
  } else {
    inventory = { ...CONFIG.inventory };
    saveInventory();
  }
}

function saveInventory() {
  localStorage.setItem('crashGameInventory', JSON.stringify(inventory));
  updateUI();
}

function loadStats() {
  const saved = localStorage.getItem('crashGameStats');
  if (saved) {
    stats = JSON.parse(saved);
  }
}

function saveStats() {
  localStorage.setItem('crashGameStats', JSON.stringify(stats));
}

function loadRecentWins() {
  const saved = localStorage.getItem('crashGameRecentWins');
  if (saved) {
    try {
      recentWins = JSON.parse(saved);
      if (!Array.isArray(recentWins)) recentWins = [];
    } catch (_) {
      recentWins = [];
    }
  } else {
    recentWins = [];
  }
}

function saveRecentWins() {
  localStorage.setItem('crashGameRecentWins', JSON.stringify(recentWins));
}

function addRecentWin(prize) {
  recentWins.unshift({
    type: prize.type,
    name: prize.name,
    image: prize.image
  });
  if (recentWins.length > RECENT_WINS_MAX) {
    recentWins = recentWins.slice(0, RECENT_WINS_MAX);
  }
  saveRecentWins();
}

function updateUI() {
  // Update "Last 5 won" on game screen (instead of remaining inventory)
  for (let i = 0; i < RECENT_WINS_MAX; i++) {
    const slot = document.getElementById('recent-win-' + i);
    if (!slot) continue;
    const img = slot.querySelector('.recent-win-img');
    const nameEl = slot.querySelector('.recent-win-name');
    const entry = recentWins[i];
    if (entry && img && nameEl) {
      img.alt = entry.name;
      img.style.display = '';
      if (entry.type === 'sticker') {
        img.classList.add('sticker-rotate');
        img.src = STICKER_IMAGES[stickerRotationIndex];
      } else {
        img.classList.remove('sticker-rotate');
        img.src = entry.image;
      }
      img.onerror = () => {
        img.src = `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23333%22 width=%2240%22 height=%2240%22 rx=%228%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22white%22%3E%3F%3C/text%3E%3C/svg%3E`;
      };
      nameEl.textContent = entry.name;
      slot.classList.remove('recent-win-empty');
    } else {
      if (img) {
        img.src = '';
        img.style.display = 'none';
        img.classList.remove('sticker-rotate');
      }
      if (nameEl) nameEl.textContent = '—';
      slot.classList.add('recent-win-empty');
    }
  }

  // Update admin panel
  if (document.getElementById('admin-bottle')) {
    document.getElementById('admin-bottle').value = inventory.bottle || 0;
    document.getElementById('admin-shirt').value = inventory.shirt || 0;
    document.getElementById('admin-deck').value = inventory.deck || 0;
    document.getElementById('admin-fan').value = inventory.fan || 0;
    document.getElementById('admin-lanyard').value = inventory.lanyard || 0;
    document.getElementById('admin-sticker').value = inventory.sticker || 0;
  }

  // Update stats
  if (document.getElementById('stat-total')) {
    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-bottles').textContent = stats.bottles || 0;
    document.getElementById('stat-shirts').textContent = stats.shirts || 0;
    document.getElementById('stat-decks').textContent = stats.decks || 0;
    document.getElementById('stat-fans').textContent = stats.fans || 0;
    document.getElementById('stat-lanyards').textContent = stats.lanyards || 0;
    document.getElementById('stat-stickers').textContent = stats.stickers || 0;
  }
}

// Screen Navigation
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function startGame() {
  showScreen('game-screen');
  resetGame();
}

function returnHome() {
  showScreen('welcome-screen');
  resetGame();
}

function playAgain() {
  showScreen('game-screen');
  resetGame();
}

function showAdmin() {
  showScreen('admin-screen');
  updateUI();
}

function closeAdmin() {
  showScreen('welcome-screen');
}

// Game Logic
function resetGame() {
  if (gameState.animationId) {
    cancelAnimationFrame(gameState.animationId);
  }

  gameState = {
    phase: 'idle',
    multiplier: 1.0,
    startTime: null,
    crashPoint: null,
    crashTime: null,
    history: [],
    animationId: null,
    previousMultiplier: 1.0,
    lastUpdateTime: null,
    currentVolatility: null,
    trend: 1,
    trendChangeTime: null
  };

  graphData = [];
  
  const crashOverlay = document.getElementById('crash-overlay');
  if (crashOverlay) {
    crashOverlay.classList.remove('active');
  }

  updateStatusText('Press START to begin');
  updateActionButton('START ROUND', true);
  updateMultiplierDisplay(1.0);
  
  // Clear canvas completely
  if (ctx && canvas) {
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function handleAction() {
  if (gameState.phase === 'idle') {
    startRound();
  } else if (gameState.phase === 'running') {
    cashOut();
  }
}

function startRound() {
  gameState.phase = 'running';
  gameState.startTime = Date.now();
  gameState.lastUpdateTime = gameState.startTime;
  gameState.multiplier = 1.0;
  gameState.previousMultiplier = 1.0;
  gameState.currentVolatility = null;
  gameState.trend = Math.random() < 0.5 ? 1 : -1; // start in up or down trend
  gameState.trendChangeTime = gameState.startTime;
  gameState.crashPoint = generateCrashPoint();
  gameState.crashTime = gameState.startTime + generateCrashDuration();
  graphData = [];

  updateStatusText('Cash out anytime!');
  updateActionButton('💰 CASH OUT', true);

  gameLoop();
}

function generateCrashPoint() {
  // Generate crash point with inventory-aware rigging
  const rand = Math.random();
  let baseCrashPoint;

  // Weighted distribution favoring lower multipliers
  if (rand < CONFIG.game.crashWeightLow) {
    // 60% chance: 1.0x - 2.0x
    baseCrashPoint = 1.0 + Math.random() * 1.0;
  } else if (rand < CONFIG.game.crashWeightLow + CONFIG.game.crashWeightMed) {
    // 30% chance: 2.0x - 4.0x
    baseCrashPoint = 2.0 + Math.random() * 2.0;
  } else {
    // 10% chance: 4.0x - 10.0x
    baseCrashPoint = 4.0 + Math.random() * 6.0;
  }

  // Apply inventory rigging
  if (CONFIG.rigging.enabled) {
    baseCrashPoint = applyInventoryRigging(baseCrashPoint);
  }

  return baseCrashPoint;
}

function applyInventoryRigging(crashPoint) {
  // Determine which prize tier this crash point would give
  const prizeType = getPrizeTypeForMultiplier(crashPoint);
  
  if (!prizeType || prizeType === 'sticker') {
    return crashPoint; // No rigging for stickers
  }

  // Check inventory levels
  const remaining = inventory[prizeType] || 0;
  const initialInventory = CONFIG.inventory[prizeType];
  const inventoryRatio = remaining / initialInventory;

  // If inventory is low, reduce crash point to prevent giving that prize
  if (inventoryRatio < 0.1) {
    // Less than 10% remaining - heavily bias downward
    const protectionFactor = CONFIG.rigging.inventoryProtectionFactor[prizeType];
    const adjustment = Math.random() * 0.5; // Random reduction
    return Math.max(1.01, crashPoint / (protectionFactor * adjustment + 1));
  } else if (inventoryRatio < 0.3) {
    // Less than 30% remaining - moderately bias downward
    const protectionFactor = CONFIG.rigging.inventoryProtectionFactor[prizeType];
    const adjustment = Math.random() * 0.3;
    return crashPoint / (1 + adjustment);
  }

  return crashPoint;
}

function generateCrashDuration() {
  const min = CONFIG.game.minRoundDuration;
  const max = CONFIG.game.maxRoundDuration;
  return min + Math.random() * (max - min);
}

// Standard normal random (Box-Muller) for stock-like returns
function randomNormal() {
  const u1 = Math.random();
  const u2 = Math.random();
  if (u1 < 1e-10) return randomNormal(); // avoid log(0)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Geometric Brownian Motion: percentage return = drift*dt + volatility*sqrt(dt)*Z
// Stock-like: multiplicative updates, normal-ish returns, volatility clustering
function gameLoop() {
  if (gameState.phase !== 'running') return;

  const now = Date.now();
  const elapsed = now - gameState.startTime;

  // Check if crashed
  if (now >= gameState.crashTime) {
    crash();
    return;
  }

  const currentMult = gameState.previousMultiplier ?? 1.0;

  // Time step in seconds (for proper GBM scaling)
  if (gameState.lastUpdateTime == null) gameState.lastUpdateTime = now;
  const dt = Math.min((now - gameState.lastUpdateTime) / 1000, 0.1); // cap dt to avoid huge jumps
  gameState.lastUpdateTime = now;

  // Progression through round (0 at start, 1 at crash)
  const roundDuration = (gameState.crashTime - gameState.startTime) / 1000;
  const timeUntilCrash = (gameState.crashTime - now) / 1000;
  const proximityToCrash = 1 - timeUntilCrash / roundDuration;

  // Base volatility (per-second)
  const baseVolatility = (CONFIG.game?.volatilityPerSecond ?? 0.45);
  let sigma = baseVolatility;
  if (gameState.currentVolatility != null) {
    sigma = gameState.currentVolatility;
    gameState.currentVolatility = null; // use once then decay
  }

  // Directional trend only: +1 = up, -1 = down (never flat). Flip occasionally.
  const timeSinceTrendChange = (now - (gameState.trendChangeTime || now)) / 1000;
  if (timeSinceTrendChange > 2.5 && Math.random() < 0.12) {
    gameState.trend = -gameState.trend;
    gameState.trendChangeTime = now;
  }
  const trendStrength = 0.14; // per-second drift when in a trend (clearly up or down)
  // Drift = trend direction; near crash, down trend gets stronger so path can fall
  const crashBias = proximityToCrash * 0.08; // extra downward pull near crash
  const drift = gameState.trend * trendStrength - (gameState.trend === -1 ? crashBias : 0) - (proximityToCrash > 0.7 ? 0.06 : 0);

  // Log-return: r = drift*dt + sigma*sqrt(dt)*Z (standard GBM)
  const Z = randomNormal();
  let r = drift * dt + sigma * Math.sqrt(dt) * Z;

  // Fat tails: occasional larger moves (like real stocks)
  if (Math.random() < 0.06) r += randomNormal() * 0.08;
  if (Math.random() < 0.04) r -= randomNormal() * 0.06;

  // Multiplicative update (like real price): S_new = S_old * (1 + r)
  let newMultiplier = currentMult * (1 + r);

  // Volatility clustering: after a big move, next period is more volatile
  const absReturn = Math.abs(r);
  if (absReturn > 0.03) {
    gameState.currentVolatility = baseVolatility * (1.2 + Math.min(absReturn * 4, 0.8));
  }

  // Clamp to sensible range
  newMultiplier = Math.max(0.72, Math.min(newMultiplier, (gameState.crashPoint || 10) * 1.4));
  gameState.multiplier = newMultiplier;
  gameState.previousMultiplier = newMultiplier;

  // Store graph data
  graphData.push({
    time: elapsed,
    multiplier: gameState.multiplier
  });

  updateMultiplierDisplay(gameState.multiplier);
  drawGraph();

  gameState.animationId = requestAnimationFrame(gameLoop);
}

function cashOut() {
  if (gameState.phase !== 'running') return;

  gameState.phase = 'idle';
  cancelAnimationFrame(gameState.animationId);

  const finalMultiplier = gameState.multiplier;
  
  // Determine prize
  const prize = determinePrize(finalMultiplier);
  
  // Update inventory and stats
  updateInventoryAndStats(prize);

  // Show results
  showResults(finalMultiplier, prize);
}

function crash() {
  gameState.phase = 'crashed';
  const crashMultiplier = gameState.multiplier;
  
  // VERTICAL DROP - almost instant!
  const crashAnimationDuration = 150; // Nearly instant vertical drop
  const crashStartTime = Date.now();
  
  function animateCrash() {
    const elapsed = Date.now() - crashStartTime;
    const progress = Math.min(elapsed / crashAnimationDuration, 1);
    
    // STEEP LINEAR drop (no curves!) - straight down
    gameState.multiplier = crashMultiplier * (1 - progress);
    
    // Add crash data point
    graphData.push({
      time: graphData[graphData.length - 1].time + CONFIG.game.updateInterval,
      multiplier: gameState.multiplier
    });
    
    updateMultiplierDisplay(gameState.multiplier);
    drawGraph();
    
    if (progress < 1) {
      requestAnimationFrame(animateCrash);
    } else {
      // Crash animation complete
      gameState.multiplier = 0;
      updateMultiplierDisplay(0);
      
      // Show crash overlay IMMEDIATELY
      const crashOverlay = document.getElementById('crash-overlay');
      crashOverlay.classList.add('active');
      
      // Intense shake effect
      document.querySelector('.game-board').style.animation = 'shake 0.5s ease-in-out';
      
      setTimeout(() => {
        crashOverlay.classList.remove('active');
        
        // Give sticker as consolation prize (random mascot image)
        const prize = {
          type: 'sticker',
          name: CONFIG.prizes.sticker.name,
          color: CONFIG.prizes.sticker.color,
          image: getRandomStickerImage()
        };

        updateInventoryAndStats(prize);
        showResults(crashMultiplier, prize, true);
      }, 1200);
    }
  }
  
  cancelAnimationFrame(gameState.animationId);
  animateCrash();
}

function getPrizeTypeForMultiplier(multiplier) {
  if (multiplier >= CONFIG.prizes.bottle.min && multiplier < CONFIG.prizes.bottle.max) {
    return 'bottle';
  } else if (multiplier >= CONFIG.prizes.shirt.min && multiplier < CONFIG.prizes.shirt.max) {
    return 'shirt';
  } else if (multiplier >= CONFIG.prizes.deck.min && multiplier < CONFIG.prizes.deck.max) {
    return 'deck';
  } else if (multiplier >= CONFIG.prizes.fan.min && multiplier < CONFIG.prizes.fan.max) {
    return 'fan';
  } else if (multiplier >= CONFIG.prizes.lanyard.min && multiplier < CONFIG.prizes.lanyard.max) {
    return 'lanyard';
  } else {
    return 'sticker';
  }
}

function determinePrize(multiplier) {
  let prizeType = getPrizeTypeForMultiplier(multiplier);

  // If tier is out of stock, upgrade to the next higher tier
  while (inventory[prizeType] <= 0 && prizeType !== 'bottle') {
    prizeType = upgradePrize(prizeType);
  }

  const prizeConfig = CONFIG.prizes[prizeType];
  const image = prizeType === 'sticker'
    ? getRandomStickerImage()
    : `public/assets/prizes/${prizeType}.jpg`;
  return {
    type: prizeType,
    name: prizeConfig.name,
    color: prizeConfig.color,
    image
  };
}

const STICKER_IMAGES = [
  'public/assets/prizes/sticker1.jpg',
  'public/assets/prizes/sticker2.jpg',
  'public/assets/prizes/sticker3.jpg'
];
let stickerRotationIndex = 0;

function getRandomStickerImage() {
  return STICKER_IMAGES[Math.floor(Math.random() * STICKER_IMAGES.length)];
}

function applyStickerRotation() {
  const src = STICKER_IMAGES[stickerRotationIndex];
  document.querySelectorAll('img.sticker-rotate').forEach(img => {
    img.src = src;
  });
}

function advanceStickerRotation() {
  stickerRotationIndex = (stickerRotationIndex + 1) % STICKER_IMAGES.length;
  applyStickerRotation();
}

/** Next tier up (e.g. sticker → lanyard → … → bottle). Bottle stays bottle. */
function upgradePrize(prizeType) {
  const hierarchy = ['sticker', 'lanyard', 'fan', 'deck', 'shirt', 'bottle'];
  const currentIndex = hierarchy.indexOf(prizeType);
  return hierarchy[Math.min(currentIndex + 1, hierarchy.length - 1)];
}

function updateInventoryAndStats(prize) {
  // Update inventory
  if (inventory[prize.type] > 0) {
    inventory[prize.type]--;
  }
  saveInventory();

  // Update stats
  stats.total++;
  stats[prize.type + 's'] = (stats[prize.type + 's'] || 0) + 1;
  saveStats();
}

function showResults(multiplier, prize, crashed = false) {
  showScreen('results-screen');

  // Update result title
  const resultTitle = document.getElementById('result-title');
  if (crashed) {
    resultTitle.textContent = 'CRASHED!';
    resultTitle.style.color = CONFIG.theme.accent;
  } else {
    resultTitle.textContent = 'Congratulations!';
    resultTitle.style.color = CONFIG.theme.success;
  }

  // Update multiplier
  document.getElementById('result-multiplier').textContent = multiplier.toFixed(2) + 'x';

  // Update prize
  const prizeImage = document.getElementById('prize-image');
  prizeImage.src = prize.image;
  prizeImage.onerror = () => {
    prizeImage.src = `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22${encodeURIComponent(prize.color)}%22 width=%22150%22 height=%22150%22 rx=%2220%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2260%22 fill=%22white%22%3E${getPrizeEmoji(prize.type)}%3C/text%3E%3C/svg%3E`;
  };

  document.getElementById('prize-name-large').textContent = prize.name;
  document.getElementById('prize-name-large').style.color = prize.color;

  // Update message
  const message = crashed
    ? "Better luck next time! Enjoy your sticker!"
    : `Awesome! Please collect your ${prize.name} from the stall!`;
  document.getElementById('result-message').textContent = message;

  // Record prize in "Last 5 won" (both cash-out and crash/sticker)
  addRecentWin(prize);

  // Show confetti for wins (not crashes)
  if (!crashed) {
    createConfetti();
  }

  updateUI();
}

function getPrizeEmoji(type) {
  const emojis = {
    bottle: '🍾',
    shirt: '👕',
    deck: '🃏',
    fan: '💨',
    lanyard: '🎫',
    sticker: '⭐'
  };
  return emojis[type] || '🎁';
}

function createConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';

  const colors = [CONFIG.theme.accent, CONFIG.theme.success, CONFIG.theme.warning, CONFIG.theme.info, CONFIG.theme.gold];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    container.appendChild(confetti);
  }

  // Clear confetti after animation
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

// Canvas Drawing
function drawGraph() {
  if (!ctx || !canvas) return;

  const width = canvas.width;
  const height = canvas.height;

  // Always clear completely for crisp graph
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillRect(0, 0, width, height);

  if (graphData.length < 1) return;

  // Calculate bounds
  const maxTime = Math.max(...graphData.map(d => d.time), 1);
  const maxMultiplier = Math.max(...graphData.map(d => d.multiplier), 2);
  const minMultiplier = Math.min(...graphData.map(d => d.multiplier), 0.5);
  const range = maxMultiplier - minMultiplier;

  // Determine color based on state
  const isCrashed = gameState.phase === 'crashed' || gameState.multiplier < 0.5;
  const lineColor = isCrashed ? CONFIG.theme.accent : CONFIG.theme.success;
  
  // Draw grid with labels
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '12px Arial';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i;
    // Horizontal grid line
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    
    // Multiplier label
    const mult = maxMultiplier - (range * i / 4);
    ctx.fillText(mult.toFixed(1) + 'x', 5, y - 5);
  }

  // Draw vertical time markers
  for (let i = 1; i < 4; i++) {
    const x = (width / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Draw filled area under graph
  ctx.fillStyle = isCrashed 
    ? 'rgba(202, 53, 40, 0.15)' 
    : 'rgba(76, 175, 80, 0.15)';
  ctx.beginPath();
  
  graphData.forEach((point, index) => {
    const x = (point.time / maxTime) * width;
    const normalizedMult = (point.multiplier - minMultiplier) / range;
    const y = height - (normalizedMult * height * 0.90) - height * 0.05;

    if (index === 0) {
      ctx.moveTo(0, height);
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  // Close the fill area
  const lastPoint = graphData[graphData.length - 1];
  const lastX = (lastPoint.time / maxTime) * width;
  ctx.lineTo(lastX, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Draw main graph line with gradient
  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, isCrashed ? '#CA3528' : '#2E7D32');
  gradient.addColorStop(0.5, isCrashed ? '#ff6b6b' : '#4CAF50');
  gradient.addColorStop(1, isCrashed ? '#ff8888' : '#66bb6a');
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  graphData.forEach((point, index) => {
    const x = (point.time / maxTime) * width;
    const normalizedMult = (point.multiplier - minMultiplier) / range;
    const y = height - (normalizedMult * height * 0.90) - height * 0.05;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw outer glow effect
  ctx.shadowBlur = 30;
  ctx.shadowColor = lineColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Draw inner bright line
  ctx.shadowBlur = 15;
  ctx.lineWidth = 3;
  ctx.strokeStyle = isCrashed ? '#ffaaaa' : '#aaffaa';
  ctx.stroke();
  
  ctx.shadowBlur = 0;

  // Draw data points as dots for better visibility
  if (graphData.length < 50) { // Only show dots if not too many points
    graphData.forEach((point, index) => {
      if (index % 3 === 0) { // Show every 3rd point
        const x = (point.time / maxTime) * width;
        const normalizedMult = (point.multiplier - minMultiplier) / range;
        const y = height - (normalizedMult * height * 0.90) - height * 0.05;
        
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // Draw current point indicator (if still running)
  if (gameState.phase === 'running' && graphData.length > 0) {
    const lastPoint = graphData[graphData.length - 1];
    const x = (lastPoint.time / maxTime) * width;
    const normalizedMult = (lastPoint.multiplier - minMultiplier) / range;
    const y = height - (normalizedMult * height * 0.90) - height * 0.05;
    
    // Pulsing circle
    const pulseSize = 4 + Math.sin(Date.now() / 100) * 2;
    
    // Outer glow ring
    ctx.fillStyle = lineColor + '40';
    ctx.beginPath();
    ctx.arc(x, y, pulseSize + 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle ring
    ctx.fillStyle = lineColor + '80';
    ctx.beginPath();
    ctx.arc(x, y, pulseSize + 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner solid circle
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // White center dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, pulseSize - 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Current value label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    const labelX = Math.min(x + 15, width - 60);
    const labelY = Math.max(y - 10, 20);
    
    // Background for label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(labelX - 3, labelY - 15, 55, 20);
    
    // Label text
    ctx.fillStyle = lineColor;
    ctx.fillText(lastPoint.multiplier.toFixed(2) + 'x', labelX, labelY);
    ctx.textAlign = 'start';
  }
  
  // Draw crash line when crashed
  if (isCrashed && graphData.length > 0) {
    const lastPoint = graphData[graphData.length - 1];
    const x = (lastPoint.time / maxTime) * width;
    
    ctx.strokeStyle = CONFIG.theme.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// UI Updates
function updateStatusText(text) {
  const statusText = document.getElementById('status-text');
  if (statusText) {
    statusText.textContent = text;
  }
}

function updateActionButton(text, enabled) {
  const btn = document.getElementById('action-btn');
  if (btn) {
    btn.textContent = text;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.5';
  }
}

function updateMultiplierDisplay(multiplier) {
  const display = document.getElementById('multiplier-value');
  if (display) {
    // Show 0.00x for crash, otherwise normal
    if (multiplier < 0.01) {
      display.textContent = '0.00x';
      display.style.color = CONFIG.theme.accent;
    } else {
      display.textContent = multiplier.toFixed(2) + 'x';
      
      // Color based on multiplier
      if (multiplier < CONFIG.prizes.lanyard.min) {
        display.style.color = CONFIG.prizes.sticker.color;
      } else if (multiplier < CONFIG.prizes.fan.min) {
        display.style.color = CONFIG.prizes.lanyard.color;
      } else if (multiplier < CONFIG.prizes.deck.min) {
        display.style.color = CONFIG.prizes.fan.color;
      } else if (multiplier < CONFIG.prizes.shirt.min) {
        display.style.color = CONFIG.prizes.deck.color;
      } else if (multiplier < CONFIG.prizes.bottle.min) {
        display.style.color = CONFIG.prizes.shirt.color;
      } else {
        display.style.color = CONFIG.prizes.bottle.color;
      }
    }
  }
  
  // Update prize tier highlighting
  updatePrizeTierHighlight(multiplier);
}

function updatePrizeTierHighlight(multiplier) {
  // Remove all active classes
  document.querySelectorAll('.prize-tier-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Determine current tier and highlight it
  let currentTier = 'sticker'; // default
  
  if (multiplier >= CONFIG.prizes.bottle.min) {
    currentTier = 'bottle';
  } else if (multiplier >= CONFIG.prizes.shirt.min) {
    currentTier = 'shirt';
  } else if (multiplier >= CONFIG.prizes.deck.min) {
    currentTier = 'deck';
  } else if (multiplier >= CONFIG.prizes.fan.min) {
    currentTier = 'fan';
  } else if (multiplier >= CONFIG.prizes.lanyard.min) {
    currentTier = 'lanyard';
  } else {
    currentTier = 'sticker';
  }
  
  // Highlight the current tier
  const tierElement = document.getElementById(`tier-${currentTier}`);
  if (tierElement) {
    tierElement.classList.add('active');
  }
}

// Admin Functions
function saveInventoryFromAdmin() {
  inventory.bottle = parseInt(document.getElementById('admin-bottle').value) || 0;
  inventory.shirt = parseInt(document.getElementById('admin-shirt').value) || 0;
  inventory.deck = parseInt(document.getElementById('admin-deck').value) || 0;
  inventory.fan = parseInt(document.getElementById('admin-fan').value) || 0;
  inventory.lanyard = parseInt(document.getElementById('admin-lanyard').value) || 0;
  inventory.sticker = parseInt(document.getElementById('admin-sticker').value) || 0;

  localStorage.setItem('crashGameInventory', JSON.stringify(inventory));
  updateUI();
  alert('Inventory saved successfully!');
}

function resetStats() {
  if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
    stats = {
      total: 0,
      bottles: 0,
      shirts: 0,
      decks: 0,
      fans: 0,
      lanyards: 0,
      stickers: 0
    };
    saveStats();
    updateUI();
    alert('Statistics reset successfully!');
  }
}
