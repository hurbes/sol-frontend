import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

interface GemProps {
    position: [number, number, number]
    color?: string
    isBeingCollected?: boolean
    collectionProgress?: number
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

function Gem({ position, color, isBeingCollected = false, collectionProgress = 0 }: GemProps) {
    // Use provided color or select random one
    const [gemColor] = useState(color || gemColors[Math.floor(Math.random() * gemColors.length)])
    const gemRef = useRef<Mesh>(null)
    const glowRef = useRef<Mesh>(null)

    // Add a pulse effect
    const pulseSpeed = useRef(1 + Math.random() * 0.5) // Randomize pulse speed slightly
    const scaleOffset = useRef(Math.random() * Math.PI * 2) // Random starting phase

    // Make gem float and rotate
    useFrame((state) => {
        if (gemRef.current && glowRef.current) {
            if (isBeingCollected) {
                // When being collected, spin faster and scale smaller as it gets closer to player
                // More dramatic scaling down as collection progresses - starts at full size, shrinks to almost nothing
                const collectionScale = Math.max(0.1, 1 - collectionProgress * 0.9);
                const spinSpeed = 0.05 + collectionProgress * 0.3;

                // Increase rotation speed during collection
                gemRef.current.rotation.y += spinSpeed;
                gemRef.current.rotation.x += spinSpeed * 0.5;

                // Scale down as it gets collected - more dramatic shrinking
                gemRef.current.scale.set(collectionScale, collectionScale, collectionScale);

                // Make glow more intense during collection but also scale it down with the gem
                const glowIntensity = 1 + collectionProgress * 2;
                const glowScale = 1.2 * glowIntensity * collectionScale;
                glowRef.current.scale.set(glowScale, glowScale, glowScale);

                // Optional: Move upward slightly during collection
                const heightLift = collectionProgress * 0.5;
                gemRef.current.position.y = position[1] + heightLift;
                glowRef.current.position.y = heightLift;
            } else {
                // Normal gem behavior when not being collected
                // Floating animation
                gemRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1

                // Reset glow position to match gem
                glowRef.current.position.y = 0;

                // Rotating animation
                gemRef.current.rotation.y += 0.01

                // Pulsing animation (subtle scale change)
                const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed.current + scaleOffset.current) * 0.05
                gemRef.current.scale.set(pulse, pulse, pulse)

                // Reset glow to normal size
                glowRef.current.scale.set(1.2, 1.2, 1.2);
            }
        }
    })

    return (
        <mesh ref={gemRef} position={position} castShadow>
            {/* Simple box for gem - size reduced by 40% */}
            <boxGeometry args={[GEM_SIZE, GEM_SIZE, GEM_SIZE]} />
            <meshStandardMaterial
                color={gemColor}
                emissive={gemColor}
                emissiveIntensity={isBeingCollected ? 0.8 + collectionProgress * 1.5 : 0.5}
                metalness={0.7}
                roughness={0.2}
            />

            {/* Glow effect (slightly larger transparent box) */}
            <mesh ref={glowRef} scale={[1.2, 1.2, 1.2]}>
                <boxGeometry args={[GEM_SIZE, GEM_SIZE, GEM_SIZE]} />
                <meshStandardMaterial
                    color={gemColor}
                    emissive={gemColor}
                    emissiveIntensity={isBeingCollected ? 1.2 + collectionProgress * 2 : 0.8}
                    transparent
                    opacity={isBeingCollected ? 0.3 + collectionProgress * 0.4 : 0.3}
                />
            </mesh>
        </mesh>
    )
}

export default Gem 