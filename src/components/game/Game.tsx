import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo } from 'react'
import { Color, Vector3, Box3 } from 'three'
import Player from './Player'
import Gem from './Gem'


const GAME_BOUNDS = {
    width: 80,
    length: 80,
}


const GAME_STATE = {
    PLAYING: 'playing',
    GAME_OVER: 'gameover'
}


const BOUNDARY_COLLISION_THRESHOLD = 1.2


const GEM_SPAWN_COUNT = 300


const BASE_PLAYER_SPEED = 0.08
const MIN_PLAYER_SPEED = 0.03
const TAIL_SEGMENT_PER_GEMS = 10


function Minimap({ playerPosition, gems }: {
    playerPosition: Vector3,
    gems: { id: number; position: [number, number, number] }[]
}) {
    const minimapSize = 320


    const scale = minimapSize / Math.max(GAME_BOUNDS.width, GAME_BOUNDS.length)


    const worldToMap = (x: number, z: number) => {

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
                <div className="absolute bg-white rounded-full w-4 h-4"
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
                        className="absolute rounded-full w-2 h-2"
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


function FpsCounter() {
    const [fps, setFps] = useState(0);

    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let frameTime = 0;

        const updateFps = () => {
            const now = performance.now();
            frameCount++;
            frameTime += now - lastTime;
            lastTime = now;


            if (frameTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / frameTime));
                frameCount = 0;
                frameTime = 0;
            }

            requestAnimationFrame(updateFps);
        };

        const animationId = requestAnimationFrame(updateFps);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="absolute right-4 top-4 bg-black/70 px-3 py-1 rounded-md border border-white/30">
            <p className="text-green-400 font-mono font-bold">{fps} FPS</p>
        </div>
    );
}


function GameUI({ gemCount, collectedGems, playerPosition, gems, gameState, onRestart }: {
    gemCount: number;
    collectedGems: number;
    playerPosition: Vector3;
    gems: { id: number; position: [number, number, number] }[];
    gameState: string;
    onRestart: () => void;
}) {

    const tailSegments = Math.floor(collectedGems / TAIL_SEGMENT_PER_GEMS);
    const playerSpeed = Math.max(
        MIN_PLAYER_SPEED,
        BASE_PLAYER_SPEED * (1 - (tailSegments * 0.02))
    );
    const speedPercentage = Math.round((playerSpeed / BASE_PLAYER_SPEED) * 100);

    return (
        <>
            <Minimap playerPosition={playerPosition} gems={gems} />
            <FpsCounter />

            {gameState === GAME_STATE.PLAYING && (
                <div className="absolute left-0 bottom-0 w-full p-4">
                    <div className="flex justify-between">
                        <div className="bg-black/50 p-2 rounded text-white text-sm">
                            <p>Move your mouse to control direction</p>
                            <p>Player will move towards mouse pointer</p>
                            <p className="text-yellow-200">Stay within the game boundaries</p>
                            <p className="text-blue-300">Tail Length: {tailSegments} segments</p>
                            <p className="text-green-300">Speed: {speedPercentage}%</p>
                        </div>
                        <div className="bg-black/50 p-2 rounded text-white text-sm">
                            <p>Active Gems: {gemCount}</p>
                            <p className="text-yellow-300 font-bold">Collected: {collectedGems} ✨</p>
                            <p className="text-gray-300 text-xs">Every {TAIL_SEGMENT_PER_GEMS} gems add 1 tail segment</p>
                        </div>
                    </div>
                </div>
            )}

            {gameState === GAME_STATE.GAME_OVER && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="bg-black/80 p-8 rounded-lg text-center border-2 border-red-500/50 shadow-lg">
                        <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER</h2>
                        <p className="text-xl text-white mb-6">Your snake hit the wall!</p>
                        <p className="text-white mb-8">Final Score: <span className="text-yellow-300 font-bold">{collectedGems} gems</span></p>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
                            onClick={onRestart}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

function Game() {
    const [gemCount, setGemCount] = useState(0)
    const [collectedGems, setCollectedGems] = useState(0)
    const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 0, 0))
    const [gems, setGemsForUI] = useState<{ id: number; position: [number, number, number] }[]>([])
    const [gameState, setGameState] = useState(GAME_STATE.PLAYING)


    const handleGameOver = () => {
        setGameState(GAME_STATE.GAME_OVER);
    }


    const handleRestart = () => {
        setCollectedGems(0);
        setGameState(GAME_STATE.PLAYING);
    }

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
                    collectedGems={collectedGems}
                    gameState={gameState}
                    onGameOver={handleGameOver}
                />
            </Canvas>
            <GameUI
                gemCount={gemCount}
                collectedGems={collectedGems}
                playerPosition={playerPosition}
                gems={gems}
                gameState={gameState}
                onRestart={handleRestart}
            />
        </div>
    )
}

interface SceneProps {
    onGemCountChange: (count: number) => void;
    onGemCollect: () => void;
    onPlayerMove: (position: Vector3) => void;
    onGemsChange: (gems: { id: number; position: [number, number, number] }[]) => void;
    collectedGems: number;
    gameState: string;
    onGameOver: () => void;
}


interface AnimatedGem {
    id: number;
    position: [number, number, number];
    isBeingCollected: boolean;
    collectionProgress: number;
}

function Scene({ onGemCountChange, onGemCollect, onPlayerMove, onGemsChange, collectedGems, gameState, onGameOver }: SceneProps) {
    const { camera } = useThree()
    const playerRef = useRef(new Vector3(0, 0, 0))
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [gems, setGems] = useState<AnimatedGem[]>([])
    const lastGemId = useRef(0)
    const frameCount = useRef(0)


    const tailSegments = Math.floor(collectedGems / TAIL_SEGMENT_PER_GEMS)


    const playerSpeed = Math.max(
        MIN_PLAYER_SPEED,
        BASE_PLAYER_SPEED * (1 - (tailSegments * 0.02))
    )


    const GEM_ATTRACTION_DISTANCE = 1.8;
    const GEM_ANIMATION_SPEED = 0.04;


    const gameBounds = useMemo(() => {
        return new Box3(
            new Vector3(-GAME_BOUNDS.width / 2, 0, -GAME_BOUNDS.length / 2),
            new Vector3(GAME_BOUNDS.width / 2, 10, GAME_BOUNDS.length / 2)
        )
    }, [])


    const checkBoundaryCollision = (position: Vector3): boolean => {

        const distToLeft = Math.abs(position.x - gameBounds.min.x);
        const distToRight = Math.abs(position.x - gameBounds.max.x);
        const distToFront = Math.abs(position.z - gameBounds.min.z);
        const distToBack = Math.abs(position.z - gameBounds.max.z);


        return (
            distToLeft < BOUNDARY_COLLISION_THRESHOLD ||
            distToRight < BOUNDARY_COLLISION_THRESHOLD ||
            distToFront < BOUNDARY_COLLISION_THRESHOLD ||
            distToBack < BOUNDARY_COLLISION_THRESHOLD
        );
    }


    useEffect(() => {
        if (gameState === GAME_STATE.PLAYING) {

            if (camera) {
                camera.position.set(0, 15, 0);
                camera.lookAt(0, 0, 0);
            }


            const initialGems = [];
            for (let i = 0; i < GEM_SPAWN_COUNT; i++) {
                const newGem = generateGem();
                initialGems.push(newGem);
            }
            setGems(initialGems);
        }
    }, [gameState, camera]);


    const [playCollectSound] = useState(() => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                440, audioContext.currentTime + 0.1
            );

            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        };
    });


    const [playGameOverSound] = useState(() => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                110, audioContext.currentTime + 0.3
            );

            gain.gain.setValueAtTime(0.4, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        };
    });


    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {

            if (gameState === GAME_STATE.PLAYING) {
                setMousePosition({
                    x: (event.clientX / window.innerWidth) * 2 - 1,
                    y: -(event.clientY / window.innerHeight) * 2 + 1
                });
            }
        }

        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [gameState])

    useEffect(() => {

        camera.position.set(0, 15, 0)
        camera.lookAt(0, 0, 0)
    }, [camera])


    useEffect(() => {

        const activeGems = gems.filter(gem => !gem.isBeingCollected);
        onGemCountChange(activeGems.length)


        const simplifiedGems = gems.map(gem => ({
            id: gem.id,
            position: gem.position
        }));
        onGemsChange(simplifiedGems)
    }, [gems, onGemCountChange, onGemsChange])


    useEffect(() => {
        const initialGems = []
        for (let i = 0; i < GEM_SPAWN_COUNT; i++) {
            const newGem = generateGem()
            initialGems.push(newGem)
        }
        setGems(initialGems)
    }, [])


    const generateGem = (): AnimatedGem => {
        const x = Math.random() * GAME_BOUNDS.width - GAME_BOUNDS.width / 2
        const z = Math.random() * GAME_BOUNDS.length - GAME_BOUNDS.length / 2

        return {
            id: lastGemId.current++,
            position: [x, 0.5, z] as [number, number, number],
            isBeingCollected: false,
            collectionProgress: 0
        }
    }


    useFrame(() => {

        if (gameState === GAME_STATE.GAME_OVER) return;


        if (camera) {

            const newX = Math.max(
                gameBounds.min.x,
                Math.min(gameBounds.max.x, camera.position.x)
            )
            const newZ = Math.max(
                gameBounds.min.z,
                Math.min(gameBounds.max.z, camera.position.z)
            )


            if (camera.position.x !== newX || camera.position.z !== newZ) {
                camera.position.x = newX
                camera.position.z = newZ
            }


            playerRef.current.set(camera.position.x, 0, camera.position.z)
            onPlayerMove(playerRef.current.clone())


            if (checkBoundaryCollision(playerRef.current)) {

                onGameOver();
                playGameOverSound();
                return;
            }
        }


        const playerPos = playerRef.current
        let gemCollected = false;


        const updatedGems = gems.map(gem => {

            if (gem.isBeingCollected) {

                const newProgress = gem.collectionProgress + GEM_ANIMATION_SPEED;


                if (newProgress >= 1) {
                    gemCollected = true;
                    return null;
                }


                const startPos = new Vector3(gem.position[0], gem.position[1], gem.position[2]);


                const lerpPos = startPos.clone().lerp(playerPos, newProgress);


                const arcHeight = 0.5 * Math.sin(newProgress * Math.PI);
                lerpPos.y += arcHeight;


                return {
                    ...gem,
                    position: [lerpPos.x, lerpPos.y, lerpPos.z] as [number, number, number],
                    collectionProgress: newProgress
                };
            }


            const gemPos = new Vector3(gem.position[0], gem.position[1], gem.position[2]);
            const distance = gemPos.distanceTo(playerPos);


            if (distance < GEM_ATTRACTION_DISTANCE) {
                return {
                    ...gem,
                    isBeingCollected: true,
                    collectionProgress: 0
                };
            }


            return gem;
        }).filter(Boolean) as AnimatedGem[];


        if (gemCollected) {
            onGemCollect();
            playCollectSound();
        }


        setGems(updatedGems);


        frameCount.current += 1
        if (frameCount.current % 10 === 0) {
            const activeGems = updatedGems.filter(gem => !gem.isBeingCollected);
            const gemsToAdd = GEM_SPAWN_COUNT - activeGems.length
            if (gemsToAdd > 0) {
                const newGems = []
                for (let i = 0; i < gemsToAdd; i++) {
                    newGems.push(generateGem())
                }
                setGems([...updatedGems, ...newGems])
            }
        }
    })

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 15, 0]} fov={60} />
            <BoundedGameArea />
            <Player
                mousePosition={mousePosition}
                gameBounds={gameBounds}
                tailSegments={tailSegments}
                speed={playerSpeed}
                gameState={gameState}
            />

            {/* Render all gems with animation effects */}
            {gems.map(gem => (
                <Gem
                    key={gem.id}
                    position={gem.position}
                    isBeingCollected={gem.isBeingCollected}
                    collectionProgress={gem.collectionProgress}
                />
            ))}
        </>
    )
}


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