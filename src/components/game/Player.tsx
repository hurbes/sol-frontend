import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, Vector3, Vector2, Raycaster, Plane } from 'three'

interface PlayerProps {
    mousePosition: { x: number; y: number }
}

function Player({ mousePosition }: PlayerProps) {
    const playerRef = useRef<Mesh>(null)
    const { camera } = useThree()
    const speed = useRef(0.05)
    const raycaster = useRef(new Raycaster())
    const plane = useRef(new Plane(new Vector3(0, 1, 0), 0))
    const targetPoint = useRef(new Vector3())
    const mouse2D = useRef(new Vector2())


    const [debug, setDebug] = useState(false)


    const shortestAngleBetween = (a1: number, a2: number) => {

        const normalize = (angle: number) => {
            return ((angle + Math.PI) % (Math.PI * 2)) - Math.PI
        }


        const diff = normalize(a2 - a1)

        return diff
    }


    useFrame(() => {
        if (!playerRef.current || !camera) return


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


                camera.position.x += direction.x * speed.current
                camera.position.z += direction.z * speed.current


                playerRef.current.position.x = camera.position.x
                playerRef.current.position.z = camera.position.z
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