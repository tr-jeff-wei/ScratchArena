/* ScratchArena — mock data layer (plain JS, no build step). */

const SA_LEVELS = [
  {
    id: "1",
    name: "Sprite Sprint",
    tagline: "Master motion blocks under pressure",
    difficulty: "rookie",
    category: "Movement",
    playerCount: 4821,
    highScore: 1500,
    maxScore: 2000,
    thumbGradient: ["#3d5a80", "#182741"],
    instructions: [
      "Use only Motion and Looks blocks to guide the sprite to the flag.",
      "Changing any block outside the editable zone results in an instant fail.",
      "Fastest path to the goal earns the highest score multiplier.",
    ],
    allowedBlocks: ["move 10 steps", "turn right/left", "go to x/y", "glide"],
  },
  {
    id: "2",
    name: "Event Horizon",
    tagline: "Chain broadcasts without breaking sync",
    difficulty: "skilled",
    category: "Events",
    playerCount: 3190,
    highScore: 2350,
    maxScore: 3000,
    thumbGradient: ["#ff8c1a", "#b34d00"],
    instructions: [
      "Trigger the broadcast chain in the exact order shown in the spec panel.",
      "Only 'when I receive' and 'broadcast' blocks may be modified.",
      "Timing drift beyond 200ms will fail validation.",
    ],
    allowedBlocks: ["when I receive", "broadcast", "broadcast and wait", "wait seconds"],
  },
  {
    id: "3",
    name: "Variable Vortex",
    tagline: "Wrangle state across a swarm of clones",
    difficulty: "expert",
    category: "Data",
    playerCount: 1442,
    highScore: 4100,
    maxScore: 5000,
    thumbGradient: ["#7ea8d8", "#24344a"],
    instructions: [
      "Use local variables only — global variable writes are disallowed.",
      "Clone count must stay within the 50-clone budget shown in the HUD.",
      "Score is weighted by both accuracy and clone efficiency.",
    ],
    allowedBlocks: ["create clone of", "delete this clone", "set variable", "change variable"],
  },
  {
    id: "4",
    name: "Boolean Blitz",
    tagline: "Logic gates at competition speed",
    difficulty: "expert",
    category: "Logic",
    playerCount: 987,
    highScore: 3760,
    maxScore: 5000,
    thumbGradient: ["#ff9d2e", "#7ea8d8"],
    instructions: [
      "Build the truth table using only 'and', 'or', and 'not' operator blocks.",
      "The sensing blocks provided may not be swapped or removed.",
      "Partial credit is awarded for each correctly resolved logic branch.",
    ],
    allowedBlocks: ["and", "or", "not", "if / else", "sensing touching"],
  },
  {
    id: "5",
    name: "Pen & Precision",
    tagline: "Draw the exact vector path, pixel-perfect",
    difficulty: "legendary",
    category: "Rendering",
    playerCount: 312,
    highScore: 4890,
    maxScore: 6000,
    thumbGradient: ["#ffd23f", "#e56f00"],
    instructions: [
      "Only Pen extension blocks and Motion blocks are editable.",
      "Final drawing is scored against a pixel-diff of the reference path.",
      "Any stray pen-down outside the bounding box results in disqualification.",
    ],
    allowedBlocks: ["pen down", "pen up", "set pen color", "go to x/y", "move 10 steps"],
  },
  {
    id: "6",
    name: "List Legion",
    tagline: "Sort, search, and shuffle under the clock",
    difficulty: "skilled",
    category: "Data",
    playerCount: 2578,
    highScore: 2900,
    maxScore: 3500,
    thumbGradient: ["#5b7ea8", "#0f1a2e"],
    instructions: [
      "Implement the sort using only list blocks — no helper variables allowed.",
      "The starter list structure must remain untouched.",
      "Leaderboard rank is determined by lowest block count at full accuracy.",
    ],
    allowedBlocks: ["add to list", "delete of list", "item # of list", "length of list"],
  },
];

function saBuildLeaderboards() {
  const boards = {};
  SA_LEVELS.forEach((level) => {
    boards[level.id] = [
      { id: `${level.id}-1`, rank: 1, playerName: "NovaByte", score: level.highScore, passedValidation: true, updatedAt: "2026-08-01T14:22:00Z" },
      { id: `${level.id}-2`, rank: 2, playerName: "PixelForge", score: Math.round(level.highScore * 0.91), passedValidation: true, updatedAt: "2026-08-01T09:03:00Z" },
      { id: `${level.id}-3`, rank: 3, playerName: "CtrlAltDefeat", score: Math.round(level.highScore * 0.85), passedValidation: true, updatedAt: "2026-07-31T21:47:00Z" },
      { id: `${level.id}-4`, rank: 4, playerName: "You", score: Math.round(level.highScore * 0.62), passedValidation: true, isCurrentUser: true, updatedAt: "2026-07-30T18:10:00Z" },
      { id: `${level.id}-5`, rank: 5, playerName: "SyntaxSiren", score: Math.round(level.highScore * 0.58), passedValidation: false, updatedAt: "2026-07-30T11:35:00Z" },
    ];
  });
  return boards;
}

const SA_LEADERBOARDS = saBuildLeaderboards();

function saGetLevel(id) {
  return SA_LEVELS.find((level) => level.id === id);
}
