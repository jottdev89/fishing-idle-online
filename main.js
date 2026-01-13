/* ------------------------------
   CONFIG & DATA
------------------------------ */
const AUTO_TIME = 30;
const SAVE_KEY = "idle_fishing_save";

// Extended fish list with 10 rarity tiers
const fishes = [
  // Tier 1: Common (Always available)
  { name: "Minnow", icon: "🐟", chance: 15, rarity: "common", tier: 1 },
  { name: "Sardine", icon: "🐠", chance: 15, rarity: "common", tier: 1 },
  { name: "Anchovy", icon: "🐡", chance: 14, rarity: "common", tier: 1 },
  { name: "Shrimp", icon: "🦐", chance: 13, rarity: "common", tier: 1 },
  { name: "Crab", icon: "🦀", chance: 13, rarity: "common", tier: 1 },
  
  // Tier 2: Uncommon (Requires level 5)
  { name: "Bass", icon: "🐟", chance: 10, rarity: "uncommon", tier: 2 },
  { name: "Trout", icon: "🐠", chance: 9, rarity: "uncommon", tier: 2 },
  { name: "Perch", icon: "🐡", chance: 9, rarity: "uncommon", tier: 2 },
  { name: "Clam", icon: "🦪", chance: 8, rarity: "uncommon", tier: 2 },
  { name: "Lobster", icon: "🦞", chance: 8, rarity: "uncommon", tier: 2 },
  
  // Tier 3: Rare (Requires level 15)
  { name: "Salmon", icon: "🐟", chance: 7, rarity: "rare", tier: 3 },
  { name: "Tuna", icon: "🐠", chance: 6, rarity: "rare", tier: 3 },
  { name: "Squid", icon: "🦑", chance: 6, rarity: "rare", tier: 3 },
  { name: "Octopus", icon: "🐙", chance: 5, rarity: "rare", tier: 3 },
  { name: "Jellyfish", icon: "🪼", chance: 5, rarity: "rare", tier: 3 },
  
  // Tier 4: Epic (Requires level 30)
  { name: "Swordfish", icon: "🗡️", chance: 5, rarity: "epic", tier: 4 },
  { name: "Marlin", icon: "⚓", chance: 4, rarity: "epic", tier: 4 },
  { name: "Barracuda", icon: "🐟", chance: 4, rarity: "epic", tier: 4 },
  { name: "Manta Ray", icon: "🛥️", chance: 4, rarity: "epic", tier: 4 },
  { name: "Sea Turtle", icon: "🐢", chance: 3, rarity: "epic", tier: 4 },
  
  // Tier 5: Legendary (Requires level 50)
  { name: "Shark", icon: "🦈", chance: 3, rarity: "legendary", tier: 5 },
  { name: "Whale", icon: "🐋", chance: 3, rarity: "legendary", tier: 5 },
  { name: "Dolphin", icon: "🐬", chance: 2, rarity: "legendary", tier: 5 },
  { name: "Orca", icon: "🐋", chance: 2, rarity: "legendary", tier: 5 },
  
  // Tier 6: Mythic (Requires level 75)
  { name: "Giant Squid", icon: "🦑", chance: 2, rarity: "mythic", tier: 6 },
  { name: "Hammerhead", icon: "🦈", chance: 2, rarity: "mythic", tier: 6 },
  { name: "Blue Whale", icon: "🐋", chance: 1.5, rarity: "mythic", tier: 6 },
  { name: "Colossal Squid", icon: "🦑", chance: 1.5, rarity: "mythic", tier: 6 },
  
  // Tier 7: Ancient (Requires level 100)
  { name: "Megalodon", icon: "🦈", chance: 1, rarity: "ancient", tier: 7 },
  { name: "Mosasaurus", icon: "🦎", chance: 1, rarity: "ancient", tier: 7 },
  { name: "Dunkleosteus", icon: "🐟", chance: 0.8, rarity: "ancient", tier: 7 },
  { name: "Liopleurodon", icon: "🦕", chance: 0.7, rarity: "ancient", tier: 7 },
  
  // Tier 8: Celestial (Requires level 150)
  { name: "Starfish Titan", icon: "⭐", chance: 0.5, rarity: "celestial", tier: 8 },
  { name: "Cosmic Whale", icon: "🌌", chance: 0.5, rarity: "celestial", tier: 8 },
  { name: "Nebula Squid", icon: "✨", chance: 0.4, rarity: "celestial", tier: 8 },
  { name: "Galaxy Leviathan", icon: "🌠", chance: 0.3, rarity: "celestial", tier: 8 },
  
  // Tier 9: Divine (Requires level 250)
  { name: "Poseidon's Trident Fish", icon: "🔱", chance: 0.2, rarity: "divine", tier: 9 },
  { name: "Oceanic Deity", icon: "🌊", chance: 0.15, rarity: "divine", tier: 9 },
  { name: "Abyssal God", icon: "👁️", chance: 0.1, rarity: "divine", tier: 9 },
  
  // Tier 10: Transcendent (Requires level 500)
  { name: "The Kraken", icon: "🐉", chance: 0.05, rarity: "transcendent", tier: 10 },
  { name: "Leviathan Prime", icon: "🌀", chance: 0.03, rarity: "transcendent", tier: 10 },
  { name: "Eternal Serpent", icon: "🐍", chance: 0.02, rarity: "transcendent", tier: 10 }
];

const inventory = {};
const cards = {};
let timer = AUTO_TIME;

// Player progression
let playerLevel = 1;
let playerXP = 0;
let coins = 0;

// Upgrades
let upgrades = {
  rodLevel: 1,      // Unlocks higher tier fish
  weightLevel: 1    // Can catch heavier fish
};

const app = document.querySelector(".app");

/* ------------------------------
   PROGRESSION SYSTEM
------------------------------ */
function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

function addXP(amount) {
  playerXP += amount;
  
  // Level up check
  while (playerXP >= getXPForLevel(playerLevel + 1)) {
    playerXP -= getXPForLevel(playerLevel + 1);
    playerLevel++;
    showLevelUpNotification();
  }
  
  updateProgressUI();
  saveGame();
}

function showLevelUpNotification() {
  const notification = document.createElement("div");
  notification.className = "level-up-notification";
  notification.textContent = `🎉 LEVEL UP! Now Level ${playerLevel}`;
  app.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

function updateProgressUI() {
  const levelEl = document.getElementById("playerLevel");
  const xpEl = document.getElementById("playerXP");
  const coinsEl = document.getElementById("playerCoins");
  const xpFillEl = document.getElementById("xpFill");
  
  if (levelEl) levelEl.textContent = playerLevel;
  if (coinsEl) coinsEl.textContent = coins.toLocaleString();
  
  const nextLevelXP = getXPForLevel(playerLevel + 1);
  const xpPercent = (playerXP / nextLevelXP) * 100;
  
  if (xpEl) xpEl.textContent = `${playerXP} / ${nextLevelXP} XP`;
  if (xpFillEl) xpFillEl.style.width = xpPercent + "%";
  
  updateUpgradesUI();
}

function updateUpgradesUI() {
  const rodLevelEl = document.getElementById("rodLevel");
  const weightLevelEl = document.getElementById("weightLevel");
  const maxTierEl = document.getElementById("maxTier");
  const maxWeightEl = document.getElementById("maxWeight");
  const rodCostEl = document.getElementById("rodCost");
  const weightCostEl = document.getElementById("weightCost");
  const rodBtn = document.getElementById("upgradeRod");
  const weightBtn = document.getElementById("upgradeWeight");
  
  if (rodLevelEl) rodLevelEl.textContent = upgrades.rodLevel;
  if (weightLevelEl) weightLevelEl.textContent = upgrades.weightLevel;
  if (maxTierEl) maxTierEl.textContent = getMaxTier();
  if (maxWeightEl) maxWeightEl.textContent = formatWeight(getMaxWeight());
  
  const rodCost = Math.floor(100 * Math.pow(1.5, upgrades.rodLevel - 1));
  const weightCost = Math.floor(80 * Math.pow(1.4, upgrades.weightLevel - 1));
  
  if (rodCostEl) rodCostEl.textContent = `${rodCost} 💰`;
  if (weightCostEl) weightCostEl.textContent = `${weightCost} 💰`;
  
  if (rodBtn) rodBtn.disabled = coins < rodCost;
  if (weightBtn) weightBtn.disabled = coins < weightCost;
}

// Upgrade handlers
setTimeout(() => {
  const rodBtn = document.getElementById("upgradeRod");
  const weightBtn = document.getElementById("upgradeWeight");
  
  if (rodBtn) {
    rodBtn.addEventListener("click", () => {
      const cost = Math.floor(100 * Math.pow(1.5, upgrades.rodLevel - 1));
      if (coins >= cost) {
        coins -= cost;
        upgrades.rodLevel++;
        updateProgressUI();
        saveGame();
      }
    });
  }
  
  if (weightBtn) {
    weightBtn.addEventListener("click", () => {
      const cost = Math.floor(80 * Math.pow(1.4, upgrades.weightLevel - 1));
      if (coins >= cost) {
        coins -= cost;
        upgrades.weightLevel++;
        updateProgressUI();
        saveGame();
      }
    });
  }
}, 500);

function getMaxTier() {
  // Rod level determines max tier
  if (upgrades.rodLevel >= 50) return 10;
  if (upgrades.rodLevel >= 40) return 9;
  if (upgrades.rodLevel >= 30) return 8;
  if (upgrades.rodLevel >= 25) return 7;
  if (upgrades.rodLevel >= 20) return 6;
  if (upgrades.rodLevel >= 15) return 5;
  if (upgrades.rodLevel >= 10) return 4;
  if (upgrades.rodLevel >= 5) return 3;
  if (upgrades.rodLevel >= 3) return 2;
  return 1;
}

function getMaxWeight() {
  // Weight level determines max weight (in grams)
  return Math.min(100000, 1000 * upgrades.weightLevel);
}

/* ------------------------------
   FISHING LOGIC
------------------------------ */
function rollFish() {
  const maxTier = getMaxTier();
  const availableFish = fishes.filter(f => f.tier <= maxTier);
  
  // Calculate total chance
  let totalChance = 0;
  for (const f of availableFish) {
    totalChance += f.chance;
  }
  
  let roll = Math.random() * totalChance;
  let sum = 0;
  
  for (const f of availableFish) {
    sum += f.chance;
    if (roll <= sum) return f;
  }
  
  return availableFish[availableFish.length - 1]; // Fallback to last fish
}

function rollWeight() {
  const maxWeight = getMaxWeight();
  const random = Math.random();
  const exponentialFactor = 8;
  
  const weight = Math.floor(1 + (Math.pow(random, exponentialFactor) * (maxWeight - 1)));
  return weight;
}

function getWeightRarity(grams) {
  if (grams >= 50000) return "legendary";
  if (grams >= 10000) return "epic";
  if (grams >= 1000) return "rare";
  if (grams >= 500) return "uncommon";
  return "common";
}

function formatWeight(grams) {
  if (grams >= 1000) {
    return (grams / 1000).toFixed(2) + "kg";
  }
  return grams + "g";
}

function getFishValue(fish, weight) {
  const rarityMultiplier = {
    common: 1,
    uncommon: 5,
    rare: 15,
    epic: 40,
    legendary: 100,
    mythic: 300,
    ancient: 1000,
    celestial: 5000,
    divine: 25000,
    transcendent: 100000
  };
  
  // Base value from rarity (minimum reward even at 1g)
  const rarityBase = rarityMultiplier[fish.rarity] || 1;
  
  // Weight bonus (weight / 100 multiplied by rarity)
  const weightBonus = (weight / 100) * rarityBase;
  
  // Total = base rarity value + weight bonus
  const totalValue = rarityBase + weightBonus;
  
  return Math.floor(totalValue);
}

function catchFish() {
  const catchGrid = document.getElementById("catchGrid");
  
  if (catchGrid) {
    catchGrid.innerHTML = "";
  }
  
  const fish = rollFish();
  const weight = rollWeight();
  const weightRarity = getWeightRarity(weight);
  const value = getFishValue(fish, weight);
  
  // Add coins and XP
  coins += value;
  addXP(value);
  
  if (catchGrid) {
    const item = document.createElement("div");
    item.className = `catch-item ${fish.rarity !== "common" ? fish.rarity : ""}`;
    item.innerHTML = `
      <div class="catch-left">
        <div class="catch-fish-icon">${fish.icon}</div>
      </div>
      <div class="catch-right">
        <div class="catch-fish-name">${fish.name}</div>
        <div class="catch-rarity ${fish.rarity}">${fish.rarity.toUpperCase()}</div>
        <div class="catch-weight-container">
          <div class="catch-fish-weight ${weightRarity}">${formatWeight(weight)}</div>
          <div class="catch-rarity ${weightRarity}">${weightRarity.toUpperCase()}</div>
        </div>
        <div class="catch-value">+${value} 💰 | +${value} XP</div>
      </div>
    `;
    item.title = fish.name + " - " + formatWeight(weight);
    catchGrid.appendChild(item);
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
    card.dataset.rarity = fish.rarity;
    card.dataset.fishName = fish.name;
    cards[fish.name] = card;
    
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
      const existingName = existingCards[i].dataset.fishName;
      if (fish.name < existingName) {
        grid.insertBefore(newCard, existingCards[i]);
        inserted = true;
        break;
      }
    }
  }
  
  if (!inserted) {
    grid.appendChild(newCard);
  }
}

function updateTotal() {
  const total = Object.values(inventory).reduce((a, b) => a + b, 0);
  const totalEl = document.getElementById("total");
  if (totalEl) totalEl.textContent = total;
}

/* ------------------------------
   STATS
------------------------------ */
function updateStats() {
  const totalCatches = Object.values(inventory).reduce((a, b) => a + b, 0);
  const uniqueFish = Object.keys(inventory).length;
  
  document.getElementById("statTotal").textContent = totalCatches;
  document.getElementById("statUnique").textContent = uniqueFish;
  
  // Find rarest catch
  const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
  let rarestCatch = "None";
  
  for (const rarity of rarityOrder) {
    const fish = fishes.find(f => f.rarity === rarity && inventory[f.name] > 0);
    if (fish) {
      rarestCatch = `${fish.icon} ${fish.name}`;
      break;
    }
  }
  
  document.getElementById("statRarest").textContent = rarestCatch;
}

/* ------------------------------
   SAVE / LOAD + OFFLINE
------------------------------ */
function saveGame() {
  const saveData = {
    inventory,
    lastPlayed: Date.now(),
    playerLevel,
    playerXP,
    coins,
    upgrades
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) {
    updateProgressUI();
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
  
  if (data.playerLevel) playerLevel = data.playerLevel;
  if (data.playerXP) playerXP = data.playerXP;
  if (data.coins) coins = data.coins;
  if (data.upgrades) upgrades = data.upgrades;

  if (data.lastPlayed) {
    const secondsAway = Math.floor((Date.now() - data.lastPlayed) / 1000);
    const catches = Math.floor(secondsAway / AUTO_TIME);

    if (catches > 0) {
      const offlineCatches = {};
      let totalCoins = 0;
      let totalXP = 0;
      
      for (let i = 0; i < catches; i++) {
        const fish = rollFish();
        const weight = rollWeight();
        const value = getFishValue(fish, weight);
        
        // Don't add to inventory, just track for display
        if (!offlineCatches[fish.name]) {
          offlineCatches[fish.name] = { fish: fish, count: 0 };
        }
        offlineCatches[fish.name].count++;
        
        // Add coins and XP
        totalCoins += value;
        totalXP += value;
      }

      // Add rewards
      coins += totalCoins;
      playerXP += totalXP;
      
      // Level up check
      while (playerXP >= getXPForLevel(playerLevel + 1)) {
        playerXP -= getXPForLevel(playerLevel + 1);
        playerLevel++;
      }
      
      setTimeout(() => {
        showOfflineModal(offlineCatches, catches, secondsAway, totalCoins, totalXP);
      }, 500);
      
      saveGame();
    }
  }
  
  updateStats();
  updateProgressUI();
  resetTimer();
}

function showOfflineModal(offlineCatches, totalCatches, secondsAway, totalCoins, totalXP) {
  const modal = document.getElementById("offlineModal");
  const fishList = document.getElementById("offlineFishList");
  const totalEl = document.getElementById("offlineTotal");
  const timeEl = document.getElementById("offlineTime");
  const rewardsEl = document.getElementById("offlineRewards");
  
  if (!modal || !fishList || !totalEl || !timeEl) {
    return;
  }
  
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
  if (rewardsEl) rewardsEl.textContent = `+${totalCoins.toLocaleString()} 💰 | +${totalXP.toLocaleString()} XP`;
  
  fishList.innerHTML = "";
  
  for (const fishName in offlineCatches) {
    const data = offlineCatches[fishName];
    const item = document.createElement("div");
    item.className = `offline-fish-item ${data.fish.rarity !== "common" ? data.fish.rarity : ""}`;
    item.innerHTML = `
      <div class="fish-icon">${data.fish.icon}</div>
      <div class="fish-count">x${data.count}</div>
    `;
    fishList.appendChild(item);
  }
  
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
   SCENE SWITCHING
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
   MODAL HANDLERS
------------------------------ */
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

/* ------------------------------
   INIT
------------------------------ */
loadGame();
window.addEventListener("beforeunload", saveGame);