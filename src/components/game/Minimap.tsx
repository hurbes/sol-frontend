import { Vector3 } from 'three'

const GAME_BOUNDS = {
    width: 80,
    length: 80,
}

interface MinimapProps {
    playerPosition: Vector3;
    gems: { id: number; position: [number, number, number] }[];
}

function Minimap({ playerPosition, gems }: MinimapProps) {
    const minimapSize = 320;
    const scale = minimapSize / Math.max(GAME_BOUNDS.width, GAME_BOUNDS.length);

    // Converts world coordinates to minimap pixel 
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

                <div className="absolute border border-white/50"
                    style={{
                        left: worldToMap(-GAME_BOUNDS.width / 2, 0).x,
                        top: worldToMap(0, -GAME_BOUNDS.length / 2).y,
                        width: GAME_BOUNDS.width * scale,
                        height: GAME_BOUNDS.length * scale,
                    }}
                />

                <div className="absolute bg-white rounded-full w-4 h-4"
                    style={{
                        left: `${worldToMap(playerPosition.x, playerPosition.z).x}px`,
                        top: `${worldToMap(playerPosition.x, playerPosition.z).y}px`,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 4px 1px rgba(255, 255, 255, 0.8)',
                    }}
                />

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

export default Minimap; 