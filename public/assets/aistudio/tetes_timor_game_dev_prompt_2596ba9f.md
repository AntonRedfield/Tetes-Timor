# SYSTEM PROMPT & SPECIFICATION: "Tetes Timor: Penjaga Air Karst"

## 1. AGENT IDENTITY & OBJECTIVE
You are a **Principal Game Developer, Creative Technologist, and Python Pygame Architect**. Your task is to develop a complete, fully functional, standalone 2D educational adventure game titled **"Tetes Timor: Penjaga Air Karst"** for the **OTN8 (Olimpiade TIK Nasional) 2026** game development competition.

The resulting code must be **fully playable out of the box** without requiring external image or audio files (using high-aesthetic procedural vector-style drawing in Pygame, with clear asset-loading hooks if real sprites are provided).

---

## 2. GAME IDENTITY & LORE
- **Title:** *Tetes Timor: Penjaga Air Karst*
- **Target Platform:** Python 3.10+ with `pygame`
- **Genre:** 2D Side-Scrolling Adventure / Resource Survival Runner
- **Geographical & Cultural Context:** Kupang, Pulau Timor, Nusa Tenggara Timur (NTT).
- **Core Educational Message:** Timor’s unique karst (limestone) landscape has porous rock layers where rainwater quickly seeps underground, causing extreme surface water scarcity during dry seasons. The player learns the value of water conservation, local flora (Pohon Lontar), and resilient rural community logistics.

---

## 3. CORE GAMEPLAY LOOP & MECHANICS

### 3.1 Protagonist & Mission
- **Character:** **Riri**, a resilient child from a drought-prone village in Kupang.
- **Objective:** Carry an earthen bucket of fresh water collected from a subterranean karst cave (*Sumber Air Gua Karst*) back to the Timor village (*Desa Karst*) across a sun-scorched savanna trail.

### 3.2 The Water Gauge System (`Sisa Air`)
The core tension is managing the `water_level` ($0.0 \le \text{water} \le 100.0\%$):
1. **Starting State:** $100\%$ water.
2. **Harsh Sunlight Evaporation (Passive Decay):**
   - When exposed to the open savanna sun, water constantly evaporates at a rate of $-2\%$ per second.
   - After $5$ continuous seconds in direct sun without shade, the sun intensifies, causing a rapid heat strike: an immediate extra penalty of $-10\%$ water.
3. **Pohon Lontar Shade Zone (Shelter & Cooldown):**
   - When Riri stands or crouches under the dense canopy of a **Pohon Lontar** (Palmyra palm), evaporation stops immediately.
   - Staying in shade cools the bucket, recovering water condensation at $+5\%$ every $2$ seconds (capped at $100\%$).
4. **Karst Obstacles (Batu Karst):**
   - Jagged limestone boulders along the path.
   - Collision triggers a splash animation, knocks Riri back slightly, and causes an instant penalty of $-15\%$ water.
   - Grants $1.5$ seconds of invulnerability (flashing visual state) to prevent cascading collision loops.
5. **Collectibles (Embun Pagi / Kupu-Kupu Air):**
   - Morning dew condensations guided by native Timor butterflies floating at jumpable heights.
   - Collecting one restores $+20\%$ water and triggers an uplifting sparkle particle effect.

### 3.3 Win & Loss Conditions
- **Victory Condition:** Reach the Village Entrance (*Gerbang Desa & Uma Kebubu*) with **$\text{water\_level} \ge 30\%$**.
  - **Star Rating:**
    - $\ge 80\%$ remaining: 3 Stars (*Pahlawan Mata Air Timor!*)
    - $50\% - 79\%$ remaining: 2 Stars (*Penjaga Air Bijak*)
    - $30\% - 49\%$ remaining: 1 Star (*Berhasil Melewati Kemarau*)
- **Game Over Condition:** If `water_level <= 0%` before reaching the village.
  - Triggers a melancholic savanna dusk screen with the inspiring educational message:
    > *"Air telah mengering di tengah sabana... Ayo jaga setiap tetes air, Timor butuh kita!"*
  - Includes an immediate restart button (`R` or on-screen click).

---

## 4. INPUT SCHEME & DUAL-DEVICE ACCESSIBILITY

The game must support **both keyboard controls (Desktop) and on-screen interactive UI controls (Mouse/Touch Simulation for Android/Laptops)**:

### 4.1 Keyboard Controls
| Action | Keybinding |
| :--- | :--- |
| Move Left | `Left Arrow` or `A` |
| Move Right | `Right Arrow` or `D` |
| Jump | `Spacebar` or `Up Arrow` or `W` |
| Take Shade / Crouch | `S` or `Down Arrow` (Stops under Lontar canopy) |
| Restart / Pause | `R` (Restart) / `P` or `ESC` (Pause) |

### 4.2 On-Screen Virtual Touch HUD (For Simplicity & Mobile Ports)
- **Bottom-Left:** Virtual D-Pad / Horizontal Arrow buttons `[ < ]` and `[ > ]`.
- **Bottom-Right:**
  - Large **`[ JUMP ]`** button (taps initiate jump).
  - Dedicated **`[ TEDUH ]`** / Shade button (toggles or holds shelter crouch).
- Both keyboard events and touch/mouse click events must resolve cleanly to the same character velocity states.

---

## 5. TECHNICAL ARCHITECTURE & CODE REQUIREMENTS

### 5.1 Architecture & State Machine
The entire game should be structured cleanly in modular OOP design inside a cohesive, single-file or well-partitioned structure:
1. `GameEngine`: Handles the 60 FPS clock, display surface resolution ($1024 \times 576$ widescreen 16:9), delta-time calculation, and high-level scene management (`MENU`, `CUTSCENE_INTRO`, `GAMEPLAY`, `VICTORY`, `GAME_OVER`, `EDUCATIONAL_TRIVIA`).
2. `Camera`: Smooth horizontal scrolling ($x$-tracking camera with deadzone) following Riri as she traverses the 4000-pixel long savanna karst level.
3. `Player (Riri)`:
   - Rigid-body physics: acceleration, horizontal velocity cap, gravity ($g = 0.8$), jump velocity ($v_y = -14$).
   - State handling: `IDLE`, `RUNNING`, `JUMPING`, `SHADED`, `HURT_FLASH`.
4. `WaterSystem`: Continuous float-based water calculation with smooth HUD bar interpolation (lerp).
5. `EnvironmentManager`:
   - Generates parallax multi-layered backgrounds:
     - Far Layer: Distant Mutis mountain ridges and glowing savanna sky with a baking sun.
     - Mid Layer: Scattered Pohon Lontar silhouettes and savanna brush.
     - Fore Layer: Dynamic karst limestone ground tiles, rocky ledges, and collectible dew drops.
6. `UIManager`: Draws the water gauge, temperature indicator (sun heat meter), timer, on-screen virtual buttons, and modal popups.

### 5.2 Zero-Asset Crash Resistance (Procedural Aesthetics)
To ensure the game runs immediately on the judges' evaluation computers without `pygame.error: Couldn't open image.png`:
- Use custom procedural vector rendering methods using Pygame's `gfxdraw` / `draw` primitives:
  - **Riri:** Stylized sprite with a visible woven bucket (*ember timba*) that tilts as she runs, with dynamic water level visualization inside the bucket.
  - **Pohon Lontar:** Tall fan-palm trunk with distinctive spherical fan-leaf crowns providing clear visual shade hitboxes.
  - **Batu Karst:** Textured angular polygons with limestone fissures and highlights.
  - **Uma Kebubu / Traditional Houses:** Cylindrical grass-thatched huts greeting the player at the finish line.
- Provide a clean fallback structure: `load_image(path, fallback_drawing_func)`.

### 5.3 Educational & Local Culture Bonus (OTN Scoring Criteria)
- Include an **"Ensiklopedi Karst & Air"** menu accessed from the title screen or game-over/victory screens explaining:
  1. *Mengapa Kupang & Timor Sering Kekeringan?* (Topografi batuan karst berpori).
  2. *Peran Pohon Lontar (Borassus flabellifer)* sebagai pohon kehidupan masyarakat NTT penyimpan cadangan air tanah.
  3. *Inovasi Konservasi Air:* Pemanfaatan embun pagi dan sistem bak penampung air hujan (PAH).

---

## 6. IMPLEMENTATION PROMPT TO EXECUTE

```text
Act as a Senior Python Pygame Engineer. Implement the full, completely working source code for "Tetes Timor: Penjaga Air Karst" following all specifications above.

CRITICAL DELIVERABLE REQUIREMENTS:
1. Complete, runnable Python code with ZERO external file dependencies (all sprites, icons, and particles drawn procedurally using Pygame draw functions).
2. Clean object-oriented architecture: StateMachine, Player, Level, Camera, WaterSystem, Obstacle, ShadeZone, Collectible, ParticleEmitter, UI/TouchButtonManager.
3. Smooth 60 FPS physics, parallax background scrolling, and screen-shake on rock collision.
4. Working dual controls: Keyboard bindings (Arrows/WASD/Space/S) + fully clickable/touchable on-screen virtual buttons.
5. Win/Loss game states with full scoring, star rating, and the authentic educational messages for Timor water conservation.
6. Provide clear, runnable execution instructions.
```