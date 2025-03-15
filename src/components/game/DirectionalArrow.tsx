import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'

interface DirectionalArrowProps {
    // Optional props can be added here if needed in the future
}


function DirectionalArrow({ }: DirectionalArrowProps) {
    const arrowRef = useRef<Group>(null);

    useFrame((state) => {
        if (arrowRef.current) {
            arrowRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={arrowRef} position={[0, 0.7, 3]}>
            <group rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, -0.4, 0]}>
                    <boxGeometry args={[0.3, 0.8, 0.1]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#ffffff"
                        emissiveIntensity={1}
                        transparent={true}
                        opacity={0.9}
                    />
                </mesh>

                <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI]}>
                    <coneGeometry args={[0.4, 0.8, 3]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#ffffff"
                        emissiveIntensity={1}
                        transparent={true}
                        opacity={0.9}
                    />
                </mesh>
            </group>
        </group>
    );
}

export default DirectionalArrow; 