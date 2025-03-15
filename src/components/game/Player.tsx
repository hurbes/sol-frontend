import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, Vector3, Box3 } from 'three'


import TailSegment from './TailSegment'
import DirectionalArrow from './DirectionalArrow'


import { usePlayerMovement } from '../../hooks/usePlayerMovement'
import { useTailGeneration } from '../../hooks/useTailGeneration'

interface PlayerProps {
    mousePosition: { x: number; y: number }
    gameBounds: Box3
    tailSegments: number
    speed: number
    gameState?: string
}

function Player({ mousePosition, gameBounds, tailSegments, speed, gameState = 'playing' }: PlayerProps) {
    const playerRef = useRef<Mesh>(null)
    const { camera } = useThree()
    const [debug, setDebug] = useState(false)
    const gameOverTime = useRef(0)


    const { tailPositions, recordPosition } = useTailGeneration()
    const {
        targetPoint,
        updateMousePosition,
        updateMovement,
    } = usePlayerMovement(playerRef, camera, gameBounds, speed)


    useEffect(() => {
        if (gameState === 'gameover') {
            gameOverTime.current = 0
        }
    }, [gameState])

    useFrame((state) => {
        if (!playerRef.current || !camera) return


        if (gameState === 'gameover') {
            gameOverTime.current += 0.05
            const shakeAmount = Math.exp(-gameOverTime.current) * 0.2

            if (playerRef.current) {
                playerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * shakeAmount
                playerRef.current.position.y = 0.5 + Math.sin(gameOverTime.current * 5) * 0.1

                playerRef.current.children.forEach((child) => {
                    if (child instanceof Mesh) {
                        child.position.y -= 0.02
                    }
                })
            }

            return
        }


        updateMousePosition(mousePosition.x, mousePosition.y)


        if (updateMovement()) {
            const currentPos = new Vector3(
                playerRef.current.position.x,
                0.5,
                playerRef.current.position.z
            )


            recordPosition(currentPos, tailSegments)
        }
    })

    return (
        <>

            <mesh ref={playerRef} position={[0, 0.5, 0]} castShadow>
                <meshStandardMaterial color="#4c9eff" />
                <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />

                <mesh position={[0, 0, -0.4]}>
                    <coneGeometry args={[0.2, 0.4, 16]} />
                    <meshStandardMaterial color="#66c2ff" />
                </mesh>

                <mesh position={[0, 0.3, -0.4]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial
                        color="#ff3333"
                        emissive="#ff0000"
                        emissiveIntensity={0.8}
                    />
                </mesh>        <DirectionalArrow />                </mesh>




            {tailPositions.map((position, index) => (
                <TailSegment key={index} position={position} index={index} />
            ))}

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