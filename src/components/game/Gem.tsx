import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

interface GemProps {
    position: [number, number, number]
    color?: string
    isBeingCollected?: boolean
    collectionProgress?: number
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


const GEM_SIZE = 0.3

function Gem({ position, color, isBeingCollected = false, collectionProgress = 0 }: GemProps) {

    const [gemColor] = useState(color || gemColors[Math.floor(Math.random() * gemColors.length)])
    const gemRef = useRef<Mesh>(null)
    const glowRef = useRef<Mesh>(null)


    const pulseSpeed = useRef(1 + Math.random() * 0.5)
    const scaleOffset = useRef(Math.random() * Math.PI * 2)


    useFrame((state) => {
        if (gemRef.current && glowRef.current) {
            if (isBeingCollected) {


                const collectionScale = Math.max(0.1, 1 - collectionProgress * 0.9);
                const spinSpeed = 0.05 + collectionProgress * 0.3;


                gemRef.current.rotation.y += spinSpeed;
                gemRef.current.rotation.x += spinSpeed * 0.5;


                gemRef.current.scale.set(collectionScale, collectionScale, collectionScale);


                const glowIntensity = 1 + collectionProgress * 2;
                const glowScale = 1.2 * glowIntensity * collectionScale;
                glowRef.current.scale.set(glowScale, glowScale, glowScale);


                const heightLift = collectionProgress * 0.5;
                gemRef.current.position.y = position[1] + heightLift;
                glowRef.current.position.y = heightLift;
            } else {


                gemRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1


                glowRef.current.position.y = 0;


                gemRef.current.rotation.y += 0.01


                const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed.current + scaleOffset.current) * 0.05
                gemRef.current.scale.set(pulse, pulse, pulse)


                glowRef.current.scale.set(1.2, 1.2, 1.2);
            }
        }
    })

    return (
        <mesh ref={gemRef} position={position} castShadow>

            <boxGeometry args={[GEM_SIZE, GEM_SIZE, GEM_SIZE]} />
            <meshStandardMaterial
                color={gemColor}
                emissive={gemColor}
                emissiveIntensity={isBeingCollected ? 0.8 + collectionProgress * 1.5 : 0.5}
                metalness={0.7}
                roughness={0.2}
            />

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