import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, Vector3, Vector2, Raycaster, Plane, Box3, Color } from 'three'

interface PlayerProps {
    mousePosition: { x: number; y: number }
    gameBounds: Box3
    tailSegments: number
    speed: number
}

// Tail segment component
function TailSegment({ position, index }: { position: Vector3; index: number }) {
    // Gradient color from blue to purple based on index
    const colorValue = Math.min(0.6 + index * 0.03, 1);
    const segmentColor = new Color(0.3, 0.3, colorValue);

    // Size gets slightly smaller the further back in the tail
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

function Player({ mousePosition, gameBounds, tailSegments, speed }: PlayerProps) {
    const playerRef = useRef<Mesh>(null)
    const { camera } = useThree()
    const speedRef = useRef(speed)
    const raycaster = useRef(new Raycaster())
    const plane = useRef(new Plane(new Vector3(0, 1, 0), 0))
    const targetPoint = useRef(new Vector3())
    const mouse2D = useRef(new Vector2())

    // Store tail segment positions
    const [tailPositions, setTailPositions] = useState<Vector3[]>([]);

    // Store player position history for tail segments to follow
    const positionHistory = useRef<Vector3[]>([]);
    const MAX_HISTORY = 300; // Maximum positions to store (for very long tails)
    const SEGMENT_SPACING = 5; // How many positions to skip between segments

    // Update speed ref when speed prop changes
    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    const [debug, setDebug] = useState(false)

    const shortestAngleBetween = (a1: number, a2: number) => {
        const normalize = (angle: number) => {
            return ((angle + Math.PI) % (Math.PI * 2)) - Math.PI
        }

        const diff = normalize(a2 - a1)
        return diff
    }

    // Function to constrain position within game boundaries
    const constrainToGameBounds = (position: Vector3): Vector3 => {
        return new Vector3(
            Math.max(gameBounds.min.x, Math.min(gameBounds.max.x, position.x)),
            position.y,
            Math.max(gameBounds.min.z, Math.min(gameBounds.max.z, position.z))
        )
    }

    // Initialize position history
    useEffect(() => {
        const initialPosition = new Vector3(0, 0.5, 0);
        positionHistory.current = Array(MAX_HISTORY).fill(initialPosition.clone());
    }, []);

    useFrame(() => {
        if (!playerRef.current || !camera) return

        mouse2D.current.set(mousePosition.x, mousePosition.y)
        raycaster.current.setFromCamera(mouse2D.current, camera)

        if (raycaster.current.ray.intersectPlane(plane.current, targetPoint.current)) {
            const direction = new Vector3()
            direction.subVectors(targetPoint.current, playerRef.current.position)
            direction.y = 0

            if (direction.length() > 0.1) {
                direction.normalize()

                const targetAngle = Math.atan2(direction.x, direction.z)
                const currentRotation = playerRef.current.rotation.y
                const angleDifference = shortestAngleBetween(currentRotation, targetAngle)
                playerRef.current.rotation.y += angleDifference * 0.1

                // Calculate potential new position - use the dynamic speed
                const newX = camera.position.x + direction.x * speedRef.current
                const newZ = camera.position.z + direction.z * speedRef.current

                // Check if new position is within bounds
                const constrainedPosition = constrainToGameBounds(new Vector3(newX, camera.position.y, newZ))

                // Update camera and player positions
                camera.position.x = constrainedPosition.x
                camera.position.z = constrainedPosition.z
                playerRef.current.position.x = camera.position.x
                playerRef.current.position.z = camera.position.z

                // Record the current position for tail segments
                const currentPos = new Vector3(
                    playerRef.current.position.x,
                    0.5, // Fixed height
                    playerRef.current.position.z
                );

                // Shift history and add new position
                positionHistory.current.unshift(currentPos);
                positionHistory.current = positionHistory.current.slice(0, MAX_HISTORY);

                // Update tail positions
                if (tailSegments > 0) {
                    const newTailPositions = [];
                    for (let i = 0; i < tailSegments; i++) {
                        const historyIndex = Math.min((i + 1) * SEGMENT_SPACING, positionHistory.current.length - 1);
                        newTailPositions.push(positionHistory.current[historyIndex].clone());
                    }
                    setTailPositions(newTailPositions);
                }
            }
        }
    })

    return (
        <>
            <mesh ref={playerRef} position={[0, 0.5, 0]} castShadow>
                {/* Player body */}
                <meshStandardMaterial color="#4c9eff" />
                <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />

                {/* Player direction indicator (front part) */}
                <mesh position={[0, 0, -0.4]}>
                    <coneGeometry args={[0.2, 0.4, 16]} />
                    <meshStandardMaterial color="#66c2ff" />
                </mesh>

                {/* Red dot indicator for player direction */}
                <mesh position={[0, 0.3, -0.4]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial
                        color="#ff3333"
                        emissive="#ff0000"
                        emissiveIntensity={0.8}
                    />
                </mesh>
            </mesh>

            {/* Render tail segments */}
            {tailPositions.map((position, index) => (
                <TailSegment key={index} position={position} index={index} />
            ))}

            {/* Optional debug visualizer for target point */}
            {debug && (
                <mesh position={[targetPoint.current.x, 0.1, targetPoint.current.z]}>
                    <sphereGeometry args={[0.2, 8, 8]} />
                    <meshBasicMaterial color="red" />
                </mesh>
            )}
        </>
    )
}

export default Player 