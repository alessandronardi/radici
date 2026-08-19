/* ==========================================================================
   Radici - Motore Grafico Botanico & Geometrie Parametriche di Nuova Generazione
   ========================================================================== */

/**
 * Costanti degli stadi di sviluppo biologico
 */
const GROWTH_STAGE = {
    SEED: 0,
    GERMINATION: 10,
    VEGETATIVE: 20,
    BUD: 60,
    BLOOM: 85,
    MATURE: 100
};

/**
 * Restituisce l'identificatore dello stadio biologico in base al progresso (0-100)
 */
function getGrowthStage(g) {
    if (g < GROWTH_STAGE.GERMINATION) return 'SEED';
    if (g < GROWTH_STAGE.VEGETATIVE) return 'GERMINATION';
    if (g < GROWTH_STAGE.BUD) return 'VEGETATIVE';
    if (g < GROWTH_STAGE.BLOOM) return 'BUD';
    if (g < GROWTH_STAGE.MATURE) return 'BLOOM';
    return 'MATURE';
}

/**
 * Restituisce il nome leggibile dello stadio biologico
 */
function getStageName(g) {
    const stage = getGrowthStage(g);
    switch (stage) {
        case 'SEED': return 'Sotto terra (seme)';
        case 'GERMINATION': return 'Germinazione';
        case 'VEGETATIVE': return 'Fase vegetativa';
        case 'BUD': return 'Stadio bocciolo';
        case 'BLOOM': return 'Fioritura suprema';
        case 'MATURE': return 'Splendore supremo';
        default: return 'Fase vegetativa';
    }
}

/**
 * Funzione helper matematica: smoothstep continuo
 */
function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

/**
 * Helper per tinteggiare e calibrare colori nello spazio HSL
 */
function tint(hex, options = {}) {
    const { hueShift = 0, satMul = 1.0, lightMul = 1.0 } = options;
    const color = new THREE.Color(hex);
    const hsl = {};
    color.getHSL(hsl);
    const h = (hsl.h + hueShift + 1.0) % 1.0;
    const s = Math.max(0.0, Math.min(1.0, hsl.s * satMul));
    const l = Math.max(0.0, Math.min(1.0, hsl.l * lightMul));
    color.setHSL(h, s, l);
    return color;
}

/**
 * Helper per liberare ricorsivamente memoria GPU/CPU in Three.js
 */
function disposeHierarchy(obj) {
    if (!obj) return;
    obj.traverse((child) => {
        if (child.isMesh || child.isPoints || child.isLine) {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });
}

/**
 * Rilevamento delle capacità grafiche del dispositivo
 */
const IS_MOBILE_OR_LOW_POWER = (function() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    const isMobileDevice = /mobile|android|iphone|ipad|ipod|windows phone/i.test(ua);
    const isSmallScreen = typeof window !== 'undefined' && (window.innerWidth < 768 || window.innerHeight < 600);
    return isMobileDevice || isSmallScreen;
})();

/* ==========================================================================
   1. Texture procedurali per nervature fogliari e petali
   ========================================================================== */

let _leafVeinTextureCache = null;
function getLeafVeinTexture() {
    if (_leafVeinTextureCache) return _leafVeinTextureCache;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base neutra normale / bump
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Nervatura centrale primaria (longitudinale)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(size / 2, size);
    ctx.quadraticCurveTo(size / 2, size * 0.4, size / 2, 20);
    ctx.stroke();

    // Nervature secondarie laterali pinnate
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 4;
    const ribs = 12;
    for (let i = 1; i < ribs; i++) {
        const y = size - (i / ribs) * size * 0.85;
        const span = (1 - (i / ribs) * 0.5) * (size * 0.4);
        
        // Destra
        ctx.beginPath();
        ctx.moveTo(size / 2, y);
        ctx.quadraticCurveTo(size / 2 + span * 0.5, y - 25, size / 2 + span, y - 45);
        ctx.stroke();

        // Sinistra
        ctx.beginPath();
        ctx.moveTo(size / 2, y);
        ctx.quadraticCurveTo(size / 2 - span * 0.5, y - 25, size / 2 - span, y - 45);
        ctx.stroke();
    }

    _leafVeinTextureCache = new THREE.CanvasTexture(canvas);
    _leafVeinTextureCache.wrapS = THREE.ClampToEdgeWrapping;
    _leafVeinTextureCache.wrapT = THREE.ClampToEdgeWrapping;
    return _leafVeinTextureCache;
}

/**
 * Materiali PBR botanici con Subsurface Scattering (traslucenza) e finiture fisiche
 */
function createBotanicalMaterial(params) {
    const {
        color,
        roughness = 0.55,
        metalness = 0.02,
        transmission = 0.28,
        thickness = 0.25,
        clearcoat = 0.15,
        clearcoatRoughness = 0.2,
        sheenColor = null,
        transparent = false,
        opacity = 1.0,
        bumpMap = null,
        bumpScale = 0.02,
        doubleSide = true
    } = params;

    const side = doubleSide ? THREE.DoubleSide : THREE.FrontSide;
    const baseColor = new THREE.Color(color);

    if (IS_MOBILE_OR_LOW_POWER) {
        return new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: Math.max(0.3, roughness),
            metalness: metalness,
            transparent: transparent || opacity < 0.99,
            opacity: opacity,
            side: side
        });
    }

    // In Three.js r128, sheen deve essere un'istanza di THREE.Color o null (MAI un numero)
    let sheenObj = null;
    if (sheenColor) {
        sheenObj = new THREE.Color(sheenColor);
    } else if (params.sheen && params.sheen.isColor) {
        sheenObj = params.sheen;
    }

    const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        roughness: roughness,
        metalness: metalness,
        transmission: transmission,
        thickness: thickness,
        clearcoat: clearcoat,
        clearcoatRoughness: clearcoatRoughness,
        sheen: sheenObj,
        bumpMap: bumpMap,
        bumpScale: bumpScale,
        transparent: transparent || opacity < 0.99,
        opacity: opacity,
        side: side
    });

    return mat;
}

/* ==========================================================================
   2. Configurazione Botanica delle 10 Specie
   ========================================================================== */
const SPECIES_CONFIG = {
    orchidea: {
        scientificName: "Phalaenopsis Selena",
        emoji: "🌸",
        themeColor: "#34d399",
        alpha: 0.008,
        beta: 0.004,
        optLight: { min: 0.6, max: 0.9 },
        growthRate: 0.12,
        description: "Nativa dei boschi ombrosi. Si sviluppa adagiandosi elegantemente, protendendo foglie basali carnose e calici setosi e traslucidi.",
        needs: "Luce soffusa e filtrata. Terreno delicatamente inumidito con pause regolari.",
        maxHeight: 1.7,
        stem: {
            color: "#38a169",
            roughness: 0.6,
            transmission: 0.2,
            baseRadius: 0.048,
            tipRadius: 0.018,
            curveType: 'arch'
        },
        leaves: {
            type: 'oval',
            count: 4,
            length: 0.78,
            width: 0.42,
            thickness: 0.03,
            color: "#276749",
            placement: 'basal'
        },
        flower: {
            type: 'orchid',
            petalColor: "#f472b6",
            centerColor: "#fbbf24",
            secondaryColor: "#ec4899",
            scale: 1.05,
            count: 3
        },
        roots: {
            density: 9,
            depth: 0.75,
            spread: 0.55,
            color: "#a3e635"
        }
    },
    loto: {
        scientificName: "Nelumbo Ignis",
        emoji: "🪷",
        themeColor: "#f59e0b",
        alpha: 0.012,
        beta: 0.007,
        optLight: { min: 0.9, max: 1.3 },
        growthRate: 0.2,
        description: "Simbolo di purezza geometrica e fioritura solare. Foglie concave idrorepellenti a scudo e petali dorati a coppa.",
        needs: "Luce zenitale viva ed intensa. Consumo idrico elevato per sostenere la traspirazione.",
        maxHeight: 2.2,
        stem: {
            color: "#10b981",
            roughness: 0.55,
            transmission: 0.25,
            baseRadius: 0.052,
            tipRadius: 0.022,
            curveType: 'straight_sway'
        },
        leaves: {
            type: 'shield',
            count: 4,
            length: 0.7,
            width: 0.7,
            thickness: 0.025,
            color: "#059669",
            placement: 'mid_height'
        },
        flower: {
            type: 'lotus',
            petalColor: "#fbbf24",
            centerColor: "#ea580c",
            secondaryColor: "#f59e0b",
            scale: 1.2,
            count: 1
        },
        roots: {
            density: 13,
            depth: 0.85,
            spread: 0.65,
            color: "#d97706"
        }
    },
    campanula: {
        scientificName: "Campanula Imbricata",
        emoji: "🔔",
        themeColor: "#3b82f6",
        alpha: 0.006,
        beta: 0.003,
        optLight: { min: 0.4, max: 1.1 },
        growthRate: 0.35,
        description: "Crescita spigliata e flessuosa. Sviluppa graziosi calici a campana pendenti che vibrano delicatamente al soffio del vento.",
        needs: "Resiliente e adattabile. Sopporta ampi range di luminosità e riprende rapidamente turgore.",
        maxHeight: 1.95,
        stem: {
            color: "#14b8a6",
            roughness: 0.6,
            transmission: 0.2,
            baseRadius: 0.042,
            tipRadius: 0.014,
            curveType: 'branched'
        },
        leaves: {
            type: 'lanceolate',
            count: 8,
            length: 0.48,
            width: 0.18,
            thickness: 0.018,
            color: "#0d9488",
            placement: 'along_stem'
        },
        flower: {
            type: 'bell',
            petalColor: "#60a5fa",
            centerColor: "#bfdbfe",
            secondaryColor: "#3b82f6",
            scale: 0.95,
            count: 4
        },
        roots: {
            density: 10,
            depth: 0.7,
            spread: 0.55,
            color: "#38bdf8"
        }
    },
    girasole: {
        scientificName: "Helianthus Solar",
        emoji: "🌻",
        themeColor: "#fbbf24",
        alpha: 0.015,
        beta: 0.009,
        optLight: { min: 1.0, max: 1.5 },
        growthRate: 0.3,
        description: "Tributo solare alla luce zenitale. Fusto robusto con grandi foglie a cuore e un maestoso disco centrale a spirale di Fibonacci.",
        needs: "Forte esposizione solare diretta e generose innaffiature costanti.",
        maxHeight: 2.45,
        stem: {
            color: "#84cc16",
            roughness: 0.7,
            transmission: 0.15,
            baseRadius: 0.068,
            tipRadius: 0.032,
            curveType: 'head_tilt'
        },
        leaves: {
            type: 'broad_heart',
            count: 6,
            length: 0.72,
            width: 0.52,
            thickness: 0.028,
            color: "#4d7c0f",
            placement: 'alternate'
        },
        flower: {
            type: 'sunflower',
            petalColor: "#facc15",
            centerColor: "#381a07",
            secondaryColor: "#eab308",
            scale: 1.35,
            count: 1
        },
        roots: {
            density: 15,
            depth: 0.95,
            spread: 0.7,
            color: "#ca8a04"
        }
    },
    lavanda: {
        scientificName: "Lavandula Serene",
        emoji: "🪻",
        themeColor: "#a78bfa",
        alpha: 0.006,
        beta: 0.003,
        optLight: { min: 0.7, max: 1.3 },
        growthRate: 0.25,
        description: "Portamento cespuglioso aromatico. Fogliame aghiforme argentato e dense spighe violette a verticilli delicati.",
        needs: "Predilige ambiente asciutto e luce calda. Teme i ristagni idrici prolungati.",
        maxHeight: 1.8,
        stem: {
            color: "#059669",
            roughness: 0.7,
            transmission: 0.15,
            baseRadius: 0.038,
            tipRadius: 0.014,
            curveType: 'multi_stalk'
        },
        leaves: {
            type: 'needle',
            count: 18,
            length: 0.38,
            width: 0.055,
            thickness: 0.015,
            color: "#2dd4bf",
            placement: 'whorled'
        },
        flower: {
            type: 'lavender_spike',
            petalColor: "#a78bfa",
            centerColor: "#7c3aed",
            secondaryColor: "#c4b5fd",
            scale: 0.9,
            count: 3
        },
        roots: {
            density: 12,
            depth: 0.78,
            spread: 0.6,
            color: "#8b5cf6"
        }
    },
    rosa: {
        scientificName: "Rosa Mystica",
        emoji: "🌹",
        themeColor: "#f43f5e",
        alpha: 0.010,
        beta: 0.005,
        optLight: { min: 0.8, max: 1.2 },
        growthRate: 0.2,
        description: "Regina del giardino contemplativo. Fusto sinuoso con foglie dentellate e petali concentrici vellutati disposti a spirale aurea.",
        needs: "Luce solare morbida e costante. Terreno fertile con idratazione equilibrata.",
        maxHeight: 2.1,
        stem: {
            color: "#047857",
            roughness: 0.6,
            transmission: 0.18,
            baseRadius: 0.05,
            tipRadius: 0.02,
            curveType: 'zigzag'
        },
        leaves: {
            type: 'serrated_oval',
            count: 8,
            length: 0.46,
            width: 0.3,
            thickness: 0.022,
            color: "#065f46",
            placement: 'alternate'
        },
        flower: {
            type: 'rose',
            petalColor: "#e11d48",
            centerColor: "#881337",
            secondaryColor: "#fb7185",
            scale: 1.15,
            count: 1
        },
        roots: {
            density: 11,
            depth: 0.82,
            spread: 0.58,
            color: "#be123c"
        }
    },
    tulipano: {
        scientificName: "Tulipa Aura",
        emoji: "🌷",
        themeColor: "#f97316",
        alpha: 0.009,
        beta: 0.004,
        optLight: { min: 0.6, max: 1.1 },
        growthRate: 0.35,
        description: "Eleganza pura ed essenziale. Grandi foglie carnose avvolgenti alla base e un calice scarlatto dai tepali perfettamente incurvati.",
        needs: "Luce moderata e freschezza nel terreno. Terreno sempre uniformemente umido.",
        maxHeight: 1.55,
        stem: {
            color: "#34d399",
            roughness: 0.55,
            transmission: 0.22,
            baseRadius: 0.052,
            tipRadius: 0.024,
            curveType: 'graceful_curve'
        },
        leaves: {
            type: 'clasping_broad',
            count: 3,
            length: 0.85,
            width: 0.36,
            thickness: 0.028,
            color: "#059669",
            placement: 'basal_sheath'
        },
        flower: {
            type: 'tulip',
            petalColor: "#f97316",
            centerColor: "#1c1917",
            secondaryColor: "#ea580c",
            scale: 1.05,
            count: 1
        },
        roots: {
            density: 10,
            depth: 0.65,
            spread: 0.48,
            color: "#f97316"
        }
    },
    ibisco: {
        scientificName: "Hibiscus Rubra",
        emoji: "🌺",
        themeColor: "#ec4899",
        alpha: 0.014,
        beta: 0.007,
        optLight: { min: 0.9, max: 1.4 },
        growthRate: 0.22,
        description: "Arbusto dal fascino lussureggiante. Grandi petali serici con orli ondulati e una slanciata colonna staminale ricoperta di polline dorato.",
        needs: "Luce zenitale calda ed elevata umidità costante.",
        maxHeight: 1.95,
        stem: {
            color: "#065f46",
            roughness: 0.65,
            transmission: 0.18,
            baseRadius: 0.058,
            tipRadius: 0.022,
            curveType: 'branched'
        },
        leaves: {
            type: 'lobed',
            count: 10,
            length: 0.54,
            width: 0.36,
            thickness: 0.022,
            color: "#047857",
            placement: 'along_stem'
        },
        flower: {
            type: 'hibiscus',
            petalColor: "#db2777",
            centerColor: "#fde047",
            secondaryColor: "#be185d",
            scale: 1.3,
            count: 2
        },
        roots: {
            density: 13,
            depth: 0.88,
            spread: 0.62,
            color: "#db2777"
        }
    },
    gelsomino: {
        scientificName: "Jasminum Stellar",
        emoji: "✨",
        themeColor: "#e2e8f0",
        alpha: 0.008,
        beta: 0.005,
        optLight: { min: 0.5, max: 1.0 },
        growthRate: 0.3,
        description: "Rampicante sinuoso e aggraziato. Fusti flessibili che si avvolgono a spirale, costellati di candide stelle traslucide.",
        needs: "Luce filtrata e ambiente armoniosamente umido.",
        maxHeight: 2.25,
        stem: {
            color: "#059669",
            roughness: 0.6,
            transmission: 0.2,
            baseRadius: 0.04,
            tipRadius: 0.014,
            curveType: 'twining_helix'
        },
        leaves: {
            type: 'pinnate_small',
            count: 16,
            length: 0.32,
            width: 0.16,
            thickness: 0.016,
            color: "#10b981",
            placement: 'pairs'
        },
        flower: {
            type: 'jasmine_star',
            petalColor: "#f8fafc",
            centerColor: "#fef08a",
            secondaryColor: "#f1f5f9",
            scale: 0.8,
            count: 5
        },
        roots: {
            density: 9,
            depth: 0.72,
            spread: 0.52,
            color: "#94a3b8"
        }
    },
    magnolia: {
        scientificName: "Magnolia Nova",
        emoji: "💮",
        themeColor: "#f472b6",
        alpha: 0.011,
        beta: 0.006,
        optLight: { min: 0.7, max: 1.2 },
        growthRate: 0.16,
        description: "Forma ancestrale maestosa. Fusto legnoso levigato, foglie spesse e coriacee e grandi tepali serici e carnosi a scultura concava.",
        needs: "Luce equilibrata e terreno profondo ben curato.",
        maxHeight: 1.85,
        stem: {
            color: "#475569",
            roughness: 0.8,
            transmission: 0.05,
            baseRadius: 0.075,
            tipRadius: 0.028,
            curveType: 'woody_trunk'
        },
        leaves: {
            type: 'leathery_oval',
            count: 6,
            length: 0.75,
            width: 0.4,
            thickness: 0.035,
            color: "#1e3a2f",
            placement: 'clustered'
        },
        flower: {
            type: 'magnolia',
            petalColor: "#fce7f3",
            centerColor: "#ec4899",
            secondaryColor: "#f472b6",
            scale: 1.25,
            count: 2
        },
        roots: {
            density: 16,
            depth: 0.92,
            spread: 0.72,
            color: "#64748b"
        }
    }
};

/* ==========================================================================
   3. Generatore di Geometria Fusto a Sezione Tapered con Frenet Frames
   ========================================================================== */

function getFrameAt(curve, t) {
    const point = curve.getPointAt(t);
    const epsilon = 0.001;
    const tNext = Math.min(1.0, t + epsilon);
    const pointNext = curve.getPointAt(tNext);
    const tangent = new THREE.Vector3().subVectors(pointNext, point).normalize();
    
    const ref = new THREE.Vector3(0, 0, 1);
    let normal = new THREE.Vector3().crossVectors(tangent, ref).normalize();
    if (normal.lengthSq() < 0.0001) {
        normal.set(1, 0, 0);
    }
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    return { point, tangent, normal, binormal };
}

function createTaperedTubeGeometry(curve, tubularSegments = 32, radialSegments = 12, radiusFunc) {
    const vertices = [];
    const indices = [];
    const uvs = [];
    const normals = [];

    for (let i = 0; i <= tubularSegments; i++) {
        const t = i / tubularSegments;
        const frame = getFrameAt(curve, t);
        const r = Math.max(0.001, radiusFunc(t));

        for (let j = 0; j <= radialSegments; j++) {
            const theta = (j / radialSegments) * Math.PI * 2;
            const sin = Math.sin(theta);
            const cos = Math.cos(theta);

            const vx = frame.point.x + r * (cos * frame.normal.x + sin * frame.binormal.x);
            const vy = frame.point.y + r * (cos * frame.normal.y + sin * frame.binormal.y);
            const vz = frame.point.z + r * (cos * frame.normal.z + sin * frame.binormal.z);
            vertices.push(vx, vy, vz);

            const nx = cos * frame.normal.x + sin * frame.binormal.x;
            const ny = cos * frame.normal.y + sin * frame.binormal.y;
            const nz = cos * frame.normal.z + sin * frame.binormal.z;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            normals.push(nx / len, ny / len, nz / len);

            uvs.push(t, j / radialSegments);
        }
    }

    for (let i = 0; i < tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j;
            const b = i * (radialSegments + 1) + j + 1;
            const c = (i + 1) * (radialSegments + 1) + j;
            const d = (i + 1) * (radialSegments + 1) + j + 1;

            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
}

function getStemCurvePoints(specie, h, H, droopFactor = 0.0) {
    const points = [];
    const N = 8;
    const droopDamp = smoothstep(0.0, 1.0, droopFactor);

    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        const factor = t * t;
        let x = 0;
        let z = 0;

        switch (specie) {
            case 'orchidea':
                x = Math.sin(t * Math.PI) * 0.38 * h + t * 0.42 * h;
                z = Math.cos(t * Math.PI * 1.5) * 0.08 * h;
                break;
            case 'loto':
                x = Math.sin(t * Math.PI * 0.5) * 0.06 * h;
                z = Math.cos(t * Math.PI * 0.5) * 0.04 * h;
                break;
            case 'campanula':
                x = Math.sin(t * Math.PI * 1.2) * 0.16 * h;
                z = Math.cos(t * Math.PI * 0.8) * 0.08 * h;
                break;
            case 'girasole':
                x = Math.sin(t * Math.PI * 0.4) * 0.06 * h;
                z = i >= N - 2 ? 0.1 * h : 0;
                break;
            case 'rosa':
                x = Math.sin(t * Math.PI * 2.0) * 0.05 * h;
                z = Math.cos(t * Math.PI * 1.5) * 0.04 * h;
                break;
            case 'tulipano':
                x = 0.12 * h * factor;
                z = Math.sin(t * Math.PI * 0.7) * 0.05 * h;
                break;
            case 'gelsomino':
                const angle = t * Math.PI * 3.5;
                x = Math.cos(angle) * 0.14 * h * t;
                z = Math.sin(angle) * 0.14 * h * t;
                break;
            case 'magnolia':
                x = Math.sin(t * Math.PI * 0.6) * 0.09 * h;
                z = Math.cos(t * Math.PI * 0.6) * 0.05 * h;
                break;
            case 'lavanda':
            case 'ibisco':
            default:
                x = Math.sin(t * Math.PI * 0.5) * 0.04 * h;
                z = Math.cos(t * Math.PI * 0.5) * 0.03 * h;
                break;
        }

        const droopedZ = droopDamp * 0.38 * factor;
        const droopedY = -droopDamp * 0.24 * factor;

        points.push(new THREE.Vector3(x, yBase + droopedY, z + droopedZ));
    }
    return points;
}

/* ==========================================================================
   4. Generatori di Geometria Parametrica Curva per Foglie e Petali
   ========================================================================== */

/**
 * Genera una mesh fogliare curva con profilo concavo a coppa, nervatura centrale e orlo levigato
 */
function createOrganicLeafGeometry(leafSpec, h) {
    const length = leafSpec.length * h;
    const width = leafSpec.width * h;
    const thickness = leafSpec.thickness * h;
    const type = leafSpec.type;

    // Se è tipo Loto (foglia a scudo concavo circolare)
    if (type === 'shield') {
        const segs = 32;
        const rings = 6;
        const geo = new THREE.BufferGeometry();
        const verts = [];
        const uvs = [];
        const indices = [];

        for (let r = 0; r <= rings; r++) {
            const rad = (r / rings) * (width * 0.5);
            const cupY = Math.pow(r / rings, 1.8) * 0.06 * h;
            for (let s = 0; s <= segs; s++) {
                const theta = (s / segs) * Math.PI * 2;
                const ruffle = r === rings ? Math.sin(theta * 8) * 0.015 * h : 0;
                const vx = Math.cos(theta) * rad;
                const vy = cupY + ruffle;
                const vz = Math.sin(theta) * rad;
                verts.push(vx, vy, vz);
                uvs.push((Math.cos(theta) * (r / rings) + 1) * 0.5, (Math.sin(theta) * (r / rings) + 1) * 0.5);
            }
        }

        for (let r = 0; r < rings; r++) {
            for (let s = 0; s < segs; s++) {
                const a = r * (segs + 1) + s;
                const b = r * (segs + 1) + s + 1;
                const c = (r + 1) * (segs + 1) + s;
                const d = (r + 1) * (segs + 1) + s + 1;
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }

    // Griglia parametrica per foglie longitudinali (U = lunghezza, V = larghezza)
    const uSegs = 16;
    const vSegs = 8;
    const verts = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= uSegs; i++) {
        const u = i / uSegs;
        
        let w = 0;
        switch (type) {
            case 'needle':
                w = Math.sin(u * Math.PI) * width * 0.45;
                break;
            case 'lanceolate':
                w = Math.sin(Math.pow(u, 0.7) * Math.PI) * width;
                break;
            case 'broad_heart':
                w = Math.sin(Math.pow(u, 0.4) * Math.PI) * width * (1.1 - u * 0.4);
                break;
            case 'clasping_broad':
                w = Math.sin(Math.pow(u, 0.6) * Math.PI) * width;
                break;
            case 'lobed':
                const baseW = Math.sin(u * Math.PI) * width;
                w = baseW * (0.8 + 0.25 * Math.sin(u * Math.PI * 4));
                break;
            case 'oval':
            case 'serrated_oval':
            case 'leathery_oval':
            default:
                w = Math.sin(Math.pow(u, 0.65) * Math.PI) * width;
                break;
        }

        const archY = Math.sin(u * Math.PI * 0.8) * 0.08 * length - Math.pow(u, 2.2) * 0.14 * length;
        const archZ = u * length;

        for (let j = 0; j <= vSegs; j++) {
            const v = (j / vSegs) * 2.0 - 1.0;
            const posX = v * (w * 0.5);
            const cupV = Math.abs(v) * thickness * 0.8;
            
            const edgeRuffle = (type === 'serrated_oval' || type === 'lobed') && Math.abs(v) > 0.7
                ? Math.sin(u * Math.PI * 12) * 0.008 * length
                : 0;

            verts.push(posX, archY + cupV + edgeRuffle, archZ);
            uvs.push((v + 1) * 0.5, u);
        }
    }

    for (let i = 0; i < uSegs; i++) {
        for (let j = 0; j < vSegs; j++) {
            const a = i * (vSegs + 1) + j;
            const b = i * (vSegs + 1) + j + 1;
            const c = (i + 1) * (vSegs + 1) + j;
            const d = (i + 1) * (vSegs + 1) + j + 1;
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Genera una mesh petalo parametrica a doppia curvatura con coppa e bordo arricciato
 */
function createOrganicPetalGeometry(options = {}) {
    const {
        length = 0.3,
        width = 0.2,
        cupping = 0.3,
        curlTip = 0.2,
        fluting = 0.1,
        uSegs = 12,
        vSegs = 8
    } = options;

    const verts = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= uSegs; i++) {
        const u = i / uSegs;
        const w = Math.sin(Math.pow(u, 0.6) * Math.PI) * width;
        const curveZ = u * length;
        const curveY = Math.sin(u * Math.PI * 0.7) * (cupping * length) - Math.pow(u, 3.0) * (curlTip * length);

        for (let j = 0; j <= vSegs; j++) {
            const v = (j / vSegs) * 2.0 - 1.0;
            const posX = v * (w * 0.5);
            const spoonY = Math.abs(v * v) * (cupping * width * 0.5);
            const edgeFlute = Math.abs(v) > 0.6 ? Math.sin(u * Math.PI * 4) * fluting * width * 0.1 : 0;

            verts.push(posX, curveY + spoonY + edgeFlute, curveZ);
            uvs.push((v + 1) * 0.5, u);
        }
    }

    for (let i = 0; i < uSegs; i++) {
        for (let j = 0; j < vSegs; j++) {
            const a = i * (vSegs + 1) + j;
            const b = i * (vSegs + 1) + j + 1;
            const c = (i + 1) * (vSegs + 1) + j;
            const d = (i + 1) * (vSegs + 1) + j + 1;
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

/* ==========================================================================
   5. Costruzione Scultorea dei Fiori & Boccioli delle 10 Specie
   ========================================================================== */

function createFlowerOrBud(specie, h, growthProgress, plantState) {
    const config = SPECIES_CONFIG[specie];
    const flowerGroup = new THREE.Group();
    flowerGroup.name = "flowerNode";

    const isBloomStage = growthProgress >= GROWTH_STAGE.BLOOM;
    const isBudStage = growthProgress >= GROWTH_STAGE.BUD && growthProgress < GROWTH_STAGE.BLOOM;

    if (!isBloomStage && !isBudStage) {
        return flowerGroup;
    }

    const bloomFactor = isBloomStage 
        ? smoothstep(GROWTH_STAGE.BLOOM, GROWTH_STAGE.MATURE, growthProgress)
        : 0.0;

    const scale = (0.5 + 0.5 * bloomFactor) * config.flower.scale * h;

    const satMul = plantState ? plantState.colorSaturate : 1.0;
    const hyd = plantState ? plantState.hydration : 100;
    const lightMul = 0.6 + hyd / 250;

    const petalMat = createBotanicalMaterial({
        color: tint(config.flower.petalColor, { satMul, lightMul }),
        roughness: 0.45,
        transmission: 0.35,
        thickness: 0.22,
        sheenColor: tint(config.flower.secondaryColor || config.flower.petalColor, { satMul: satMul * 1.2, lightMul: 1.1 }),
        doubleSide: true
    });

    const centerMat = createBotanicalMaterial({
        color: tint(config.flower.centerColor, { satMul, lightMul }),
        roughness: 0.6,
        metalness: 0.08,
        transmission: 0.15
    });

    if (isBudStage) {
        const budCalyx = new THREE.Group();
        const sepalsCount = 5;
        const sepalMat = createBotanicalMaterial({
            color: tint(config.stem.color, { satMul, lightMul }),
            roughness: 0.65,
            transmission: 0.2
        });

        for (let s = 0; s < sepalsCount; s++) {
            const angle = (s * Math.PI * 2) / sepalsCount;
            const sepalGeo = createOrganicPetalGeometry({
                length: 0.18 * scale,
                width: 0.09 * scale,
                cupping: 0.6,
                curlTip: -0.1
            });
            const sepalMesh = new THREE.Mesh(sepalGeo, sepalMat);
            sepalMesh.rotation.y = angle;
            sepalMesh.rotation.x = 0.3;
            budCalyx.add(sepalMesh);
        }

        const budCoreGeo = new THREE.SphereGeometry(0.07 * scale, 12, 12);
        budCoreGeo.scale(0.8, 1.4, 0.8);
        const budCore = new THREE.Mesh(budCoreGeo, petalMat);
        budCore.position.y = 0.06 * scale;
        budCalyx.add(budCore);
        flowerGroup.add(budCalyx);
        return flowerGroup;
    }

    switch (specie) {
        case 'orchidea': {
            const dorsalGeo = createOrganicPetalGeometry({ length: 0.32 * scale, width: 0.18 * scale, cupping: 0.25, curlTip: 0.15 });
            const dorsal = new THREE.Mesh(dorsalGeo, petalMat);
            dorsal.rotation.x = 0.2;
            flowerGroup.add(dorsal);

            for (let i = -1; i <= 1; i += 2) {
                const latSepalGeo = createOrganicPetalGeometry({ length: 0.28 * scale, width: 0.15 * scale, cupping: 0.2 });
                const latSepal = new THREE.Mesh(latSepalGeo, petalMat);
                latSepal.rotation.z = i * 2.1;
                latSepal.rotation.x = 0.35;
                flowerGroup.add(latSepal);
            }

            for (let i = -1; i <= 1; i += 2) {
                const petalGeo = createOrganicPetalGeometry({ length: 0.35 * scale, width: 0.25 * scale, cupping: 0.3, fluting: 0.2 });
                const petal = new THREE.Mesh(petalGeo, petalMat);
                petal.rotation.z = i * 1.1;
                petal.rotation.x = 0.15 + (1.0 - bloomFactor) * 0.4;
                flowerGroup.add(petal);
            }

            const lipGeo = createOrganicPetalGeometry({ length: 0.26 * scale, width: 0.22 * scale, cupping: 0.7, curlTip: -0.3 });
            const lipMesh = new THREE.Mesh(lipGeo, centerMat);
            lipMesh.rotation.x = Math.PI * 0.55;
            lipMesh.position.set(0, -0.02 * scale, 0.04 * scale);
            flowerGroup.add(lipMesh);

            const colGeo = new THREE.CylinderGeometry(0.02 * scale, 0.03 * scale, 0.1 * scale, 8);
            const colMesh = new THREE.Mesh(colGeo, centerMat);
            colMesh.position.set(0, 0.03 * scale, 0.05 * scale);
            colMesh.rotation.x = 0.4;
            flowerGroup.add(colMesh);
            break;
        }

        case 'loto': {
            const podGeo = new THREE.CylinderGeometry(0.14 * scale, 0.08 * scale, 0.1 * scale, 16);
            const pod = new THREE.Mesh(podGeo, centerMat);
            pod.position.y = 0.05 * scale;
            flowerGroup.add(pod);

            const stamenCount = 20;
            for (let s = 0; s < stamenCount; s++) {
                const a = (s * Math.PI * 2) / stamenCount;
                const stamenGeo = new THREE.CylinderGeometry(0.005 * scale, 0.005 * scale, 0.08 * scale, 4);
                const stamen = new THREE.Mesh(stamenGeo, centerMat);
                stamen.position.set(Math.cos(a) * 0.13 * scale, 0.06 * scale, Math.sin(a) * 0.13 * scale);
                stamen.rotation.z = Math.cos(a) * 0.25;
                stamen.rotation.x = Math.sin(a) * 0.25;
                flowerGroup.add(stamen);
            }

            const layers = [
                { count: 6, len: 0.35, wid: 0.22, cup: 0.5, flare: 0.35 + (1 - bloomFactor) * 0.5 },
                { count: 8, len: 0.45, wid: 0.26, cup: 0.4, flare: 0.55 + (1 - bloomFactor) * 0.4 },
                { count: 10, len: 0.52, wid: 0.3, cup: 0.3, flare: 0.85 + (1 - bloomFactor) * 0.2 }
            ];

            layers.forEach((lyr, lIdx) => {
                for (let p = 0; p < lyr.count; p++) {
                    const angle = (p * Math.PI * 2) / lyr.count + lIdx * 0.3;
                    const pGeo = createOrganicPetalGeometry({
                        length: lyr.len * scale,
                        width: lyr.wid * scale,
                        cupping: lyr.cup,
                        curlTip: 0.1
                    });
                    const pMesh = new THREE.Mesh(pGeo, petalMat);
                    pMesh.rotation.y = angle;
                    pMesh.rotation.x = lyr.flare;
                    flowerGroup.add(pMesh);
                }
            });
            break;
        }

        case 'rosa': {
            const roseTiers = 5;
            let currentAngle = 0;
            const goldenRatioAngle = 2.39996;

            for (let layer = 0; layer < roseTiers; layer++) {
                const petalsInTier = 3 + layer * 2;
                const tierRadius = (0.02 + layer * 0.04) * scale;
                const pLen = (0.16 + layer * 0.08) * scale;
                const pWid = (0.14 + layer * 0.07) * scale;
                const flareAngle = (0.15 + Math.pow(layer / roseTiers, 1.4) * 0.85) * bloomFactor;

                for (let k = 0; k < petalsInTier; k++) {
                    currentAngle += goldenRatioAngle;
                    const pGeo = createOrganicPetalGeometry({
                        length: pLen,
                        width: pWid,
                        cupping: 0.55 - layer * 0.08,
                        curlTip: 0.25 * (layer / roseTiers),
                        fluting: 0.15
                    });
                    const pMesh = new THREE.Mesh(pGeo, petalMat);
                    pMesh.position.set(Math.cos(currentAngle) * tierRadius, (layer * 0.02) * scale, Math.sin(currentAngle) * tierRadius);
                    pMesh.rotation.y = currentAngle;
                    pMesh.rotation.x = flareAngle;
                    flowerGroup.add(pMesh);
                }
            }

            const hipGeo = new THREE.SphereGeometry(0.08 * scale, 12, 12);
            hipGeo.scale(1.0, 1.2, 1.0);
            const hipMat = createBotanicalMaterial({ color: config.stem.color, roughness: 0.7 });
            const hip = new THREE.Mesh(hipGeo, hipMat);
            hip.position.y = -0.04 * scale;
            flowerGroup.add(hip);
            break;
        }

        case 'girasole': {
            const discGeo = new THREE.CylinderGeometry(0.28 * scale, 0.26 * scale, 0.06 * scale, 32);
            const disc = new THREE.Mesh(discGeo, centerMat);
            flowerGroup.add(disc);

            const rayTiers = [
                { count: 24, radius: 0.26 * scale, len: 0.38 * scale, wid: 0.1 * scale, flare: 0.1 },
                { count: 24, radius: 0.28 * scale, len: 0.44 * scale, wid: 0.11 * scale, flare: 0.22 }
            ];

            rayTiers.forEach((tier, tIdx) => {
                for (let r = 0; r < tier.count; r++) {
                    const angle = (r * Math.PI * 2) / tier.count + tIdx * 0.13;
                    const rayGeo = createOrganicPetalGeometry({
                        length: tier.len,
                        width: tier.wid,
                        cupping: 0.25,
                        curlTip: 0.1
                    });
                    const ray = new THREE.Mesh(rayGeo, petalMat);
                    ray.position.set(Math.cos(angle) * tier.radius, (tIdx * 0.015) * scale, Math.sin(angle) * tier.radius);
                    ray.rotation.y = angle;
                    ray.rotation.x = tier.flare * bloomFactor;
                    flowerGroup.add(ray);
                }
            });
            break;
        }

        case 'campanula': {
            const bellGeo = new THREE.ConeGeometry(0.22 * scale, 0.38 * scale, 16, 8, true);
            bellGeo.translate(0, 0.19 * scale, 0);
            bellGeo.rotateX(Math.PI);
            const bell = new THREE.Mesh(bellGeo, petalMat);
            flowerGroup.add(bell);

            const stamenGeo = new THREE.CylinderGeometry(0.008 * scale, 0.008 * scale, 0.28 * scale, 6);
            const stamen = new THREE.Mesh(stamenGeo, centerMat);
            stamen.position.y = -0.08 * scale;
            flowerGroup.add(stamen);
            break;
        }

        case 'tulipano': {
            for (let t = 0; t < 6; t++) {
                const angle = (t * Math.PI * 2) / 6;
                const isInner = t % 2 === 0;
                const tGeo = createOrganicPetalGeometry({
                    length: 0.45 * scale,
                    width: 0.26 * scale,
                    cupping: 0.65,
                    curlTip: isInner ? 0.05 : 0.15
                });
                const tepal = new THREE.Mesh(tGeo, petalMat);
                const r = (isInner ? 0.06 : 0.09) * scale;
                tepal.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
                tepal.rotation.y = angle;
                tepal.rotation.x = 0.2 + 0.45 * (1.0 - bloomFactor);
                flowerGroup.add(tepal);
            }
            break;
        }

        case 'ibisco': {
            for (let p = 0; p < 5; p++) {
                const angle = (p * Math.PI * 2) / 5;
                const pGeo = createOrganicPetalGeometry({
                    length: 0.55 * scale,
                    width: 0.38 * scale,
                    cupping: 0.35,
                    curlTip: 0.2,
                    fluting: 0.25
                });
                const pMesh = new THREE.Mesh(pGeo, petalMat);
                pMesh.rotation.y = angle;
                pMesh.rotation.x = 0.55 * bloomFactor;
                flowerGroup.add(pMesh);
            }

            const colGeo = new THREE.CylinderGeometry(0.018 * scale, 0.025 * scale, 0.65 * scale, 8);
            colGeo.translate(0, 0.32 * scale, 0);
            const col = new THREE.Mesh(colGeo, centerMat);
            flowerGroup.add(col);

            const antherHeadGeo = new THREE.SphereGeometry(0.04 * scale, 8, 8);
            const antherHead = new THREE.Mesh(antherHeadGeo, centerMat);
            antherHead.position.y = 0.65 * scale;
            flowerGroup.add(antherHead);
            break;
        }

        case 'lavanda': {
            const tiers = 7;
            for (let t = 0; t < tiers; t++) {
                const tierY = t * 0.07 * scale;
                const count = 5;
                for (let k = 0; k < count; k++) {
                    const angle = (k * Math.PI * 2) / count + t * 0.6;
                    const floretGeo = new THREE.SphereGeometry(0.038 * scale, 8, 8);
                    floretGeo.scale(0.8, 1.4, 0.8);
                    const floret = new THREE.Mesh(floretGeo, petalMat);
                    floret.position.set(Math.cos(angle) * 0.05 * scale, tierY, Math.sin(angle) * 0.05 * scale);
                    floret.rotation.z = Math.cos(angle) * 0.35;
                    floret.rotation.x = Math.sin(angle) * 0.35;
                    flowerGroup.add(floret);
                }
            }
            break;
        }

        case 'magnolia': {
            const magnoliaTiers = [
                { count: 3, len: 0.55 * scale, wid: 0.36 * scale, flare: 0.25 },
                { count: 6, len: 0.65 * scale, wid: 0.42 * scale, flare: 0.55 }
            ];

            magnoliaTiers.forEach((tier, tIdx) => {
                for (let p = 0; p < tier.count; p++) {
                    const angle = (p * Math.PI * 2) / tier.count + tIdx * 0.4;
                    const tepalGeo = createOrganicPetalGeometry({
                        length: tier.len,
                        width: tier.wid,
                        cupping: 0.5,
                        curlTip: 0.15
                    });
                    const tepal = new THREE.Mesh(tepalGeo, petalMat);
                    tepal.rotation.y = angle;
                    tepal.rotation.x = tier.flare * bloomFactor;
                    flowerGroup.add(tepal);
                }
            });
            break;
        }

        case 'jasmine_star':
        default: {
            const tubeGeo = new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.15 * scale, 8);
            tubeGeo.translate(0, 0.075 * scale, 0);
            const tube = new THREE.Mesh(tubeGeo, petalMat);
            flowerGroup.add(tube);

            for (let p = 0; p < 5; p++) {
                const angle = (p * Math.PI * 2) / 5;
                const pGeo = createOrganicPetalGeometry({
                    length: 0.28 * scale,
                    width: 0.14 * scale,
                    cupping: 0.2,
                    curlTip: 0.1
                });
                const pMesh = new THREE.Mesh(pGeo, petalMat);
                pMesh.position.y = 0.15 * scale;
                pMesh.rotation.y = angle;
                pMesh.rotation.x = 0.45 * bloomFactor;
                flowerGroup.add(pMesh);
            }
            break;
        }
    }

    return flowerGroup;
}

/* ==========================================================================
   6. Apparato Radicale Ipogeo ("Sotto Terra")
   ========================================================================== */

function createSubterraneanRoots(specie, h, plantState) {
    const config = SPECIES_CONFIG[specie];
    const rootGroup = new THREE.Group();
    rootGroup.name = "rootsNode";

    if (h < 0.05) return rootGroup;

    const rootSpec = config.roots;
    const density = Math.floor(rootSpec.density * h);
    const depth = rootSpec.depth * h;
    const spread = rootSpec.spread * h;

    const satMul = plantState ? plantState.colorSaturate : 1.0;
    const hyd = plantState ? plantState.hydration : 100;
    const lightMul = 0.5 + hyd / 200;

    const rootMat = createBotanicalMaterial({
        color: tint(rootSpec.color || '#d97706', { satMul, lightMul }),
        roughness: 0.85,
        metalness: 0.02,
        transmission: 0.18,
        thickness: 0.15
    });

    // 1. Fittone primario sinuoso
    const tapPoints = [];
    const tapN = 7;
    for (let i = 0; i < tapN; i++) {
        const t = i / (tapN - 1);
        const y = 1.10 - t * depth * 0.95;
        const x = Math.sin(t * Math.PI * 2.0) * 0.05 * h;
        const z = Math.cos(t * Math.PI * 2.0) * 0.05 * h;
        tapPoints.push(new THREE.Vector3(x, y, z));
    }
    const tapCurve = new THREE.CatmullRomCurve3(tapPoints);
    const tapGeo = createTaperedTubeGeometry(tapCurve, 16, 8, (t) => (0.04 - 0.03 * t) * h);
    const tapMesh = new THREE.Mesh(tapGeo, rootMat);
    rootGroup.add(tapMesh);

    // 2. Radici secondarie e filamenti capillari ramificati
    for (let r = 0; r < density; r++) {
        const angle = (r * Math.PI * 2) / density + (r % 3) * 0.5;
        const startY = 1.10 - (r / density) * depth * 0.75;
        const latPoints = [];
        const latN = 5;
        const branchLen = spread * (0.5 + 0.5 * Math.random());

        for (let j = 0; j < latN; j++) {
            const t = j / (latN - 1);
            const y = startY - t * depth * 0.35;
            const rad = t * branchLen;
            const x = Math.cos(angle + t * 0.7) * rad;
            const z = Math.sin(angle + t * 0.7) * rad;
            latPoints.push(new THREE.Vector3(x, y, z));
        }

        const latCurve = new THREE.CatmullRomCurve3(latPoints);
        const latGeo = createTaperedTubeGeometry(latCurve, 10, 6, (t) => (0.02 - 0.016 * t) * h);
        const latMesh = new THREE.Mesh(latGeo, rootMat);
        rootGroup.add(latMesh);
    }

    return rootGroup;
}

/* ==========================================================================
   7. Orchestratore Principale di Costruzione 3D della Pianta
   ========================================================================== */

function buildPlant3D(plant, forceRebuild = false) {
    if (!plant || !plant.threeGroup) return;

    const g = plant.displayGrowth !== undefined ? plant.displayGrowth : plant.growthProgress;
    const config = SPECIES_CONFIG[plant.specie];
    if (!config) return;

    const growthDelta = plant.lastBuiltGrowth !== undefined ? Math.abs(g - plant.lastBuiltGrowth) : 999;
    const specieChanged = plant.lastBuiltSpecie !== plant.specie;

    if (!forceRebuild && !specieChanged && growthDelta < 0.25) {
        return;
    }

    while (plant.threeGroup.children.length > 0) {
        const child = plant.threeGroup.children[0];
        disposeHierarchy(child);
        plant.threeGroup.remove(child);
    }

    plant.lastBuiltGrowth = g;
    plant.lastBuiltSpecie = plant.specie;

    if (g < GROWTH_STAGE.GERMINATION) {
        const seedGeo = new THREE.SphereGeometry(0.045, 12, 12);
        seedGeo.scale(0.8, 1.2, 0.8);
        const seedMat = createBotanicalMaterial({ color: '#4a3328', roughness: 0.85 });
        const seed = new THREE.Mesh(seedGeo, seedMat);
        seed.position.set(0, 1.16, 0);
        plant.threeGroup.add(seed);
        return;
    }

    const h = (g - GROWTH_STAGE.GERMINATION) / (GROWTH_STAGE.MATURE - GROWTH_STAGE.GERMINATION);
    const H = config.maxHeight * h;

    const pivotGroup = new THREE.Group();
    pivotGroup.name = "pivotGroup";
    pivotGroup.position.set(0, 1.15, 0);
    plant.threeGroup.add(pivotGroup);

    // 1. Fusto principale
    const stemPts = getStemCurvePoints(plant.specie, h, H, plant.droopFactor);
    const localStemPts = stemPts.map(p => new THREE.Vector3(p.x, p.y - 1.15, p.z));
    const stemCurve = new THREE.CatmullRomCurve3(localStemPts);

    const satMul = plant.colorSaturate || 1.0;
    const lightMul = 0.55 + plant.hydration / 220;

    const stemMat = createBotanicalMaterial({
        color: tint(config.stem.color, { satMul, lightMul }),
        roughness: config.stem.roughness,
        metalness: 0.02,
        transmission: config.stem.transmission,
        thickness: 0.2
    });

    const stemGeo = createTaperedTubeGeometry(
        stemCurve,
        32,
        10,
        (t) => (config.stem.baseRadius - (config.stem.baseRadius - config.stem.tipRadius) * t) * h
    );
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    pivotGroup.add(stemMesh);

    // 2. Gruppo Foglie con geometria a doppia curvatura
    const leavesGroup = new THREE.Group();
    leavesGroup.name = "leavesNode";
    
    const leafMat = createBotanicalMaterial({
        color: tint(config.leaves.color, { satMul, lightMul }),
        roughness: 0.5,
        transmission: 0.3,
        thickness: 0.2,
        clearcoat: 0.25,
        clearcoatRoughness: 0.2,
        bumpMap: getLeafVeinTexture(),
        bumpScale: 0.015,
        doubleSide: true
    });

    const leafCount = config.leaves.count;
    for (let k = 0; k < leafCount; k++) {
        const leafGeo = createOrganicLeafGeometry(config.leaves, h);
        const leafMesh = new THREE.Mesh(leafGeo, leafMat);
        leafMesh.castShadow = true;
        leafMesh.receiveShadow = true;

        const t = (k + 1) / (leafCount + 1);
        const pt = stemCurve.getPointAt(Math.min(0.88, t * 0.85));
        const angle = (k * Math.PI * 2) / 3 + k * 0.5;

        const leafNode = new THREE.Group();
        leafNode.position.copy(pt);
        leafNode.rotation.y = angle;
        leafNode.rotation.x = 0.35 + 0.12 * Math.sin(k);
        leafNode.add(leafMesh);
        leavesGroup.add(leafNode);
    }
    pivotGroup.add(leavesGroup);

    // 3. Fiore o Bocciolo all'apice del fusto
    const apexPt = stemCurve.getPointAt(1.0);
    const flowerGroup = createFlowerOrBud(plant.specie, h, g, plant);
    flowerGroup.position.copy(apexPt);
    flowerGroup.rotation.x = Math.PI / 8;
    pivotGroup.add(flowerGroup);

    // 4. Apparato radicale procedurale
    const rootsGroup = createSubterraneanRoots(plant.specie, h, plant);
    plant.threeGroup.add(rootsGroup);

    // Cache riferimenti nodi per sway a 60 fps
    plant.nodeCache = {
        pivotGroup,
        stemMesh,
        leavesGroup,
        flowerGroup,
        rootsGroup,
        stemCurve
    };
}

/* ==========================================================================
   8. Motore di Oscillazione (Sway), Nictinastia & Fisica Elastica
   ========================================================================== */

function updatePlantSway(plant, time, breathingFactor = 0.0, isBreathingMode = false, circadianHour = 12.0, touchImpulse = 0.0) {
    if (!plant || !plant.nodeCache || !plant.nodeCache.pivotGroup) return;

    const { pivotGroup, leavesGroup, flowerGroup } = plant.nodeCache;
    const droop = plant.droopFactor || 0.0;
    const swayAmt = 1.0 - smoothstep(0.6, 0.95, droop);

    // Nictinastia biologica: di notte (ore 21-6) i rami e foglie si rilassano verso il centro
    const isNight = circadianHour < 6.0 || circadianHour > 21.0;
    const nyctinastyFactor = isNight ? 0.25 : 0.0;

    let swayAngleX = 0;
    let swayAngleZ = 0;

    if (isBreathingMode) {
        const breathWave = Math.sin(breathingFactor * Math.PI * 2);
        swayAngleX = (breathWave * 0.04 - nyctinastyFactor * 0.05) * swayAmt;
        swayAngleZ = Math.cos(breathingFactor * Math.PI * 2) * 0.025 * swayAmt;
    } else {
        const speed = 1.15;
        const windWave = Math.sin(time * speed) * 0.045 + Math.sin(time * 2.3) * 0.015;
        swayAngleX = (windWave * (1.0 + droop * 0.5) - nyctinastyFactor * 0.08) * swayAmt;
        swayAngleZ = (Math.cos(time * speed * 0.85) * 0.038 * (1.0 + droop * 0.5)) * swayAmt;
    }

    swayAngleX += touchImpulse * 0.1;

    pivotGroup.rotation.x = swayAngleX;
    pivotGroup.rotation.z = swayAngleZ;

    if (flowerGroup) {
        flowerGroup.rotation.z = swayAngleZ * 0.65;
        flowerGroup.rotation.x = (Math.PI / 8) + Math.sin(time * 1.6) * 0.03 * swayAmt;
    }

    if (leavesGroup) {
        leavesGroup.children.forEach((leafNode, idx) => {
            const leafPhase = time * 1.8 + idx * 1.2;
            leafNode.rotation.z = Math.sin(leafPhase) * 0.035 * swayAmt;
            leafNode.rotation.x = (0.35 + 0.12 * Math.sin(idx) + nyctinastyFactor * 0.15) + Math.cos(leafPhase) * 0.02 * swayAmt;
        });
    }
}
