# 🎮 Crash Game - O-Week Edition

A fintech-themed multiplier crash game designed for O-Week events. Players watch a multiplier increase and must cash out before it crashes to win prizes!

## 🎯 Features

- **Crash-style gameplay** with real-time multiplier updates
- **6-tier prize system**: Stickers, Lanyards, Fans, Shirt, Cards and Bottles
- **Inventory management** with automatic tracking
- **Smart prize allocation** ensure rare prizes stay rare
- **Admin panel** for inventory control and statistics
- **Beautiful animations** including confetti, screen shake, and smooth transitions
- **Responsive design** - works on laptops (Windows and Mac (and probably linux too))
- **Dark theme** with custom branding

## 🚀 Quick Start
# How to Run the Crash Game

---

## Easiest way: open the game in your browser

1. **Find the game folder**  
   It’s the folder that contains a file named **`index.html`** (and other files like `game.js`, `styles.css`).

2. **Open the game**
   - **Windows:** Double‑click **`index.html`**.  
     If asked “How do you want to open this file?”, choose **Chrome**, **Edge**, or **Firefox**.
   - **Mac:** Double‑click **`index.html`**.  
     It should open in your default browser.  
     If it opens in a text editor instead, right‑click `index.html` → **Open With** → **Chrome** (or Safari/Firefox).


---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| Double‑clicking `index.html` doesn’t open a game | Right‑click `index.html` → **Open with** → choose **Chrome** or **Edge**. |
---

## 👀How the Game Works
- Players press **"START ROUND"** and will see a moving stock price which indicates a multiple of their original buy in
- Depending on where the stock multiple is, the player lies within a prize range
- There is a probability the stock will crash, leaving them with the minimum, prize of a sticker

## 🎲 How to Play
1. The Home page has the Fintech Logo and Mascot, with all the prizes avaliable to win, you can click on the prizes to enlarge them for viewing
2. Click **"START PLAYING"** on the welcome screen
3. Click **"START ROUND"** to begin
4. Watch the multiplier increase from 1.00x
5. Click **"💰 CASH OUT"** before it crashes
6. Higher multipliers = better prizes
7. Click **"RETURN HOME"** to go back to the welcome screen

### Prize Tiers

| Multiplier | Prize | Initial Stock |
|------------|-------|---------------|
| 4.2x+ | 🍾 Bottle | 50 |
| 2.3x - 3.3x | 👕 SIG Shirt | 11 |
| 3.3x - 3.75x | 🀄 SIG Card Deck | 24 |
| 2.3x - 3.3x | 💨 Fan | 75 |
| 1.5x - 2.3x | 🎫 Lanyard | 90 |
| < 1.5x or Crash | ⭐ Sticker | Unlimited |

## ⚙️ Admin Panel

Access the admin panel from the welcome screen to:

- **Adjust inventory levels** for each prize
- **View statistics** (total games played, prizes given)
- **Reset statistics** if needed

All data is stored in browser localStorage, so it persists between sessions.
Across different devices or days, feel free to adjust count of current inventory with whoever was at the stall last, (although stock may not be accurate), this will ensure that the game will provide the player a higher tier prize if the one they won is unavaliable

### Setup Checklist

- [ ] Set initial inventory levels in admin panel
- [ ] Test on the device you'll use at the stall
- [ ] Ensure screen is visible to participants

## 🔧 Technical Details

### Game Mechanics

- **Update frequency**: 150ms (configurable)
- **Crash distribution**: 
  - 60% chance: 1.0x - 2.0x
  - 30% chance: 2.0x - 4.0x
  - 10% chance: 4.0x+
- **Inventory-aware rigging**: Automatically reduces crash points when prize inventory is low

### Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Data Storage

All game data is stored in browser localStorage:
- `crashGameInventory` - Current prize inventory
- `crashGameStats` - Game statistics

To reset everything, clear the browser's localStorage or use the admin panel.




## 🎨 Customisation (if anything goes wrong)

### Change Society Branding

1. Replace the images in `/public/assets/`:
   - `logo.png` - Your society logo
   - `mascot.png` - Your mascot (optional)

2. Edit `config.js`:
   ```javascript
   society: {
     name: "Your Society Name",
     tagline: "O-Week 2026"
   }
   ```

### Adjust Prize Thresholds

In `config.js`, modify the prize multiplier ranges:

```javascript
prizes: {
  sticker: { min: 0, max: 1.19, name: "Sticker", color: "#888" },
  lanyard: { min: 1.2, max: 1.79, name: "Lanyard", color: "#4CAF50" },
  fan: { min: 1.8, max: 2.59, name: "Fan", color: "#2196F3" },
  bottle: { min: 2.6, max: Infinity, name: "Bottle", color: "#FFD700" }
}
```

### Change Colors

Modify the theme colors in `config.js`:

```javascript
theme: {
  background: "#161616",  // Dark background
  accent: "#CA3528",      // Red accent
  success: "#4CAF50",     // Green
  warning: "#FF9800",     // Orange
  text: "#FFFFFF",        // White text
  textSecondary: "#999"   // Gray text
}
```

### Adjust Inventory Protection

Control how aggressively the game protects rare prizes:

```javascript
rigging: {
  enabled: true,
  inventoryProtectionFactor: {
    bottle: 3.0,   // Very rare (higher = more rare)
    fan: 2.0,      // Medium rare
    lanyard: 1.2,  // Slightly rare
    sticker: 1.0   // No protection
  }
}
```





## 🐛 Troubleshooting

**Game won't load?**
- Check that all files are in the correct directories
- Try opening in an incognito/private window
- Clear browser cache and reload

**Animations laggy?**
- Close other browser tabs
- Try a different browser
- Reduce canvas update frequency in `config.js`

**Stats not saving?**
- Check that localStorage is enabled in browser
- Don't use private/incognito mode for the main game

**Running out of prizes too quickly?**
- Increase the inventory protection factors in `config.js`
- The game will automatically make rare prizes even more rare as stock depletes

## 📤 Files



| Path | Purpose |
|------|--------|
| `index.html` | Main game page |
| `game.js` | Game logic |
| `styles.css` | Styling |
| `config.js` | Customization (prizes, theme, society name) |
| `public/favicon.png` | Browser tab icon |
| `public/assets/logo.png` | Society logo |
| `public/assets/mascot.png` | Mascot image |
| `public/assets/prizes/*.jpg` | Prize images (bottle, shirt, deck, fan, lanyard, sticker1–3) |
| `README.md` | Project overview and customization |

| `.gitignore` | Keeps repo clean |



---


## 💡 Credits

Built for O-Week events. Inspired by crash-style multiplayer betting games, adapted for prize distribution at university society stalls.

---

**Need help?** Check the `config.js` file for all customizable options!
