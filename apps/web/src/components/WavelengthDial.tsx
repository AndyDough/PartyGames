import React, { useRef, useEffect } from 'react';

interface WavelengthDialProps {
    position: number; // 0-100
    targetPosition?: number; // 0-100, optional
    showTarget?: boolean;
    showNeedle?: boolean;
    isInteractive?: boolean;
    onChange?: (newPosition: number) => void;
    onPointerDown?: () => void;
    onPointerUp?: () => void;
}

export function WavelengthDial({
    position,
    targetPosition = 50,
    showTarget = false,
    showNeedle = true,
    isInteractive = false,
    onChange,
    onPointerDown,
    onPointerUp
}: WavelengthDialProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const lastSyncRef = useRef<number>(0);
    const [localPos, setLocalPos] = React.useState(position);
    const [isDragging, setIsDragging] = React.useState(false);

    // Sync local position with prop when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalPos(position);
        }
    }, [position, isDragging]);

    const handlePointerMove = (e: PointerEvent | React.PointerEvent) => {
        if (!isInteractive || !svgRef.current || !onChange) return;

        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        
        const CTM = svg.getScreenCTM();
        if (!CTM) return;
        
        const svgPt = pt.matrixTransform(CTM.inverse());

        const dx = svgPt.x - 50;
        const dy = svgPt.y - 50;

        // If the cursor is significantly below the horizontal line, ignore the update.
        // This prevents the needle from "dropping" to 0 or 100 during release/pointerup.
        if (dy > 5) return;

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        if (angle > 0) {
            angle = dx > 0 ? 0 : -180;
        }
        
        const newPos = Math.max(0, Math.min(100, ((angle + 180) / 180) * 100));
        
        // Immediate local update
        setLocalPos(newPos);
        
        // Throttled server sync (max ~60 times per second)
        const now = Date.now();
        if (now - lastSyncRef.current > 16) {
            onChange(newPos);
            lastSyncRef.current = now;
        }
    };

    useEffect(() => {
        if (isInteractive) {
            const moveHandler = (e: PointerEvent) => {
                if (e.buttons > 0) handlePointerMove(e);
            };
            const upHandler = () => {
                setIsDragging(false);
                // Final sync on release
                if (onChange) {
                    // Use a small delay to ensure the last local state is captured
                    setTimeout(() => {
                        setLocalPos(prev => {
                            onChange(prev);
                            return prev;
                        });
                    }, 0);
                }
                if (onPointerUp) onPointerUp();
            };

            window.addEventListener('pointermove', moveHandler);
            window.addEventListener('pointerup', upHandler);
            return () => {
                window.removeEventListener('pointermove', moveHandler);
                window.removeEventListener('pointerup', upHandler);
            };
        }
    }, [isInteractive, onChange, onPointerUp]);

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return [
            "M", start.x, start.y, 
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            "L", x, y,
            "Z"
        ].join(" ");
    };

    // Wedge configuration: 5 uniform wedges of 4 units each
    // Colors based on inspiration: Yellow-Orange (2), Orange-Red (3), Sky Blue (4)
    const wedgeColors = ['#fcc468', '#f57c4a', '#60b3d1', '#f57c4a', '#fcc468'];
    const pointLabels = ['2', '3', '4', '3', '2'];
    
    const renderWedges = () => {
        if (!showTarget) return null;

        let currentOffset = -10; // Start of the first 2-point wedge
        return wedgeColors.map((color, i) => {
            const startPos = targetPosition + currentOffset;
            const endPos = startPos + 4;
            const centerPos = (startPos + endPos) / 2;
            currentOffset += 4;

            // Normalized center position for label (0-100)
            let normalizedCenter = centerPos;
            while (normalizedCenter < 0) normalizedCenter += 100;
            while (normalizedCenter > 100) normalizedCenter -= 100;
            
            // Map 0-100 to 0-180 degrees
            const labelAngle = normalizedCenter * 1.8;
            const lp = polarToCartesian(50, 50, 42, labelAngle);

            const drawPart = (s: number, e: number, keySuffix: string) => (
                <path
                    key={`${i}-${keySuffix}`}
                    d={describeArc(50, 50, 48, s * 1.8, e * 1.8)}
                    fill={color}
                    className="drop-shadow-sm transition-all duration-700"
                />
            );

            let segments;
            if (startPos < 0) {
                segments = (
                    <>
                        {drawPart(startPos + 100, 100, 'wrap-left')}
                        {drawPart(0, endPos, 'main')}
                    </>
                );
            } else if (endPos > 100) {
                segments = (
                    <>
                        {drawPart(startPos, 100, 'main')}
                        {drawPart(0, endPos - 100, 'wrap-right')}
                    </>
                );
            } else {
                segments = drawPart(startPos, endPos, 'main');
            }

            return (
                <g key={i}>
                    {segments}
                    <text
                        x={lp.x}
                        y={lp.y}
                        fill="black"
                        fontSize="3.5"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${labelAngle - 90}, ${lp.x}, ${lp.y})`}
                        className="opacity-60 pointer-events-none select-none transition-all duration-700"
                    >
                        {pointLabels[i]}
                    </text>
                </g>
            );
        });
    };

    // Since our needle is defined vertically (pointing up at 50, 5)
    // -90deg rotation points it Left (0 scale)
    // 0deg rotation points it Top (50 scale)
    // 90deg rotation points it Right (100 scale)
    const needleRotation = (localPos - 50) * 1.8;

    return (
        <div className="relative w-full max-w-sm mx-auto aspect-[2/1] select-none touch-none">
            <svg
                ref={svgRef}
                viewBox="0 0 100 55"
                className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                onPointerDown={(e) => {
                    if (isInteractive && onPointerDown) {
                        setIsDragging(true);
                        onPointerDown();
                        handlePointerMove(e);
                    }
                }}
            >
                {/* Background Semi-circle */}
                <path
                    d="M 2 50 A 48 48 0 0 1 98 50 L 50 50 Z"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    className="opacity-20"
                />
                <path
                    d="M 5 50 A 45 45 0 0 1 95 50 L 50 50 Z"
                    fill="white"
                    className="opacity-[0.03]"
                />

                {/* Scoring Wedges */}
                {renderWedges()}

                {/* Needle */}
                {showNeedle && (
                    <g 
                        style={{ transform: `rotate(${needleRotation}deg)`, transformOrigin: '50px 50px' }}
                        className={`${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
                    >
                        <line
                            x1="50" y1="50"
                            x2="50" y2="5"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className="shadow-xl"
                        />
                        {/* Stylized Needle Tip */}
                        <path
                            d="M 48.5 10 L 50 3 L 51.5 10 Z"
                            fill="white"
                        />
                    </g>
                )}

                {/* Center Cap */}
                <circle
                    cx="50"
                    cy="50"
                    r="10"
                    fill="black"
                    stroke="white"
                    strokeWidth="2"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="4"
                    fill="white"
                    className="animate-pulse"
                />
            </svg>
            
            {/* Legend/Hints */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 translate-y-6">
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-20">← Left</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Right →</span>
                </div>
            </div>
        </div>
    );
}
