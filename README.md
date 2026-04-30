# 🗡️ Shadow Descent: The Elder Dungeon

**Shadow Descent** is a high-fidelity, turn-based roguelike dungeon crawler built with React, Vite, and Tailwind CSS. Experience a deep character creation system based on classic RPG mechanics, procedural dungeon generation, and a strategic survival experience where light is your most precious resource.

![Project Banner](https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=1000&auto=format&fit=crop)

## ✨ Features

- **🛡️ D&D 5e Inspired Character Creation**: Choose your Race (Human, Elf, Orc, Demon, Dwarf) and Class (Paladin, Ranger, Wizard, Fighter).
- **📊 Point-Buy System**: Strategically allocate your attributes (Str, Dex, Con, Int, Wis, Cha) to define your playstyle.
- **🗺️ Procedural Dungeon Generation**: Every run features a unique layout with rooms, corridors, stairs, and hidden secrets.
- **🔦 Dynamic Light System**: Manage your torch light level or rely on innate Dark Vision. Low light severely restricts your Field of Vision (FOV).
- **🎒 Inventory & Crafting**: Collect loot, dismantle broken equipment into materials, and craft essential survival tools like torches.
- **🏹 Ranged & Melee Combat**: Engage enemies with weapons ranging from Holy Avengers to Elven Longbows, each with unique range and damage stats.
- **🧙 Center-Focus Camera**: Smooth, player-centric camera movement for an immersive exploration feeling.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd shadow-descent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy the example environment file and fill in any required keys (if applicable):
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

### Production Build

To create an optimized production build:

```bash
npm run build
```

The output will be generated in the `dist/` directory.

---

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Move / Attack** | `WASD` or `Arrow Keys` |
| **Aim Ranged** | `Spacebar` (Hold) + `Direction` |
| **Fire Ranged** | Release `Spacebar` |
| **Inventory** | `I` Key |
| **Character Creation** | Automatic on Start |

---

## 🛠️ Built With

- **Framework**: [React 18+](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Motion (formerly Framer Motion)](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 📜 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the dungeon algorithms or add new races/classes, feel free to fork the repo and submit a PR. 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
