import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

interface GemProps {
    position: [number, number, number]
    color?: string
}


const gemColors = [
    '#ff5555',
    '#55ff55',
    '#5555ff',
    '#ffff55',
    '#ff55ff',
    '#55ffff',
    '#ff9955',
    '#aa55ff',
    '#55ffaa',
]

function Gem({ position, color }: GemProps) {

    const [gemColor] = useState(color || gemColors[Math.floor(Math.random() * gemColors.length)])
    const gemRef = useRef<Mesh>(null)


    useFrame((state) => {
        if (gemRef.current) {

            gemRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1


            gemRef.current.rotation.y += 0.01
        }
    })

    return (
        <mesh ref={gemRef} position={position} castShadow>
            {/* Simple box for gem */}
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial
                color={gemColor}
                emissive={gemColor}
                emissiveIntensity={0.3}
            />
        </mesh>
    )
}

export default Gem 