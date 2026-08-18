// ===== Rarity table (percentages sum to 100) =====
const RARITIES = [
  { name: "Common",     class: "rarity-common",    chance: 40.9 },
  { name: "Uncommon",   class: "rarity-uncommon",  chance: 30 },
  { name: "Rare",       class: "rarity-rare",      chance: 20 },
  { name: "Epic",       class: "rarity-epic",      chance: 5 },
  { name: "Legendary",  class: "rarity-legendary", chance: 3 },
  { name: "Divine",     class: "rarity-divine",    chance: 1 },
  { name: "Ultra Rare", class: "rarity-ultra",      chance: 0.1 },
];

const CRATE_COST = 100;
const STARTING_BALANCE = 1000;
const ITEM_WIDTH = 130;
const ITEM_GAP = 14;
const SLOT_WIDTH = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 60;      // total items generated for the spin
const WINNING_INDEX = 50;    // index in the reel array that will be the result

const reelEl = document.getElementById("reel");
const balanceEl = document.getElementById("balanceAmount");
const openBtn = document.getElementById("openCrateBtn");
const resetBtn = document.getElementById("resetBalanceBtn");
const resultText = document.getElementById("resultText");

let balance = loadBalance();
let spinning = false;

updateBalanceDisplay();
buildInitialReel();

// ===== Balance handling =====
function loadBalance() {
  const saved = localStorage.getItem("habibiOSBalance");
  return saved !== null ? parseFloat(saved) : STARTING_BALANCE;
}

function saveBalance() {
  localStorage.setItem("habibiOSBalance", balance);
}

function updateBalanceDisplay() {
  balanceEl.textContent = "$" + balance.toFixed(2);
}

resetBtn.addEventListener("click", () => {
  balance = STARTING_BALANCE;
  saveBalance();
  updateBalanceDisplay();
});

// ===== Weighted random rarity =====
function pickRarity() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITIES) {
    cumulative += rarity.chance;
    if (roll <= cumulative) return rarity;
  }
  return RARITIES[0];
}

// ===== Build a reel item element =====
function createReelItem(rarity) {
  const item = document.createElement("div");
  item.className = "reel-item " + rarity.class;

  const img = document.createElement("img");
  img.src = "crate.png";
  img.alt = rarity.name;

  const label = document.createElement("span");
  label.textContent = rarity.name;

  item.appendChild(img);
  item.appendChild(label);
  return item;
}

// ===== Fill reel with random items on load (idle state) =====
function buildInitialReel() {
  reelEl.innerHTML = "";
  reelEl.style.transition = "none";
  reelEl.style.transform = "translateX(0px)";

  for (let i = 0; i < 20; i++) {
    reelEl.appendChild(createReelItem(pickRarity()));
  }
}

// ===== Open crate =====
openBtn.addEventListener("click", () => {
  if (spinning) return;

  if (balance < CRATE_COST) {
    resultText.textContent = "Not enough balance! Reset your balance to keep playing.";
    resultText.style.color = "#f44336";
    return;
  }

  spinning = true;
  openBtn.disabled = true;
  resultText.textContent = "Opening crate...";
  resultText.style.color = "white";

  balance -= CRATE_COST;
  saveBalance();
  updateBalanceDisplay();

  // Determine the winning rarity ahead of time
  const winningRarity = pickRarity();

  // Build the full reel: random items, with winning rarity placed at WINNING_INDEX
  reelEl.style.transition = "none";
  reelEl.style.transform = "translateX(0px)";
  reelEl.innerHTML = "";

  for (let i = 0; i < REEL_LENGTH; i++) {
    const rarity = i === WINNING_INDEX ? winningRarity : pickRarity();
    reelEl.appendChild(createReelItem(rarity));
  }

  // Force reflow so the transition applies cleanly
  void reelEl.offsetWidth;

  // Calculate how far to scroll so WINNING_INDEX lands under the pointer
  const wrapperWidth = reelEl.parentElement.offsetWidth;
  const targetOffset =
    WINNING_INDEX * SLOT_WIDTH + ITEM_WIDTH / 2 - wrapperWidth / 2;

  // Small random jitter so it doesn't land in the exact same spot every time
  const jitter = (Math.random() - 0.5) * (ITEM_WIDTH * 0.4);

  reelEl.style.transition = "transform 5.5s cubic-bezier(0.12, 0.83, 0.14, 1)";
  reelEl.style.transform = `translateX(-${targetOffset + jitter}px)`;

  // After the spin finishes, reveal the result
  setTimeout(() => {
    const items = reelEl.children;
    const winningEl = items[WINNING_INDEX];
    winningEl.classList.add("winner");

    resultText.textContent = `You got: ${winningRarity.name}!`;
    resultText.style.color = getComputedStyle(winningEl.querySelector("span")).color;

    spinning = false;
    openBtn.disabled = false;
  }, 5600);
});