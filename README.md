
# Adaptarcade 🎮

Adaptarcade is a modern web-based arcade featuring a collection of fun and interactive mini-games. Built with a sleek design and smooth animations, it offers a delightful user experience.

![Adaptarcade Screenshot](https://placehold.co/800x450.png?text=Adaptarcade+Gameplay+Screenshot)
*Suggestion: Replace the placeholder above with an actual screenshot or GIF of your application!*

## ✨ Features

*   **Vibrant & Dynamic UI:** Smooth animations and a cohesive purple-themed gradient design.
*   **Multiple Mini-Games:**
    *   **Precision Tap:** Test your speed and accuracy by tapping targets before they grow too large or disappear. Features different modes with varying decoy frequencies.
    *   **Quick Click Challenge:** A simple yet addictive game to see how many times you can click a button in 5 seconds.
    *   **Mole Mash:** The classic whack-a-mole game! Hit the moles as they pop up. Offers multiple difficulty levels.
    *   **Speed Typer:** Measure your typing speed (WPM) and accuracy with various test durations and a live performance graph.
*   **Local Leaderboards:** Each game saves your high scores locally in the browser.
*   **Responsive Design:** Playable across different screen sizes.
*   **Client-Side Rendering:** Built with Next.js for a fast and interactive experience.

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v15+ with App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animation:** [Framer Motion](https://www.framer.com/motion/)
*   **AI (Core/Future):** [Genkit (by Google)](https://firebase.google.com/docs/genkit) - Currently integrated but not heavily utilized in the games.
*   **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/adaptarcade.git
    cd adaptarcade
    ```
    *(Replace `https://github.com/your-username/adaptarcade.git` with your actual repository URL if you've hosted it.)*

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```
    Or using pnpm:
    ```bash
    pnpm install
    ```

### Running the Development Server

To start the development server (usually on `http://localhost:9002` as configured in `package.json`):

```bash
npm run dev
```

Or using yarn:

```bash
yarn dev
```

Or using pnpm:

```bash
pnpm dev
```

The application will automatically reload if you change any ofthe source files.

### Building for Production

To create an optimized production build:

```bash
npm run build
```

Then, to start the production server:

```bash
npm run start
```

## 📂 Project Structure

A brief overview of the key directories:

```
/
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (pages, layouts)
│   │   ├── games/        # Individual game pages
│   │   ├── globals.css   # Global styles and Tailwind theme
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main game hub page
│   ├── components/       # UI components (ShadCN, custom game components)
│   │   ├── core/         # Core application components (e.g., SafeAnalytics)
│   │   ├── game/         # Reusable components for games (HUD, GameCard, etc.)
│   │   └── ui/           # ShadCN UI components
│   ├── hooks/            # Custom React hooks (game logic, utility hooks)
│   ├── lib/              # Utility functions (localStorage, etc.)
│   ├── ai/               # Genkit related files (flows, configuration)
│   └── types/            # TypeScript type definitions
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
└── README.md             # This file
```

## 🕹️ Games Overview

*   **Precision Tap:** Click dynamic targets for points. Targets grow, and points decay over time. Watch out for decoys!
*   **Quick Click Challenge:** How fast can you click? A 5-second burst of rapid clicking.
*   **Mole Mash:** Whack moles as they appear. Difficulty affects mole speed and appearance rate.
*   **Speed Typer:** Test your typing prowess. Choose a duration and type the provided text to measure your WPM and accuracy.

##🎨 Customization

*   **Theme:** Colors and base styles can be customized in `src/app/globals.css` by modifying the CSS variables.
*   **Fonts:** The primary font is "Space Grotesk" imported in `src/app/layout.tsx`.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve Adaptarcade, please feel free to:
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a PullRequest

## 📜 License

This project is currently unlicensed. Consider adding an open-source license like MIT if you wish to share it widely.

---

Enjoy playing at Adaptarcade!

