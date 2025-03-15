import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { Color, Vector3, Group } from 'three'
import Player from './Player'
import Gem from './Gem'


const GEM_SPAWN_RADIUS = 30
const GEM_SPAWN_COUNT = 40
const GEM_SPAWN_DISTANCE = 15
const GEM_DESPAWN_DISTANCE = 40


function GameUI({ gemCount }: { gemCount: number }) {
    return (
        <div className="absolute left-0 bottom-0 w-full p-4">
            <div className="flex justify-between">
                <div className="bg-black/50 p-2 rounded text-white text-sm">
                    <p>Move your mouse to control direction</p>
                    <p>Player will move towards mouse pointer</p>
                </div>
                <div className="bg-black/50 p-2 rounded text-white text-sm">
                    <p>Gems: {gemCount}</p>
                    <p>Last update: {new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
    )
}

function Game() {
    const [gemCount, setGemCount] = useState(0)

    return (
        <div className="w-full h-screen">
            <Canvas shadows>
                <color attach="background" args={[new Color('#0a1929')]} />
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                <Scene onGemCountChange={setGemCount} />
            </Canvas>
            <GameUI gemCount={gemCount} />
        </div>
    )
}

interface SceneProps {
    onGemCountChange: (count: number) => void
}

function Scene({ onGemCountChange }: SceneProps) {
    const { camera } = useThree()
    const playerRef = useRef(new Vector3(0, 0, 0))
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [gems, setGems] = useState<{ id: number; position: [number, number, number] }[]>([])
    const lastGemId = useRef(0)
    const frameCount = useRef(0)


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

        camera.position.set(0, 10, 0)
        camera.lookAt(0, 0, 0)
    }, [camera])


    useEffect(() => {
        onGemCountChange(gems.length)
    }, [gems.length, onGemCountChange])


    useEffect(() => {
        const initialGems = []
        for (let i = 0; i < GEM_SPAWN_COUNT; i++) {
            const newGem = generateGem(new Vector3(0, 0, 0))
            initialGems.push(newGem)
        }
        setGems(initialGems)
    }, [])


    const generateGem = (playerPosition: Vector3) => {

        const angle = Math.random() * Math.PI * 2
        const distance = GEM_SPAWN_DISTANCE + Math.random() * (GEM_SPAWN_RADIUS - GEM_SPAWN_DISTANCE)

        const x = playerPosition.x + Math.cos(angle) * distance
        const z = playerPosition.z + Math.sin(angle) * distance

        return {
            id: lastGemId.current++,
            position: [x, 0.5, z] as [number, number, number]
        }
    }


    useFrame(() => {

        if (camera) {
            playerRef.current.set(camera.position.x, 0, camera.position.z)
        }


        frameCount.current += 1
        if (frameCount.current % 30 === 0) {

            const playerPos = playerRef.current
            const remainingGems = gems.filter(gem => {
                const gemPos = new Vector3(gem.position[0], gem.position[1], gem.position[2])
                return gemPos.distanceTo(playerPos) < GEM_DESPAWN_DISTANCE
            })


            const newGems = []
            const gemsToAdd = GEM_SPAWN_COUNT - remainingGems.length

            if (gemsToAdd > 0) {
                for (let i = 0; i < gemsToAdd; i++) {
                    newGems.push(generateGem(playerPos))
                }
                setGems([...remainingGems, ...newGems])
            } else if (remainingGems.length < gems.length) {

                setGems(remainingGems)
            }
        }
    })

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 10, 0]} fov={50} />
            <InfiniteGrid />
            <Player mousePosition={mousePosition} />

            {/* Render all gems */}
            {gems.map(gem => (
                <Gem key={gem.id} position={gem.position} />
            ))}
        </>
    )
}

function InfiniteGrid() {
    const gridRef = useRef<Group>(null)
    const { camera } = useThree()


    const tileSize = 5
    const visibleDistance = 50
    const gridDivisions = Math.ceil(visibleDistance / tileSize) * 2


    const createTiles = (cameraX: number, cameraZ: number) => {
        const tiles = []


        const startX = Math.floor(cameraX / tileSize) * tileSize - (gridDivisions / 2 * tileSize)
        const startZ = Math.floor(cameraZ / tileSize) * tileSize - (gridDivisions / 2 * tileSize)

        for (let x = 0; x < gridDivisions; x++) {
            for (let z = 0; z < gridDivisions; z++) {
                const posX = startX + x * tileSize
                const posZ = startZ + z * tileSize


                const isEven = (Math.floor(posX / tileSize) + Math.floor(posZ / tileSize)) % 2 === 0

                tiles.push(
                    <mesh
                        key={`${posX}-${posZ}`}
                        position={[posX + tileSize / 2, 0, posZ + tileSize / 2]}
                        receiveShadow
                    >
                        <boxGeometry args={[tileSize, 0.1, tileSize]} />
                        <meshStandardMaterial
                            color={isEven ? '#1a3b6d' : '#2a4b7d'}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                )
            }
        }

        return tiles
    }


    const [tiles, setTiles] = useState(createTiles(0, 0))


    const lastCameraPos = useRef<{ x: number, z: number }>({ x: 0, z: 0 })

    useFrame(() => {
        if (camera) {

            const distMoved = Math.sqrt(
                Math.pow(camera.position.x - lastCameraPos.current.x, 2) +
                Math.pow(camera.position.z - lastCameraPos.current.z, 2)
            )


            if (distMoved > tileSize / 2) {
                lastCameraPos.current = {
                    x: camera.position.x,
                    z: camera.position.z
                }
                setTiles(createTiles(camera.position.x, camera.position.z))
            }
        }
    })

    return (
        <group ref={gridRef}>
            {tiles}
        </group>
    )
}

export default Game 