import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, Vector3, Vector2, Raycaster, Plane, Box3, Color } from 'three'

interface PlayerProps {
    mousePosition: { x: number; y: number }
    gameBounds: Box3
    tailSegments: number
    speed: number
    gameState?: string
}


function TailSegment({ position, index }: { position: Vector3; index: number }) {

    const colorValue = Math.min(0.6 + index * 0.03, 1);
    const segmentColor = new Color(0.3, 0.3, colorValue);


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

function Player({ mousePosition, gameBounds, tailSegments, speed, gameState = 'playing' }: PlayerProps) {
    const playerRef = useRef<Mesh>(null)
    const { camera } = useThree()
    const speedRef = useRef(speed)
    const raycaster = useRef(new Raycaster())
    const plane = useRef(new Plane(new Vector3(0, 1, 0), 0))
    const targetPoint = useRef(new Vector3())
    const mouse2D = useRef(new Vector2())


    const [tailPositions, setTailPositions] = useState<Vector3[]>([]);


    const positionHistory = useRef<Vector3[]>([]);
    const MAX_HISTORY = 300;
    const SEGMENT_SPACING = 5;


    const gameOverTime = useRef(0);


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


    const constrainToGameBounds = (position: Vector3): Vector3 => {
        return new Vector3(
            Math.max(gameBounds.min.x, Math.min(gameBounds.max.x, position.x)),
            position.y,
            Math.max(gameBounds.min.z, Math.min(gameBounds.max.z, position.z))
        )
    }


    useEffect(() => {
        const initialPosition = new Vector3(0, 0.5, 0);
        positionHistory.current = Array(MAX_HISTORY).fill(initialPosition.clone());
    }, []);

    useFrame((state) => {
        if (!playerRef.current || !camera) return


        if (gameState === 'gameover') {

            gameOverTime.current += 0.05;
            const shakeAmount = Math.exp(-gameOverTime.current) * 0.2;


            if (playerRef.current) {
                playerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * shakeAmount;
                playerRef.current.position.y = 0.5 + Math.sin(gameOverTime.current * 5) * 0.1;


                playerRef.current.children.forEach((child, index) => {
                    if (child instanceof Mesh) {
                        child.position.y -= 0.02;
                    }
                });
            }

            return;
        }


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


                const newX = camera.position.x + direction.x * speedRef.current
                const newZ = camera.position.z + direction.z * speedRef.current


                const constrainedPosition = constrainToGameBounds(new Vector3(newX, camera.position.y, newZ))


                camera.position.x = constrainedPosition.x
                camera.position.z = constrainedPosition.z
                playerRef.current.position.x = camera.position.x
                playerRef.current.position.z = camera.position.z


                const currentPos = new Vector3(
                    playerRef.current.position.x,
                    0.5,
                    playerRef.current.position.z
                );


                positionHistory.current.unshift(currentPos);
                positionHistory.current = positionHistory.current.slice(0, MAX_HISTORY);


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