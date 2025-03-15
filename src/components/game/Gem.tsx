import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

interface GemProps {
    position: [number, number, number]
    color?: string
}

// Predefined vibrant colors for gems
const gemColors = [
    '#ff5555', // red
    '#55ff55', // green
    '#5555ff', // blue
    '#ffff55', // yellow
    '#ff55ff', // magenta
    '#55ffff', // cyan
    '#ff9955', // orange
    '#aa55ff', // purple
    '#55ffaa', // mint
]

// Gem size reduced by 40%
const GEM_SIZE = 0.3 // Original was 0.5, reduced by 40%

function Gem({ position, color }: GemProps) {
    // Use provided color or select random one
    const [gemColor] = useState(color || gemColors[Math.floor(Math.random() * gemColors.length)])
    const gemRef = useRef<Mesh>(null)

    // Add a pulse effect
    const pulseSpeed = useRef(1 + Math.random() * 0.5) // Randomize pulse speed slightly
    const scaleOffset = useRef(Math.random() * Math.PI * 2) // Random starting phase

    // Make gem float and rotate
    useFrame((state) => {
        if (gemRef.current) {
            // Floating animation
            gemRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1

            // Rotating animation
            gemRef.current.rotation.y += 0.01

            // Pulsing animation (subtle scale change)
            const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed.current + scaleOffset.current) * 0.05
            gemRef.current.scale.set(pulse, pulse, pulse)
        }
    })

    return (
        <mesh ref={gemRef} position={position} castShadow>
            {/* Simple box for gem - size reduced by 40% */}
            <boxGeometry args={[GEM_SIZE, GEM_SIZE, GEM_SIZE]} />
            <meshStandardMaterial
                color={gemColor}
                emissive={gemColor}
                emissiveIntensity={0.5}
                metalness={0.7}
                roughness={0.2}
            />

            {/* Glow effect (slightly larger transparent box) */}
            <mesh scale={[1.2, 1.2, 1.2]}>
                <boxGeometry args={[GEM_SIZE, GEM_SIZE, GEM_SIZE]} />
                <meshStandardMaterial
                    color={gemColor}
                    emissive={gemColor}
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.3}
                />
            </mesh>
        </mesh>
    )
}

export default Gem 