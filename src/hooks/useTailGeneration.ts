import { useState, useRef, useEffect } from 'react';
import { Vector3 } from 'three';


export function useTailGeneration(maxHistory: number = 300, segmentSpacing: number = 5) {
    const [tailPositions, setTailPositions] = useState<Vector3[]>([]);
    const positionHistory = useRef<Vector3[]>([]);
    
    
    useEffect(() => {
        const initialPosition = new Vector3(0, 0.5, 0);
        positionHistory.current = Array(maxHistory).fill(initialPosition.clone());
    }, [maxHistory]);
    

    const recordPosition = (position: Vector3, tailSegments: number) => {
        
        const currentPos = new Vector3(
            position.x,
            0.5,
            position.z
        );
        
        
        positionHistory.current.unshift(currentPos);
        positionHistory.current = positionHistory.current.slice(0, maxHistory);
        
        
        if (tailSegments > 0) {
            const newTailPositions = [];
            for (let i = 0; i < tailSegments; i++) {
                const historyIndex = Math.min(
                    (i + 1) * segmentSpacing, 
                    positionHistory.current.length - 1
                );
                newTailPositions.push(positionHistory.current[historyIndex].clone());
            }
            setTailPositions(newTailPositions);
        } else {
            
            setTailPositions([]);
        }
    };
    
    return {
        tailPositions,
        recordPosition
    };
} 