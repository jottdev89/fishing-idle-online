/* ------------------------------
   CONFIG & DATA
------------------------------ */
const AUTO_TIME = 30;
const SAVE_KEY = "idle_fishing_save";
const PLAYER_ID_KEY = "idle_fishing_player_id";

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
let playerId = null;
let playerName = "Anonymous Fisher";
let cloudSaveTimeout = null;

const app = document.querySelector(".app");

/* ------------------------------
   PLAYER ID MANAGEMENT
------------------------------ */
function getOrCreatePlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

/* ------------------------------
   FIREBASE CLOUD SAVE
------------------------------ */
async function saveToCloud() {
  if (!window.db || !playerId) return;
  
  try {
    const { doc, setDoc } = window.firestore;
    const playerRef = doc(window.db, "players", playerId);
    
    const totalCatches = Object.values(inventory).reduce((a, b) => a + b, 0);
    const uniqueFish = Object.keys(inventory).length;
    
    await setDoc(playerRef, {
      name: playerName,
      inventory: inventory,
      lastPlayed: Date.now(),
      totalCatches: totalCatches,
      uniqueFish: uniqueFish,
      updatedAt: Date.now()
    });
    
    updateCloudStatus("synced", "☁️ Saved");
  } catch (error) {
    console.error("Cloud save error:", error);
    updateCloudStatus("error", "⚠️ Save failed");
  }
}

async function loadFromCloud() {
  if (!window.db || !playerId) return null;
  
  try {
    const { doc, getDoc } = window.firestore;
    const playerRef = doc(window.db, "players", playerId);
    const docSnap = await getDoc(playerRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Cloud load error:", error);
    return null;
  }
}

function updateCloudStatus(status, text) {
  const statusEl = document.getElementById("cloudStatus");
  const iconEl = document.getElementById("cloudIcon");
  const textEl = document.getElementById("cloudText");
  
  if (statusEl && iconEl && textEl) {
    statusEl.className = `cloud-status ${status}`;
    textEl.textContent = text;
    
    if (status === "synced") {
      iconEl.textContent = "✓";
    } else if (status === "error") {
      iconEl.textContent = "⚠️";
    } else {
      iconEl.textContent = "☁️";
    }
  }
}

function scheduledCloudSave() {
  if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
  updateCloudStatus("saving", "Saving...");
  cloudSaveTimeout = setTimeout(() => {
    saveToCloud();
  }, 2000);
}

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
  updateStats();
  saveGame();
  scheduledCloudSave();
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
  document.getElementById("total").textContent = total;
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
   LEADERBOARD
------------------------------ */
async function loadLeaderboard(type = "catches") {
  const leaderboardEl = document.getElementById("leaderboard");
  if (!leaderboardEl || !window.db) return;
  
  leaderboardEl.innerHTML = '<div class="loading">Loading...</div>';
  
  try {
    const { collection, query, orderBy, limit, getDocs } = window.firestore;
    const field = type === "catches" ? "totalCatches" : "uniqueFish";
    
    const q = query(
      collection(window.db, "players"),
      orderBy(field, "desc"),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      leaderboardEl.innerHTML = '<div class="loading">No players yet</div>';
      return;
    }
    
    leaderboardEl.innerHTML = "";
    let rank = 1;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const item = document.createElement("div");
      item.className = "leaderboard-item";
      
      const rankClass = rank <= 3 ? `rank-${rank}` : "";
      const scoreLabel = type === "catches" ? "catches" : "unique fish";
      
      item.innerHTML = `
        <div class="rank ${rankClass}">#${rank}</div>
        <div class="player-info">
          <div class="player-name">${data.name || "Anonymous"}</div>
          <div class="player-score">${data[field] || 0} ${scoreLabel}</div>
        </div>
      `;
      
      leaderboardEl.appendChild(item);
      rank++;
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    leaderboardEl.innerHTML = '<div class="loading">Error loading leaderboard</div>';
  }
}

/* ------------------------------
   GLOBAL STATS
------------------------------ */
async function loadGlobalStats() {
  if (!window.db) return;
  
  try {
    const { collection, getDocs } = window.firestore;
    const snapshot = await getDocs(collection(window.db, "players"));
    
    let totalPlayers = 0;
    let totalFish = 0;
    
    snapshot.forEach((doc) => {
      totalPlayers++;
      const data = doc.data();
      totalFish += data.totalCatches || 0;
    });
    
    document.getElementById("globalPlayers").textContent = totalPlayers.toLocaleString();
    document.getElementById("globalFish").textContent = totalFish.toLocaleString();
  } catch (error) {
    console.error("Global stats error:", error);
  }
}

/* ------------------------------
   SAVE / LOAD + OFFLINE
------------------------------ */
function saveGame() {
  const saveData = {
    inventory,
    lastPlayed: Date.now(),
    playerName
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

async function loadGame() {
  playerId = getOrCreatePlayerId();
  
  // Try to load from cloud first
  updateCloudStatus("loading", "Loading...");
  const cloudData = await loadFromCloud();
  
  if (cloudData) {
    // Use cloud save
    if (cloudData.inventory) {
      Object.assign(inventory, cloudData.inventory);
      for (const name in inventory) {
        const fish = fishes.find(f => f.name === name);
        if (fish) updateCard(fish);
      }
      updateTotal();
    }
    
    if (cloudData.name) {
      playerName = cloudData.name;
      document.getElementById("playerName").textContent = playerName;
    }
    
    // Check for offline catches
    if (cloudData.lastPlayed) {
      const secondsAway = Math.floor((Date.now() - cloudData.lastPlayed) / 1000);
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
        
        setTimeout(() => {
          showOfflineModal(offlineCatches, catches, secondsAway);
        }, 500);
        
        saveGame();
        saveToCloud();
      }
    }
    
    updateCloudStatus("synced", "☁️ Synced");
  } else {
    // No cloud save, try local
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      
      if (data.inventory) {
        Object.assign(inventory, data.inventory);
        for (const name in inventory) {
          const fish = fishes.find(f => f.name === name);
          if (fish) updateCard(fish);
        }
        updateTotal();
      }
      
      if (data.playerName) {
        playerName = data.playerName;
        document.getElementById("playerName").textContent = playerName;
      }
    }
    
    // Save to cloud for first time
    saveToCloud();
  }
  
  updateStats();
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
  
  fishList.innerHTML = "";
  
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
    
    // Load data when switching to certain scenes
    if (target === "clan") {
      loadLeaderboard("catches");
    } else if (target === "pvp") {
      loadGlobalStats();
    }
  });
});

/* ------------------------------
   LEADERBOARD TABS
------------------------------ */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadLeaderboard(btn.dataset.tab);
  });
});

/* ------------------------------
   NAME CHANGE
------------------------------ */
document.getElementById("changeNameBtn").addEventListener("click", () => {
  const modal = document.getElementById("nameModal");
  const input = document.getElementById("nameInput");
  input.value = playerName;
  modal.classList.add("active");
  modal.style.display = "flex";
});

document.getElementById("cancelName").addEventListener("click", () => {
  const modal = document.getElementById("nameModal");
  modal.classList.remove("active");
  modal.style.display = "none";
});

document.getElementById("saveName").addEventListener("click", () => {
  const input = document.getElementById("nameInput");
  const newName = input.value.trim();
  
  if (newName.length > 0) {
    playerName = newName;
    document.getElementById("playerName").textContent = playerName;
    saveGame();
    saveToCloud();
  }
  
  const modal = document.getElementById("nameModal");
  modal.classList.remove("active");
  modal.style.display = "none";
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
window.addEventListener("beforeunload", () => {
  saveGame();
  if (window.db && playerId) {
    saveToCloud();
  }
});