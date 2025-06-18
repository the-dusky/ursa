(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/apps/frontend/src/components/game/GameBoard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "GameBoard": (()=>GameBoard)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.3.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$src$2f$store$2f$gameStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/frontend/src/store/gameStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
function GameBoard() {
    _s();
    const { spaces } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$src$2f$store$2f$gameStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGameStore"])();
    // Group spaces by rings for rendering
    const rings = [
        0,
        1,
        2,
        3,
        4
    ];
    const spacesByRing = rings.map((ring)=>spaces.filter((space)=>space.ring === ring));
    // Use a fixed viewBox for consistent proportions, let CSS handle sizing
    const viewBoxSize = 800;
    const centerX = viewBoxSize / 2;
    const centerY = viewBoxSize / 2;
    const ringRadii = [
        120,
        180,
        240,
        300,
        360
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full max-w-4xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "w-full h-auto overflow-visible",
                viewBox: `0 0 ${viewBoxSize} ${viewBoxSize}`,
                preserveAspectRatio: "xMidYMid meet",
                children: [
                    ringRadii.map((radius, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                            cx: centerX,
                            cy: centerY,
                            r: radius,
                            fill: "none",
                            stroke: "rgba(148, 163, 184, 0.2)",
                            strokeWidth: "1"
                        }, index, false, {
                            fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this)),
                    [
                        0,
                        1,
                        2,
                        3
                    ].map((i)=>{
                        const angle = i * Math.PI / 2;
                        const x1 = centerX + Math.cos(angle) * 80;
                        const y1 = centerY + Math.sin(angle) * 80;
                        const x2 = centerX + Math.cos(angle) * 380;
                        const y2 = centerY + Math.sin(angle) * 380;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: x1,
                            y1: y1,
                            x2: x2,
                            y2: y2,
                            stroke: "rgba(148, 163, 184, 0.3)",
                            strokeWidth: "3"
                        }, i, false, {
                            fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                            lineNumber: 51,
                            columnNumber: 13
                        }, this);
                    }),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: `M ${centerX + Math.cos(0) * 270} ${centerY + Math.sin(0) * 270}
              A 270 270 0 0 1 ${centerX + Math.cos(Math.PI / 2) * 270} ${centerY + Math.sin(Math.PI / 2) * 270}`,
                        fill: "none",
                        stroke: "rgba(239, 68, 68, 0.6)",
                        strokeWidth: "3",
                        strokeDasharray: "8,8"
                    }, void 0, false, {
                        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: centerX + 320,
                        y: centerY - 20,
                        textAnchor: "middle",
                        className: "fill-slate-300 text-lg font-medium",
                        children: "⛰️ Mountains"
                    }, void 0, false, {
                        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: centerX - 20,
                        y: centerY - 320,
                        textAnchor: "middle",
                        className: "fill-slate-300 text-lg font-medium",
                        children: "🌾 Pastures"
                    }, void 0, false, {
                        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: centerX - 320,
                        y: centerY + 20,
                        textAnchor: "middle",
                        className: "fill-slate-300 text-lg font-medium",
                        children: "🌲 Forests"
                    }, void 0, false, {
                        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: centerX + 20,
                        y: centerY + 320,
                        textAnchor: "middle",
                        className: "fill-slate-300 text-lg font-medium",
                        children: "🏞️ Riverlands"
                    }, void 0, false, {
                        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: centerX + 160,
                        y: centerY - 80,
                        textAnchor: "middle",
                        className: "fill-slate-400 text-sm",
                        children: "🐻 Caves (Safe)"
                    }, void 0, false, {
                        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                        lineNumber: 88,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: centerX + 260,
                        y: centerY - 160,
                        textAnchor: "middle",
                        className: "fill-red-400 text-sm",
                        children: "⚔️ Hunting (Danger)"
                    }, void 0, false, {
                        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                        lineNumber: 91,
                        columnNumber: 9
                    }, this),
                    spacesByRing.map((ringSpaces, ringIndex)=>ringSpaces.map((space)=>{
                            const radius = ringRadii[ringIndex];
                            const angle = space.angle;
                            // Round coordinates to avoid hydration mismatches
                            const x = Math.round((centerX + Math.cos(angle) * radius) * 100) / 100;
                            const y = Math.round((centerY + Math.sin(angle) * radius) * 100) / 100;
                            const size = getSpaceSize(ringIndex);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GameSpaceSVG, {
                                space: space,
                                x: x,
                                y: y,
                                size: size
                            }, space.id, false, {
                                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                                lineNumber: 106,
                                columnNumber: 15
                            }, this);
                        }))
                ]
            }, void 0, true, {
                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-700 border-2 border-slate-500  flex items-center justify-center text-sm sm:text-xl",
                children: "🎯"
            }, void 0, false, {
                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                lineNumber: 119,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_s(GameBoard, "UtF79VU1+twD/Uipvkm7S+Spj9o=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$src$2f$store$2f$gameStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGameStore"]
    ];
});
_c = GameBoard;
function getSpaceSize(ringIndex) {
    // Smaller spaces for inner rings, larger for outer rings
    // Responsive sizing will be handled by SVG scaling
    return 12 + ringIndex * 3;
}
function GameSpaceSVG({ space, x, y, size }) {
    _s1();
    const { selectSpace, selectedSpaceId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$src$2f$store$2f$gameStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGameStore"])();
    const handleClick = ()=>{
        selectSpace(space.id);
    };
    const getSpaceColor = ()=>{
        if (space.isSelected || selectedSpaceId === space.id) {
            return '#fbbf24' // yellow-400
            ;
        }
        if (space.isHighlighted) {
            return '#10b981' // green-500
            ;
        }
        switch(space.quadrant){
            case 'Mountains':
                return space.subArea === 'Caves' ? '#64748b' // slate-500
                 : '#ea580c' // orange-600
                ;
            case 'Pastures':
                return '#16a34a' // green-600
                ;
            case 'Forests':
                return '#166534' // green-800
                ;
            case 'Riverlands':
                return '#2563eb' // blue-600
                ;
            default:
                return '#64748b' // slate-500
                ;
        }
    };
    const getPieceColor = ()=>{
        if (!space.piece) return '';
        if (space.piece.type === 'bear') {
            return '#92400e' // amber-700
            ;
        }
        // Player pieces
        const player = space.piece.playerId;
        if (player === 1) return '#dc2626' // red-600
        ;
        if (player === 2) return '#2563eb' // blue-600
        ;
        return '#7c3aed' // purple-600
        ;
    };
    const getIndicator = ()=>{
        if (space.subArea === 'Caves') return '🕳️';
        if (space.subArea === 'Hunting Grounds') return '⚔️';
        if (space.quadrant === 'Pastures') return '🌾';
        if (space.quadrant === 'Forests') return '🌲';
        if (space.quadrant === 'Riverlands') return '🐟';
        return '';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: x,
                cy: y,
                r: size,
                fill: getSpaceColor(),
                stroke: space.isSelected || selectedSpaceId === space.id ? '#fbbf24' : '#374151',
                strokeWidth: space.isSelected || selectedSpaceId === space.id ? 3 : 1,
                className: "cursor-pointer hover:stroke-white transition-all duration-200",
                onClick: handleClick
            }, void 0, false, {
                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                lineNumber: 202,
                columnNumber: 7
            }, this),
            space.piece && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: x,
                cy: y,
                r: size * 0.7,
                fill: getPieceColor(),
                stroke: "#1f2937",
                strokeWidth: "1"
            }, void 0, false, {
                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                lineNumber: 215,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                x: x,
                y: y,
                textAnchor: "middle",
                dominantBaseline: "central",
                className: "fill-white text-xs font-bold pointer-events-none select-none",
                fontSize: size * 0.6,
                children: space.piece ? space.piece.type === 'bear' ? '🐻' : space.piece.playerId : !space.piece && getIndicator() ? getIndicator() : ''
            }, void 0, false, {
                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                lineNumber: 226,
                columnNumber: 7
            }, this),
            (space.isSelected || selectedSpaceId === space.id) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: x,
                cy: y,
                r: size + 2,
                fill: "none",
                stroke: "#fbbf24",
                strokeWidth: "2",
                className: "animate-pulse"
            }, void 0, false, {
                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                lineNumber: 242,
                columnNumber: 9
            }, this),
            space.isHighlighted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$3$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: x,
                cy: y,
                r: size + 2,
                fill: "none",
                stroke: "#10b981",
                strokeWidth: "2",
                className: "animate-pulse"
            }, void 0, false, {
                fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
                lineNumber: 255,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/frontend/src/components/game/GameBoard.tsx",
        lineNumber: 200,
        columnNumber: 5
    }, this);
}
_s1(GameSpaceSVG, "8D2vYLM95EA/0ERS+ciTzNDkEKs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$src$2f$store$2f$gameStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGameStore"]
    ];
});
_c1 = GameSpaceSVG;
var _c, _c1;
__turbopack_context__.k.register(_c, "GameBoard");
__turbopack_context__.k.register(_c1, "GameSpaceSVG");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/frontend/src/components/game/GameBoard.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/apps/frontend/src/components/game/GameBoard.tsx [app-client] (ecmascript)"));
}}),
}]);

//# sourceMappingURL=apps_frontend_src_components_game_GameBoard_tsx_03cbb04d._.js.map