import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo } from 'react'
import { Color, Vector3, Box3 } from 'three'
import Player from './Player'
import Gem from './Gem'

// Game area boundaries
const GAME_BOUNDS = {
    width: 80,
    length: 80,
}

// Gem generation settings
const GEM_SPAWN_COUNT = 200 // Number of gems to keep active
const GEM_COLLECTION_DISTANCE = 0.8 // Distance within which gems are collected

// Minimap component that shows the bounded game area
function Minimap({ playerPosition, gems }: {
    playerPosition: Vector3,
    gems: { id: number; position: [number, number, number] }[]
}) {
    const minimapSize = 150 // Size in pixels

    // Calculate scale based on game bounds to fit the minimap
    const scale = minimapSize / Math.max(GAME_BOUNDS.width, GAME_BOUNDS.length)

    // Convert world coordinates to minimap coordinates
    const worldToMap = (x: number, z: number) => {
        // Center the map and scale coordinates
        return {
            x: minimapSize / 2 + x * scale,
            y: minimapSize / 2 + z * scale,
        }
    }

    return (
        <div className="absolute left-4 top-4 bg-black/70 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg"
            style={{ width: `${minimapSize}px`, height: `${minimapSize}px` }}>
            <div className="relative w-full h-full">
                {/* Game bounds outline */}
                <div className="absolute border border-white/50"
                    style={{
                        left: worldToMap(-GAME_BOUNDS.width / 2, 0).x,
                        top: worldToMap(0, -GAME_BOUNDS.length / 2).y,
                        width: GAME_BOUNDS.width * scale,
                        height: GAME_BOUNDS.length * scale,
                    }}
                />

                {/* Player dot */}
                <div className="absolute bg-white rounded-full w-3 h-3"
                    style={{
                        left: `${worldToMap(playerPosition.x, playerPosition.z).x}px`,
                        top: `${worldToMap(playerPosition.x, playerPosition.z).y}px`,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 4px 1px rgba(255, 255, 255, 0.8)',
                    }}
                />

                {/* Gems */}
                {gems.map(gem => (
                    <div
                        key={gem.id}
                        className="absolute rounded-full w-1.5 h-1.5"
                        style={{
                            backgroundColor: '#ffff00',
                            left: `${worldToMap(gem.position[0], gem.position[2]).x}px`,
                            top: `${worldToMap(gem.position[0], gem.position[2]).y}px`,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 2px 1px rgba(255, 255, 0, 0.5)',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

// Add a simple UI overlay for instructions and stats
function GameUI({ gemCount, collectedGems, playerPosition, gems }: {
    gemCount: number;
    collectedGems: number;
    playerPosition: Vector3;
    gems: { id: number; position: [number, number, number] }[];
}) {
    return (
        <>
            <Minimap playerPosition={playerPosition} gems={gems} />

            <div className="absolute left-0 bottom-0 w-full p-4">
                <div className="flex justify-between">
                    <div className="bg-black/50 p-2 rounded text-white text-sm">
                        <p>Move your mouse to control direction</p>
                        <p>Player will move towards mouse pointer</p>
                        <p className="text-yellow-200">Stay within the game boundaries</p>
                    </div>
                    <div className="bg-black/50 p-2 rounded text-white text-sm">
                        <p>Active Gems: {gemCount}</p>
                        <p className="text-yellow-300 font-bold">Collected: {collectedGems} ✨</p>
                    </div>
                </div>
            </div>
        </>
    )
}

function Game() {
    const [gemCount, setGemCount] = useState(0)
    const [collectedGems, setCollectedGems] = useState(0)
    const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0))
    const [gems, setGemsForUI] = useState<{ id: number; position: [number, number, number] }[]>([])

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden m-0 p-0">
            <Canvas shadows className="!absolute inset-0 w-screen h-screen">
                <color attach="background" args={[new Color('#0a1929')]} />
                <ambientLight intensity={0.4} />
                <pointLight position={[0, 20, 0]} intensity={0.5} castShadow />
                <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    shadow-camera-far={50}
                    shadow-camera-left={-30}
                    shadow-camera-right={30}
                    shadow-camera-top={30}
                    shadow-camera-bottom={-30}
                />
                <fog attach="fog" args={['#0a1929', 30, 90]} />
                <Scene
                    onGemCountChange={setGemCount}
                    onGemCollect={() => setCollectedGems(prev => prev + 1)}
                    onPlayerMove={setPlayerPosition}
                    onGemsChange={setGemsForUI}
                />
            </Canvas>
            <GameUI
                gemCount={gemCount}
                collectedGems={collectedGems}
                playerPosition={playerPosition}
                gems={gems}
            />
        </div>
    )
}

interface SceneProps {
    onGemCountChange: (count: number) => void;
    onGemCollect: () => void;
    onPlayerMove: (position: Vector3) => void;
    onGemsChange: (gems: { id: number; position: [number, number, number] }[]) => void;
}

function Scene({ onGemCountChange, onGemCollect, onPlayerMove, onGemsChange }: SceneProps) {
    const { camera } = useThree()
    const playerRef = useRef(new Vector3(0, 0, 0))
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [gems, setGems] = useState<{ id: number; position: [number, number, number] }[]>([])
    const lastGemId = useRef(0)
    const frameCount = useRef(0)

    // Create the bounding box for the game area
    const gameBounds = useMemo(() => {
        return new Box3(
            new Vector3(-GAME_BOUNDS.width / 2, 0, -GAME_BOUNDS.length / 2),
            new Vector3(GAME_BOUNDS.width / 2, 10, GAME_BOUNDS.length / 2)
        )
    }, [])

    // Add sound effect for gem collection
    const [playCollectSound] = useState(() => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(
                440, audioContext.currentTime + 0.1
            ); // A4

            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        };
    });

    // Update mouse position
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setMousePosition({
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: -(event.clientY / window.innerHeight) * 2 + 1
            })
        }

        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    useEffect(() => {
        // Set initial camera position (higher up for better overview)
        camera.position.set(0, 15, 0)
        camera.lookAt(0, 0, 0)
    }, [camera])

    // Effect to notify parent component of gem count
    useEffect(() => {
        onGemCountChange(gems.length)
        onGemsChange(gems)
    }, [gems, onGemCountChange, onGemsChange])

    // Spawn initial gems immediately
    useEffect(() => {
        const initialGems = []
        for (let i = 0; i < GEM_SPAWN_COUNT; i++) {
            const newGem = generateGem()
            initialGems.push(newGem)
        }
        setGems(initialGems)
    }, [])

    // Function to generate a new gem at a random position within game bounds
    const generateGem = () => {
        const x = Math.random() * GAME_BOUNDS.width - GAME_BOUNDS.width / 2
        const z = Math.random() * GAME_BOUNDS.length - GAME_BOUNDS.length / 2

        return {
            id: lastGemId.current++,
            position: [x, 0.5, z] as [number, number, number]
        }
    }

    // Check for gem collection and update gems
    useFrame(() => {
        // Update player reference position
        if (camera) {
            // Keep player within bounds
            const newX = Math.max(
                gameBounds.min.x,
                Math.min(gameBounds.max.x, camera.position.x)
            )
            const newZ = Math.max(
                gameBounds.min.z,
                Math.min(gameBounds.max.z, camera.position.z)
            )

            // Update camera position to stay within bounds
            if (camera.position.x !== newX || camera.position.z !== newZ) {
                camera.position.x = newX
                camera.position.z = newZ
            }

            playerRef.current.set(camera.position.x, 0, camera.position.z)
            onPlayerMove(playerRef.current.clone())
        }

        // Check for gem collection every frame
        const playerPos = playerRef.current

        // Filter out collected gems
        const remainingGems = gems.filter(gem => {
            const gemPos = new Vector3(gem.position[0], gem.position[1], gem.position[2])
            const distance = gemPos.distanceTo(playerPos)

            // Check if gem is collected
            if (distance < GEM_COLLECTION_DISTANCE) {
                onGemCollect()
                playCollectSound()
                return false // Remove from array
            }

            return true // Keep the gem
        })

        // Only update if gems were collected
        if (remainingGems.length < gems.length) {
            setGems(remainingGems)
        }

        // Spawn new gems if needed (less frequently)
        frameCount.current += 1
        if (frameCount.current % 10 === 0) {
            const gemsToAdd = GEM_SPAWN_COUNT - remainingGems.length
            if (gemsToAdd > 0) {
                const newGems = []
                for (let i = 0; i < gemsToAdd; i++) {
                    newGems.push(generateGem())
                }
                setGems([...remainingGems, ...newGems])
            }
        }
    })

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 15, 0]} fov={60} />
            <BoundedGameArea />
            <Player mousePosition={mousePosition} gameBounds={gameBounds} />

            {/* Render all gems */}
            {gems.map(gem => (
                <Gem key={gem.id} position={gem.position} />
            ))}
        </>
    )
}

// Component to render the game floor and walls
function BoundedGameArea() {
    return (
        <group>
            {/* Floor */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[GAME_BOUNDS.width, GAME_BOUNDS.length]} />
                <meshStandardMaterial color="#1a3b6d" />
            </mesh>

            {/* Grid overlay for the floor */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[GAME_BOUNDS.width, GAME_BOUNDS.length]} />
                <meshStandardMaterial
                    color="#2a4b7d"
                    wireframe={true}
                    transparent={true}
                    opacity={0.4}
                />
            </mesh>

            {/* Walls */}
            <group>
                {/* North wall */}
                <mesh
                    position={[0, 1, -GAME_BOUNDS.length / 2]}
                    receiveShadow
                    castShadow
                >
                    <boxGeometry args={[GAME_BOUNDS.width, 2, 0.5]} />
                    <meshStandardMaterial color="#3a5b8d" transparent opacity={0.8} />
                </mesh>

                {/* South wall */}
                <mesh
                    position={[0, 1, GAME_BOUNDS.length / 2]}
                    receiveShadow
                    castShadow
                >
                    <boxGeometry args={[GAME_BOUNDS.width, 2, 0.5]} />
                    <meshStandardMaterial color="#3a5b8d" transparent opacity={0.8} />
                </mesh>

                {/* East wall */}
                <mesh
                    position={[GAME_BOUNDS.width / 2, 1, 0]}
                    receiveShadow
                    castShadow
                >
                    <boxGeometry args={[0.5, 2, GAME_BOUNDS.length]} />
                    <meshStandardMaterial color="#3a5b8d" transparent opacity={0.8} />
                </mesh>

                {/* West wall */}
                <mesh
                    position={[-GAME_BOUNDS.width / 2, 1, 0]}
                    receiveShadow
                    castShadow
                >
                    <boxGeometry args={[0.5, 2, GAME_BOUNDS.length]} />
                    <meshStandardMaterial color="#3a5b8d" transparent opacity={0.8} />
                </mesh>
            </group>

            {/* Corner posts for better visual guidance */}
            <mesh position={[-GAME_BOUNDS.width / 2, 1.5, -GAME_BOUNDS.length / 2]} castShadow>
                <boxGeometry args={[1, 3, 1]} />
                <meshStandardMaterial color="#4a6b9d" />
            </mesh>
            <mesh position={[GAME_BOUNDS.width / 2, 1.5, -GAME_BOUNDS.length / 2]} castShadow>
                <boxGeometry args={[1, 3, 1]} />
                <meshStandardMaterial color="#4a6b9d" />
            </mesh>
            <mesh position={[-GAME_BOUNDS.width / 2, 1.5, GAME_BOUNDS.length / 2]} castShadow>
                <boxGeometry args={[1, 3, 1]} />
                <meshStandardMaterial color="#4a6b9d" />
            </mesh>
            <mesh position={[GAME_BOUNDS.width / 2, 1.5, GAME_BOUNDS.length / 2]} castShadow>
                <boxGeometry args={[1, 3, 1]} />
                <meshStandardMaterial color="#4a6b9d" />
            </mesh>
        </group>
    )
}

export default Game 