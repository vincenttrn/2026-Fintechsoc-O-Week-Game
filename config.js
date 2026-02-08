// Configuration for the Crash Game
const CONFIG = {
  // Society branding
  society: {
    name: "FinTech Society",
    tagline: "O-Week 2026"
  },

  // Game timing - stock-like GBM volatility
  game: {
    updateInterval: 60,
    minRoundDuration: 3000,
    maxRoundDuration: 20000,
    volatilityPerSecond: 0.45, // GBM sigma (per-second); higher = wilder swings
    crashWeightLow: 0.75,
    crashWeightMed: 0.20,
    crashWeightHigh: 0.05
  },

  // Prize tiers (multiplier thresholds) - ADJUSTED FOR HARDER PRIZES
  // Order: sticker < lanyard < fan < deck < shirt < bottle
  prizes: {
    sticker: { min: 0, max: 1.49, name: "Sticker", color: "#888" },           // EASIEST
    lanyard: { min: 1.5, max: 2.29, name: "Lanyard", color: "#4CAF50" },       // HARDER
    fan: { min: 2.3, max: 3.29, name: "Fan", color: "#2196F3" },               // HARDER
    deck: { min: 3.3, max: 3.74, name: "SIG Card Deck", color: "#9C27B0" },   // RARER (24 decks)
    shirt: { min: 3.75, max: 4.19, name: "SIG Shirt", color: "#E91E63" },     // RARER (11 shirts)
    bottle: { min: 4.2, max: Infinity, name: "Bottle", color: "#FFD700" }       // RAREST
  },

  // Initial inventory (editable)
  inventory: {
    sticker: 999, // effectively unlimited
    lanyard: 90,
    fan: 75,
    deck: 24,
    shirt: 11,
    bottle: 50
  },

  // Rigging configuration - INCREASED PROTECTION (HARDER PRIZES)
  rigging: {
    enabled: true,
    // Adjust crash probability based on remaining inventory
    // Higher values = more aggressive inventory protection
    inventoryProtectionFactor: {
      bottle: 5.0,  // EXTREMELY RARE
      shirt: 4.2,   // VERY RARE (11 shirts)
      deck: 3.5,    // RARE (24 decks)
      fan: 3.5,     // VERY RARE
      lanyard: 2.0, // RARE
      sticker: 1.0  // No protection
    }
  },

  // UI colors
  theme: {
    background: "#161616",
    accent: "#CA3528",
    success: "#4CAF50",
    warning: "#FF9800",
    text: "#FFFFFF",
    textSecondary: "#999"
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
