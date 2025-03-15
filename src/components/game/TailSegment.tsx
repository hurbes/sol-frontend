import { Vector3, Color } from 'three'

interface TailSegmentProps {
    position: Vector3;
    index: number;
}


function TailSegment({ position, index }: TailSegmentProps) {
    // Calculate a color that gets brighter as the index increases
    const colorValue = Math.min(0.6 + index * 0.03, 1);
    const segmentColor = new Color(0.3, 0.3, colorValue);

    // Calculate a size that gets slightly smaller as the index increases
    const sizeMultiplier = Math.max(0.8, 1 - index * 0.015);
    const segmentSize = 0.25 * sizeMultiplier;

    return (
        <mesh position={position} castShadow>
            <boxGeometry args={[segmentSize, segmentSize, segmentSize]} />
            <meshStandardMaterial
                color={segmentColor}
                emissive={segmentColor}
                emissiveIntensity={0.5}
                metalness={0.7}
                roughness={0.2}
            />
        </mesh>
    );
}

export default TailSegment; 