import { useRef, useEffect } from 'react';
import { Vector3, Vector2, Raycaster, Plane, Mesh, Box3, Camera } from 'three';

export function usePlayerMovement(
    playerRef: React.RefObject<Mesh | null>,
    camera: Camera | null,
    gameBounds: Box3,
    speed: number
) {
    const speedRef = useRef(speed);
    const raycaster = useRef(new Raycaster());
    const plane = useRef(new Plane(new Vector3(0, 1, 0), 0));
    const targetPoint = useRef(new Vector3());
    const mouse2D = useRef(new Vector2());

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);


    const shortestAngleBetween = (a1: number, a2: number) => {
        const normalize = (angle: number) => {
            return ((angle + Math.PI) % (Math.PI * 2)) - Math.PI;
        };

        const diff = normalize(a2 - a1);
        return diff;
    };

  
    const constrainToGameBounds = (position: Vector3): Vector3 => {
        return new Vector3(
            Math.max(gameBounds.min.x, Math.min(gameBounds.max.x, position.x)),
            position.y,
            Math.max(gameBounds.min.z, Math.min(gameBounds.max.z, position.z))
        );
    };


    const checkBoundaryCollision = (position: Vector3, threshold: number): boolean => {
        const distToLeft = Math.abs(position.x - gameBounds.min.x);
        const distToRight = Math.abs(position.x - gameBounds.max.x);
        const distToFront = Math.abs(position.z - gameBounds.min.z);
        const distToBack = Math.abs(position.z - gameBounds.max.z);

        return (
            distToLeft < threshold ||
            distToRight < threshold ||
            distToFront < threshold ||
            distToBack < threshold
        );
    };


    const updateMousePosition = (x: number, y: number) => {
        mouse2D.current.set(x, y);
    };


    const updateMovement = (): boolean => {
        if (!playerRef.current || !camera) return false;

        raycaster.current.setFromCamera(mouse2D.current, camera);

        if (raycaster.current.ray.intersectPlane(plane.current, targetPoint.current)) {
            const direction = new Vector3();
            direction.subVectors(targetPoint.current, playerRef.current.position);
            direction.y = 0;

            if (direction.length() > 0.1) {
                direction.normalize();

                const targetAngle = Math.atan2(direction.x, direction.z);
                const currentRotation = playerRef.current.rotation.y;
                const angleDifference = shortestAngleBetween(currentRotation, targetAngle);
                playerRef.current.rotation.y += angleDifference * 0.1;

                const newX = camera.position.x + direction.x * speedRef.current;
                const newZ = camera.position.z + direction.z * speedRef.current;

                const constrainedPosition = constrainToGameBounds(
                    new Vector3(newX, camera.position.y, newZ)
                );

                camera.position.x = constrainedPosition.x;
                camera.position.z = constrainedPosition.z;
                playerRef.current.position.x = camera.position.x;
                playerRef.current.position.z = camera.position.z;

                return true;
            }
        }

        return false;
    };

    return {
        targetPoint,
        updateMousePosition,
        updateMovement,
        checkBoundaryCollision,
    };
} 