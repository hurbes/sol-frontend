import { useState, useRef } from 'react';

export const GAME_STATE = {
    PLAYING: 'playing',
    GAME_OVER: 'gameover'
};


export function useGameState() {
    const [gameState, setGameState] = useState(GAME_STATE.PLAYING);
    const [collectedGems, setCollectedGems] = useState(0);
    const gameOverTime = useRef(0);
    

    const handleGameOver = () => {
        if (gameState === GAME_STATE.PLAYING) {
            setGameState(GAME_STATE.GAME_OVER);
        }
    };

    const handleRestart = () => {
        setCollectedGems(0);
        gameOverTime.current = 0;
        setGameState(GAME_STATE.PLAYING);
    };
    

    const collectGem = () => {
        setCollectedGems(prev => prev + 1);
    };

    const updateGameOverTime = (deltaTime: number) => {
        if (gameState === GAME_STATE.GAME_OVER) {
            gameOverTime.current += deltaTime;
        }
    };
    
    return {
        gameState,
        collectedGems,
        gameOverTime: gameOverTime.current,
        isGameOver: gameState === GAME_STATE.GAME_OVER,
        isPlaying: gameState === GAME_STATE.PLAYING,
        handleGameOver,
        handleRestart,
        collectGem,
        updateGameOverTime
    };
} 