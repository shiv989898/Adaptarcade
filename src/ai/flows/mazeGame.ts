// This is a mock AI flow file. In a real Genkit setup, these would be defined flows.
// These functions simulate interactions with an LLM.
import type { MazeData, Obstacle, PlayerPosition } from '@/types/maze';

/**
 * MOCK FUNCTION
 * Simulates an AI call to get obstacle placements for the current maze level.
 * In a real scenario, this would interact with a Genkit flow.
 */
export const getObstaclesForMaze = async (maze: MazeData, level: number): Promise<Obstacle[]> => {
  console.log(`AI: Requesting obstacles for level ${level}`);
  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const obstacles: Obstacle[] = [];
  const numObstacles = Math.floor(level / 2); // More obstacles at higher levels

  if (maze.length === 0 || maze[0].length === 0) return [];

  for (let i = 0; i < numObstacles; i++) {
    let r, c;
    // Try to find an empty cell that's not start or end
    let attempts = 0;
    do {
      r = Math.floor(Math.random() * maze.length);
      c = Math.floor(Math.random() * maze[0].length);
      attempts++;
    } while ((maze[r][c].isStart || maze[r][c].isEnd || maze[r][c].obstacleType) && attempts < 50);
    
    if (attempts < 50) {
      const obstacleTypes = ['rock', 'mud_patch', 'teleporter_decoy'];
      const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      obstacles.push({
        position: { r, c },
        type: randomType,
        description: `A mysterious ${randomType} appeared!`,
      });
    }
  }
  
  console.log(`AI: Generated ${obstacles.length} obstacles.`);
  return obstacles;
};

/**
 * MOCK FUNCTION
 * Simulates an AI call to get a hint for the player.
 * In a real scenario, this would interact with a Genkit flow.
 */
export const getHintForPlayer = async (maze: MazeData, playerPosition: PlayerPosition, level: number): Promise<string> => {
  console.log(`AI: Requesting hint for player at (${playerPosition.r}, ${playerPosition.c}) on level ${level}`);
  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 700));

  // Basic mock hint logic
  const possibleMoves: string[] = [];
  if (!maze[playerPosition.r][playerPosition.c].walls.top && playerPosition.r > 0) possibleMoves.push('North');
  if (!maze[playerPosition.r][playerPosition.c].walls.bottom && playerPosition.r < maze.length - 1) possibleMoves.push('South');
  if (!maze[playerPosition.r][playerPosition.c].walls.left && playerPosition.c > 0) possibleMoves.push('West');
  if (!maze[playerPosition.r][playerPosition.c].walls.right && playerPosition.c < maze[0].length - 1) possibleMoves.push('East');
  
  let hint = "Explore your options!";
  if (possibleMoves.length > 0) {
    hint = `Perhaps try going ${possibleMoves[Math.floor(Math.random() * possibleMoves.length)]}?`;
  }
  
  // Simulate a more "LLM-like" response
  const creativeHints = [
    "The path to victory is often winding. Look for an opening.",
    "Sometimes the longest way round is the shortest way home... or to the exit.",
    "Patience, young maze walker. The exit reveals itself to those who seek.",
    "Consider the paths less traveled. Or the most obvious one. AI is tricky!",
  ];
  if (Math.random() < 0.3) { // 30% chance of a creative hint
    hint = creativeHints[Math.floor(Math.random() * creativeHints.length)];
  }

  console.log(`AI: Generated hint: "${hint}"`);
  return hint;
};

// Make sure this file is imported in dev.ts if it were a real flow
// e.g. import './mazeGame'; in src/ai/dev.ts
