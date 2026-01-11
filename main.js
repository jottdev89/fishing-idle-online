/* ------------------------------
   CONFIG & DATA
------------------------------ */
const AUTO_TIME = 30;
const SAVE_KEY = "idle_fishing_save";

const fishes = [
  { name: "Minnow", icon: "🐟", chance: 10, rarity: "common" },
  { name: "Goldfish", icon: "🐠", chance: 9, rarity: "common" },
  { name: "Pufferfish", icon: "🐡", chance: 9, rarity: "common" },
  { name: "Crab", icon: "🦀", chance: 9, rarity: "common" },
  { name: "Shrimp", icon: "🦐", chance: 8, rarity: "common" },

  { name: "Lobster", icon: "🦞", chance: 6, rarity: "uncommon" },
  { name: "Clam", icon: "🦪", chance: 5, rarity: "uncommon" },
  { name: "Coral Fish", icon: "🐬", chance: 5, rarity: "uncommon" },
  { name: "Tropical", icon: "🐙", chance: 5, rarity: "uncommon" },
  { name: "Blowfish", icon: "🪸", chance: 4, rarity: "uncommon" },

  { name: "Squid", icon: "🦑", chance: 5, rarity: "rare" },
  { name: "Jellyfish", icon: "🪼", chance: 4, rarity: "rare" },
  { name: "Seahorse", icon: "🐴", chance: 3, rarity: "rare" },
  { name: "Stingray", icon: "🦈", chance: 3, rarity: "rare" },
  { name: "Starfish", icon: "⭐", chance: 3, rarity: "rare" },

  { name: "Swordfish", icon: "⚓", chance: 3, rarity: "epic" },
  { name: "Manta Ray", icon: "🛥️", chance: 3, rarity: "epic" },
  { name: "Sea Turtle", icon: "🐢", chance: 3, rarity: "epic" },

  { name: "Whale", icon: "🐋", chance: 2, rarity: "legendary" },
  { name: "Kraken", icon: "🐉", chance: 1, rarity: "legendary" }
];

const inventory = {};
const cards = {};
let timer = AUTO_TIME;

const app = document.querySelector(".app");

/* ------------------------------
   FISHING LOGIC
------------------------------ */
function rollFish() {
  let roll = Math.random() * 100;
  let sum = 0;
  for (const f of fishes) {
    sum += f.chance;
    if (roll <= sum) return f;
  }
}

function catchFish() {
  const fish = rollFish();
  inventory[fish.name] = (inventory[fish.name] || 0) + 1;
  updateCard(fish);
  updateTotal();
  showLastCatch(fish);
  saveGame();
}

/* ------------------------------
   UI - LAST CATCH DISPLAY
------------------------------ */
function showLastCatch(fish) {
  const catchIcon = document.getElementById("catchIcon");
  const catchName = document.getElementById("catchName");
  const catchRarity = document.getElementById("catchRarity");
  
  if (catchIcon && catchName && catchRarity) {
    catchIcon.textContent = fish.icon;
    catchName.textContent = fish.name;
    catchRarity.textContent = fish.rarity;
    catchRarity.className = `catch-rarity ${fish.rarity}`;
    
    // Trigger animation by removing and re-adding class
    catchIcon.style.animation = 'none';
    setTimeout(() => {
      catchIcon.style.animation = 'catchBounce 0.5s ease';
    }, 10);
  }
}

/* ------------------------------
   INVENTORY
------------------------------ */
function updateCard(fish) {
  let card = cards[fish.name];

  if (!card) {
    card = document.createElement("div");
    card.className = `card ${fish.rarity !== "common" ? fish.rarity : ""}`;
    card.innerHTML = `
      <div class="icon"><span>${fish.icon}</span></div>
      <div class="count"></div>
    `;
    card.dataset.rarity = fish.rarity; // Store rarity for sorting
    card.dataset.fishName = fish.name;
    cards[fish.name] = card;
    
    // Insert card in sorted position
    insertCardSorted(card, fish);
  }

  card.querySelector(".count").textContent = "x" + inventory[fish.name];
  card.classList.remove("pop");
  void card.offsetWidth;
  card.classList.add("pop");
}

function insertCardSorted(newCard, fish) {
  const grid = document.getElementById("inventory");
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  const newRarityValue = rarityOrder[fish.rarity];
  
  // Find the correct position to insert
  const existingCards = Array.from(grid.children);
  let inserted = false;
  
  for (let i = 0; i < existingCards.length; i++) {
    const existingRarity = existingCards[i].dataset.rarity;
    const existingRarityValue = rarityOrder[existingRarity];
    
    if (newRarityValue < existingRarityValue) {
      grid.insertBefore(newCard, existingCards[i]);
      inserted = true;
      break;
    } else if (newRarityValue === existingRarityValue) {
      // Same rarity, sort alphabetically
      const existingName = existingCards[i].dataset.fishName;
      if (fish.name < existingName) {
        grid.insertBefore(newCard, existingCards[i]);
        inserted = true;
        break;
      }
    }
  }
  
  // If not inserted yet, add to end
  if (!inserted) {
    grid.appendChild(newCard);
  }
}

function updateTotal() {
  document.getElementById("total").textContent =
    Object.values(inventory).reduce((a, b) => a + b, 0);
}

/* ------------------------------
   SAVE / LOAD + OFFLINE
------------------------------ */
function saveGame() {
  const saveData = {
    inventory,
    lastPlayed: Date.now()
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) {
    resetTimer();
    return;
  }

  const data = JSON.parse(saved);

  if (data.inventory) {
    Object.assign(inventory, data.inventory);
    for (const name in inventory) {
      const fish = fishes.find(f => f.name === name);
      if (fish) updateCard(fish);
    }
    updateTotal();
  }

  if (data.lastPlayed) {
    const secondsAway = Math.floor((Date.now() - data.lastPlayed) / 1000);
    const catches = Math.floor(secondsAway / AUTO_TIME);

    if (catches > 0) {
      const offlineCatches = {};
      
      for (let i = 0; i < catches; i++) {
        const fish = rollFish();
        inventory[fish.name] = (inventory[fish.name] || 0) + 1;
        offlineCatches[fish.name] = (offlineCatches[fish.name] || 0) + 1;
      }

      for (const name in inventory) {
        const fish = fishes.find(f => f.name === name);
        if (fish) updateCard(fish);
      }
      updateTotal();
      
      // Show offline modal with a slight delay to ensure DOM is ready
      setTimeout(() => {
        showOfflineModal(offlineCatches, catches, secondsAway);
      }, 500);
      
      saveGame();
    }
  }

  resetTimer();
}

function showOfflineModal(offlineCatches, totalCatches, secondsAway) {
  const modal = document.getElementById("offlineModal");
  const fishList = document.getElementById("offlineFishList");
  const totalEl = document.getElementById("offlineTotal");
  const timeEl = document.getElementById("offlineTime");
  
  if (!modal || !fishList || !totalEl || !timeEl) {
    return;
  }
  
  // Format time away
  let timeText;
  if (secondsAway < 60) {
    timeText = secondsAway + "s";
  } else if (secondsAway < 3600) {
    timeText = Math.floor(secondsAway / 60) + "m";
  } else if (secondsAway < 86400) {
    timeText = Math.floor(secondsAway / 3600) + "h";
  } else {
    timeText = Math.floor(secondsAway / 86400) + "d";
  }
  
  totalEl.textContent = totalCatches;
  timeEl.textContent = timeText;
  
  // Clear previous fish
  fishList.innerHTML = "";
  
  // Add each fish type caught
  for (const fishName in offlineCatches) {
    const fish = fishes.find(f => f.name === fishName);
    if (fish) {
      const item = document.createElement("div");
      item.className = `offline-fish-item ${fish.rarity !== "common" ? fish.rarity : ""}`;
      item.innerHTML = `
        <div class="fish-icon">${fish.icon}</div>
        <div class="fish-count">x${offlineCatches[fishName]}</div>
      `;
      fishList.appendChild(item);
    }
  }
  
  // Show modal
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
}

/* ------------------------------
   TIMER (AUTO-FISHING)
------------------------------ */
function resetTimer() {
  timer = AUTO_TIME;
  document.getElementById("timer").textContent = timer;
  document.getElementById("progress").style.width = "0%";
}

setInterval(() => {
  timer--;
  document.getElementById("timer").textContent = timer;
  document.getElementById("progress").style.width =
    ((AUTO_TIME - timer) / AUTO_TIME) * 100 + "%";

  if (timer <= 0) {
    catchFish();
    resetTimer();
  }
}, 1000);

/* ------------------------------
   SCENE SWITCHING (SAFE)
------------------------------ */
const scenes = document.querySelectorAll(".scene");
const buttons = document.querySelectorAll(".bottom-buttons button");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.scene;

    scenes.forEach(s => s.classList.remove("active"));
    buttons.forEach(b => b.classList.remove("active"));

    document.querySelector(".scene-" + target).classList.add("active");
    btn.classList.add("active");
  });
});

/* ------------------------------
   INIT
------------------------------ */
loadGame();
window.addEventListener("beforeunload", saveGame);

// Close offline modal handler
setTimeout(() => {
  const closeBtn = document.getElementById("closeOffline");
  const modal = document.getElementById("offlineModal");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      modal.style.display = "none";
    });
  }
}, 200);
