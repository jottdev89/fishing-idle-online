/* ------------------------------
   CONFIG & DATA
------------------------------ */
const AUTO_TIME = 30; // seconds per auto-fish
const SAVE_KEY = "idle_fishing_save";

const fishes = [
  { name: "Minnow",      icon: "🐟", chance: 10, rarity: "common" },
  { name: "Goldfish",    icon: "🐠", chance: 9,  rarity: "common" },
  { name: "Pufferfish",  icon: "🐡", chance: 9,  rarity: "common" },
  { name: "Crab",        icon: "🦀", chance: 9,  rarity: "common" },
  { name: "Shrimp",      icon: "🦐", chance: 8,  rarity: "common" },

  { name: "Lobster",     icon: "🦞", chance: 6,  rarity: "uncommon" },
  { name: "Clam",        icon: "🦪", chance: 5,  rarity: "uncommon" },
  { name: "Coral Fish",  icon: "🐬", chance: 5,  rarity: "uncommon" },
  { name: "Tropical",    icon: "🐙", chance: 5,  rarity: "uncommon" },
  { name: "Blowfish",    icon: "🪸", chance: 4,  rarity: "uncommon" },

  { name: "Squid",       icon: "🦑", chance: 5,  rarity: "rare" },
  { name: "Jellyfish",   icon: "🪼", chance: 4,  rarity: "rare" },
  { name: "Seahorse",    icon: "🐴", chance: 3,  rarity: "rare" },
  { name: "Stingray",    icon: "🦈", chance: 3,  rarity: "rare" },
  { name: "Starfish",    icon: "⭐", chance: 3,  rarity: "rare" },

  { name: "Swordfish",   icon: "⚓", chance: 3,  rarity: "epic" },
  { name: "Manta Ray",   icon: "🛥️", chance: 3,  rarity: "epic" },
  { name: "Sea Turtle",  icon: "🐢", chance: 3,  rarity: "epic" },

  { name: "Whale",       icon: "🐋", chance: 2,  rarity: "legendary" },
  { name: "Kraken",      icon: "🐉", chance: 1,  rarity: "legendary" }
];

const inventory = {};
const cards = {};
let timer = AUTO_TIME;

const app = document.querySelector(".app");

/* ------------------------------
   FISHING LOGIC
------------------------------ */
function rollFish() {
  let roll = Math.random() * 100, sum = 0;
  for (const f of fishes) {
    sum += f.chance;
    if (roll <= sum) return f;
  }
}

function showCatchPopup(fish) {
  const popup = document.createElement("div");
  popup.className = "catch-popup";
  popup.textContent = `${fish.name} ${fish.icon}`;
  app.appendChild(popup);

  const water = document.getElementById("water");
  const rect = water.getBoundingClientRect();
  popup.style.top = rect.top + 60 + "px";
  popup.style.left = rect.left + 50 + "px";

  setTimeout(() => popup.remove(), 3000);
}

function catchFish() {
  const fish = rollFish();
  inventory[fish.name] = (inventory[fish.name] || 0) + 1;
  showCatchPopup(fish);
  updateCard(fish);
  updateTotal();
  saveGame();
}

/* ------------------------------
   INVENTORY
------------------------------ */
function updateCard(fish) {
  let card = cards[fish.name];
  if (!card) {
    card = document.createElement("div");
    card.className = `card ${fish.rarity !== "common" ? fish.rarity : ""}`;
    card.innerHTML = `<div class="icon"><span>${fish.icon}</span></div><div class="count"></div>`;
    document.getElementById("inventory").appendChild(card);
    cards[fish.name] = card;
  }
  card.querySelector(".count").textContent = "x" + inventory[fish.name];
  card.classList.remove("pop");
  void card.offsetWidth;
  card.classList.add("pop");
}

function updateTotal() {
  document.getElementById("total").textContent = Object.values(inventory).reduce((a,b)=>a+b,0);
}

/* ------------------------------
   SAVE / LOAD + OFFLINE
------------------------------ */
function saveGame() {
  const data = {
    inventory,
    lastPlayed: Date.now()
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) {
    resetTimer();
    return;
  }

  const data = JSON.parse(saved);

  // restore inventory
  if (data.inventory) {
    Object.assign(inventory, data.inventory);
    for (const fishName in inventory) {
      const fish = fishes.find(f => f.name === fishName);
      if (fish) updateCard(fish);
    }
    updateTotal();
  }

  // offline progress
  if (data.lastPlayed) {
    const secondsAway = Math.floor((Date.now() - data.lastPlayed) / 1000);
    const catches = Math.floor(secondsAway / AUTO_TIME);

    if (catches > 0) {
      for (let i = 0; i < catches; i++) {
        const fish = rollFish();
        inventory[fish.name] = (inventory[fish.name] || 0) + 1;
      }

      // update UI once
      for (const fishName in inventory) {
        const fish = fishes.find(f => f.name === fishName);
        if (fish) updateCard(fish);
      }
      updateTotal();
      showOfflinePopup(catches);
      saveGame();
    }
  }

  // restart auto-fishing timer
  resetTimer();
}

function showOfflinePopup(count) {
  const popup = document.createElement("div");
  popup.className = "catch-popup";
  popup.textContent = `While away, you caught ${count} fish 🎣`;

  const water = document.getElementById("water");
  const rect = water.getBoundingClientRect();

  popup.style.left = rect.left + rect.width / 2 + "px";
  popup.style.top = rect.top + 80 + "px";

  app.appendChild(popup);
  setTimeout(() => popup.remove(), 2000);
}

/* ------------------------------
   TIMER
------------------------------ */
function resetTimer() {
  timer = AUTO_TIME;
  document.getElementById("progress").style.width = "0%";
  document.getElementById("timer").textContent = timer;
}

setInterval(() => {
  timer--;
  document.getElementById("timer").textContent = timer;
  document.getElementById("progress").style.width = ((AUTO_TIME - timer)/AUTO_TIME)*100 + "%";

  if (timer <= 0) {
    catchFish();
    resetTimer();
  }
}, 1000);

/* ------------------------------
   INIT
------------------------------ */
loadGame();
window.addEventListener("beforeunload", saveGame);