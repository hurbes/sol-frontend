import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Shape, DoubleSide } from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

interface DirectionalArrowProps {
    // Optional props can be added here if needed in the future
}

function DirectionalArrow({ }: DirectionalArrowProps) {
    const arrowRef = useRef<Group>(null);
    const [svgShapes, setSvgShapes] = useState<Shape[]>([]);

    useEffect(() => {
        const svgMarkup = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="m12 6.414 7.293 7.293 1.414-1.414L12 3.586l-8.707 8.707 1.414 1.414L12 6.414z"/>
              <path d="m3.293 18.293 1.414 1.414L12 12.414l7.293 7.293 1.414-1.414L12 9.586l-8.707 8.707z"/>
            </svg>
        `;

        const loader = new SVGLoader();
        const svgData = loader.parse(svgMarkup);
        const shapes = svgData.paths.flatMap(path => path.toShapes(true));
        setSvgShapes(shapes);
    }, []);

    useFrame((state) => {
        if (arrowRef.current) {
            arrowRef.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={arrowRef} position={[0, 0.7, 1]}>
            <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.02, 0.02, 0.02]}>
                {svgShapes.map((shape, i) => (
                    <mesh key={i} position={[-12, -12, 0]}>
                        <shapeGeometry args={[shape]} />
                        <meshBasicMaterial
                            color="#ffff00"
                            transparent={true}
                            opacity={1}
                            side={DoubleSide}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

export default DirectionalArrow; 