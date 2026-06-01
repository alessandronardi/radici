/* ==========================================================================
   RADICI - CONFIGURAZIONE E MOTORE GRAFICO DELLE SPECIE BOTANICHE (10 SPECIE)
   ========================================================================== */

// Funzione helper per liberare ricorsivamente memoria GPU/CPU in Three.js
function disposeHierarchy(obj) {
    obj.traverse((child) => {
        if (child.isMesh) {
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

// 1. CONFIGURAZIONE STATICA DELLE SPECIE BOTANICHE
const SPECIES_CONFIG = {
    orchidea: {
        scientificName: "Phalaenopsis Selena",
        emoji: "🌸",
        themeColor: "#34d399",
        alpha: 0.008, // Traspirazione
        beta: 0.004,  // Evaporazione da luce
        optLight: { min: 0.6, max: 0.9 },
        growthRate: 0.1, // Lenta
        description: "Nativa dei boschi ombrosi. Si sviluppa adagiandosi elegantemente, assorbendo l'umidità dell'aria e protendendo le sue foglie basali.",
        needs: "Luce soffusa e filtrata. Richiede un terreno delicatamente inumidito a intervalli regolari."
    },
    loto: {
        scientificName: "Nelumbo Ignis",
        emoji: "🔥",
        themeColor: "#f59e0b",
        alpha: 0.012,
        beta: 0.007,
        optLight: { min: 0.9, max: 1.3 },
        growthRate: 0.2, // Media
        description: "Simbolo di purezza geometrica e fioritura radiosa. Si erge verticalmente, protendendo foglie simmetriche a forma di scudo.",
        needs: "Luce zenitale viva ed intensa per favorire la fotosintesi a spirale. Consuma rapidamente l'acqua del terreno."
    },
    campanula: {
        scientificName: "Campanula Imbricata",
        emoji: "🔔",
        themeColor: "#3b82f6",
        alpha: 0.006,
        beta: 0.003,
        optLight: { min: 0.4, max: 1.1 },
        growthRate: 0.35, // Rapida
        description: "Crescita spigliata e ramificata. Sviluppa calici pendenti e flessuosi pronti ad accogliere il vento silvestre.",
        needs: "Molto resiliente ed adattabile. Sopporta ampi range di luminosità e si riprende agilmente dalle siccità."
    },
    girasole: {
        scientificName: "Helianthus Solar",
        emoji: "🌻",
        themeColor: "#fbbf24",
        alpha: 0.015,
        beta: 0.009,
        optLight: { min: 1.0, max: 1.5 },
        growthRate: 0.3, // Medio-rapida
        description: "Un tributo vivente alla sorgente solare. Si protende energicamente verso l'alto, sviluppando grandi foglie palmate e un maestoso disco dorato.",
        needs: "Luce zenitale viva ed intensa. Consuma molta acqua per sostenere la sua crescita vigorosa."
    },
    lavanda: {
        scientificName: "Lavandula Serene",
        emoji: "🪻",
        themeColor: "#a78bfa",
        alpha: 0.006,
        beta: 0.003,
        optLight: { min: 0.7, max: 1.3 },
        growthRate: 0.25, // Media
        description: "Crescita cespugliosa e profumata nativa dei pendii assolati. Sviluppa spighe floreali dense dal colore violaceo e dal portamento meditativo.",
        needs: "Predilige climi asciutti e molta luce. Evitare i ristagni idrici, annaffiare solo a terreno asciutto."
    },
    rosa: {
        scientificName: "Rosa Mystica",
        emoji: "🌹",
        themeColor: "#f43f5e",
        alpha: 0.010,
        beta: 0.005,
        optLight: { min: 0.8, max: 1.2 },
        growthRate: 0.2, // Media
        description: "Regina del giardino zen. Presenta fusti sinuosi e spinosi, fogliame decorato e boccioli vellutati che si schiudono in geometrie concentriche.",
        needs: "Luce solare diretta ma non rovente. Richiede innaffiature costanti e regolari."
    },
    tulipano: {
        scientificName: "Tulipa Aura",
        emoji: "🌷",
        themeColor: "#f97316",
        alpha: 0.009,
        beta: 0.004,
        optLight: { min: 0.6, max: 1.1 },
        growthRate: 0.35, // Rapida
        description: "Crescita essenziale e pulita. Emerge da un bulbo sotterraneo con larghe foglie carnose ed erette, culminando in un singolo calice scarlatto.",
        needs: "Luce moderata. Resiste bene alle temperature fresche ma richiede umidità costante nel terreno."
    },
    ibisco: {
        scientificName: "Hibiscus Rubra",
        emoji: "🌺",
        themeColor: "#ec4899",
        alpha: 0.014,
        beta: 0.007,
        optLight: { min: 0.9, max: 1.4 },
        growthRate: 0.22, // Media
        description: "Arbusto dal fascino tropicale. Sviluppa ramificazioni generose, grandi foglie scure e fiori spettacolari a cinque petali con un lungo pistillo ricamato.",
        needs: "Necessita di forte esposizione solare e terreno costantemente idratato per fiorire al meglio."
    },
    gelsomino: {
        scientificName: "Jasminum Stellar",
        emoji: "✨",
        themeColor: "#e2e8f0",
        alpha: 0.008,
        beta: 0.005,
        optLight: { min: 0.5, max: 1.0 },
        growthRate: 0.3, // Medio-rapida
        description: "Un rampicante delicato e sinuoso. I suoi fusti flessibili si intrecciano formando trame eleganti, cosparse di piccole stelle profumate e lucenti.",
        needs: "Luce parziale e filtrata. Gradisce un ambiente umido e supporti verticali su cui adagiarsi."
    },
    magnolia: {
        scientificName: "Magnolia Nova",
        emoji: "💮",
        themeColor: "#f472b6",
        alpha: 0.011,
        beta: 0.006,
        optLight: { min: 0.7, max: 1.2 },
        growthRate: 0.15, // Lenta-media
        description: "Una delle forme botaniche più antiche. Presenta fusti spessi e legnosi, foglie coriacee e grandi fiori carnosi che ricordano antiche sculture.",
        needs: "Luce equilibrata. Ha bisogno di un terreno ricco e profondo con irrigazioni regolari ma mai eccessive."
    }
};

// 2. ALGORITMO DI GEOMETRIA PROCEDURALE ED ESTRUSIONE (Frenet Frames)
function getFrameAt(curve, t) {
    const point = curve.getPointAt(t);
    const epsilon = 0.001;
    const tNext = Math.min(1.0, t + epsilon);
    const pointNext = curve.getPointAt(tNext);
    const tangent = new THREE.Vector3().subVectors(pointNext, point).normalize();
    
    const ref = new THREE.Vector3(0, 0, 1);
    const normal = new THREE.Vector3().crossVectors(tangent, ref).normalize();
    if (normal.lengthSq() < 0.0001) {
        normal.set(1, 0, 0); // fallback
    }
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    return { point, tangent, normal, binormal };
}

function createTaperedTubeGeometry(curve, tubularSegments = 30, radialSegments = 8, radiusFunc) {
    const vertices = [];
    const indices = [];
    const uvs = [];
    const normals = [];

    for (let i = 0; i <= tubularSegments; i++) {
        const t = i / tubularSegments;
        const frame = getFrameAt(curve, t);
        const r = radiusFunc(t);

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
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
            normals.push(nx/len, ny/len, nz/len);

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

// 3. GENERAZIONE DEI PUNTI PER LE CURVE 3D DELLE SPECIE
function getOrchidPoints(h, H, time, droopFactor) {
    const points = [];
    const N = 5;
    const swingSpeed = 1.2;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        
        let x = Math.sin(t * Math.PI) * 0.35 * h + t * 0.45 * h;
        let z = Math.cos(t * Math.PI * 1.5) * 0.08 * h;
        
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.06 * factor * (1 + droopFactor) * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.8 + t * Math.PI) * 0.05 * factor * (1 + droopFactor) * swayAmt;
        
        const droopedZ = droopFactor * 0.45 * factor;
        const droopedY = -droopFactor * 0.25 * factor;
        
        points.push(new THREE.Vector3(x + dx, yBase + droopedY, z + dz + droopedZ));
    }
    return points;
}

function getLotusPoints(h, H, time, droopFactor) {
    const points = [];
    const N = 5;
    const swingSpeed = 0.9;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.02 * factor * (1 + droopFactor) * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.85 + t * Math.PI) * 0.02 * factor * (1 + droopFactor) * swayAmt;
        
        const droopedZ = droopFactor * 0.2 * factor;
        const droopedY = -droopFactor * 0.12 * factor;
        
        points.push(new THREE.Vector3(dx, yBase + droopedY, dz + droopedZ));
    }
    return points;
}

function getCampanulaMainPoints(h, H, time, droopFactor) {
    const points = [];
    const N = 4;
    const swingSpeed = 1.3;
    const H_main = H * 0.65;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H_main;
        
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.03 * factor * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.8 + t * Math.PI) * 0.03 * factor * swayAmt;
        
        const droopedZ = droopFactor * 0.3 * factor;
        const droopedY = -droopFactor * 0.18 * factor;
        
        points.push(new THREE.Vector3(dx, yBase + droopedY, dz + droopedZ));
    }
    return points;
}

function getCampanulaBranchPoints(splitPt, dirSign, h, H, time, droopFactor) {
    const points = [];
    const N = 4;
    const swingSpeed = 1.3;
    const H_branch = H * 0.35;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        
        const dx_base = dirSign * Math.sin(t * Math.PI * 0.5) * 0.45 * h;
        const dy_base = -t * H_branch * 0.75; 
        const dz_base = Math.cos(t * Math.PI * 0.5) * 0.08 * h;
        
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx_sway = Math.sin(time * swingSpeed + t * Math.PI + dirSign) * 0.04 * t * swayAmt;
        const dz_sway = Math.cos(time * swingSpeed * 0.8 + t * Math.PI) * 0.04 * t * swayAmt;
        
        const droopedY = -droopFactor * 0.25 * t;
        const droopedZ = droopFactor * 0.15 * t;

        points.push(new THREE.Vector3(
            splitPt.x + dx_base + dx_sway,
            splitPt.y + dy_base + droopedY,
            splitPt.z + dz_base + dz_sway + droopedZ
        ));
    }
    return points;
}

function getSunflowerPoints(h, H, time, droopFactor) {
    const points = [];
    const N = 5;
    const swingSpeed = 0.8;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.02 * factor * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.7 + t * Math.PI) * 0.02 * factor * swayAmt;
        
        // Leggero piegamento in avanti in cima (testa pesante)
        const headTiltX = i === N - 1 ? 0.06 * h : 0;
        const headTiltZ = i === N - 1 ? 0.04 * h : 0;
        
        const droopedZ = droopFactor * 0.25 * factor;
        const droopedY = -droopFactor * 0.15 * factor;
        points.push(new THREE.Vector3(dx + headTiltX, yBase + droopedY, dz + droopedZ + headTiltZ));
    }
    return points;
}

function getLavenderPoints(idx, h, H, time, droopFactor) {
    const points = [];
    const N = 5;
    const swingSpeed = 1.2 + idx * 0.15;
    const angle = (idx * Math.PI * 2) / 3;
    const spread = 0.22 * h; // allontanamento laterale
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        
        const dx = Math.cos(angle) * spread * t + Math.sin(time * swingSpeed + t * Math.PI) * 0.03 * factor * swayAmt;
        const dz = Math.sin(angle) * spread * t + Math.cos(time * swingSpeed * 0.8 + t * Math.PI) * 0.03 * factor * swayAmt;
        
        const droopedZ = droopFactor * 0.22 * factor * Math.sin(angle);
        const droopedX = droopFactor * 0.22 * factor * Math.cos(angle);
        const droopedY = -droopFactor * 0.12 * factor;
        points.push(new THREE.Vector3(dx + droopedX, yBase + droopedY, dz + droopedZ));
    }
    return points;
}

function getRosePoints(h, H, time, droopFactor) {
    const points = [];
    const N = 6;
    const swingSpeed = 0.95;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        
        // Angolatura a zig-zag spinosa
        const zigX = (i % 2 === 0 ? 0.045 : -0.045) * h * t;
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.02 * factor * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.8 + t * Math.PI) * 0.02 * factor * swayAmt;
        
        const droopedZ = droopFactor * 0.24 * factor;
        const droopedY = -droopFactor * 0.14 * factor;
        points.push(new THREE.Vector3(zigX + dx, yBase + droopedY, dz + droopedZ));
    }
    return points;
}

function getTulipPoints(h, H, time, droopFactor) {
    const points = [];
    const N = 5;
    const swingSpeed = 1.05;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        
        // Dolce curvatura in avanti dello stelo
        const curveX = 0.1 * h * factor;
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.02 * factor * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.8 * t) * 0.02 * factor * swayAmt;
        
        const droopedZ = droopFactor * 0.26 * factor;
        const droopedY = -droopFactor * 0.15 * factor;
        points.push(new THREE.Vector3(curveX + dx, yBase + droopedY, dz + droopedZ));
    }
    return points;
}

function getHibiscusMainPoints(h, H, time, droopFactor) {
    const points = [];
    const N = 5;
    const swingSpeed = 0.85;
    const H_main = H * 0.55;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H_main;
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.025 * factor * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.75 + t * Math.PI) * 0.025 * factor * swayAmt;
        
        const droopedZ = droopFactor * 0.18 * factor;
        const droopedY = -droopFactor * 0.1 * factor;
        points.push(new THREE.Vector3(dx, yBase + droopedY, dz + droopedZ));
    }
    return points;
}

function getHibiscusBranchPoints(splitPt, dirSign, h, H, time, droopFactor) {
    const points = [];
    const N = 4;
    const swingSpeed = 1.1;
    const H_branch = H * 0.5;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        // Rami estesi lateralmente
        const dx_base = dirSign * Math.sin(t * Math.PI * 0.45) * 0.42 * h;
        const dy_base = t * H_branch * 0.8;
        const dz_base = Math.cos(t * Math.PI * 0.45) * 0.06 * h;
        
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx_sway = Math.sin(time * swingSpeed + t * Math.PI + dirSign) * 0.035 * t * swayAmt;
        const dz_sway = Math.cos(time * swingSpeed * 0.8 + t * Math.PI) * 0.035 * t * swayAmt;
        
        const droopedY = -droopFactor * 0.16 * t;
        const droopedZ = droopFactor * 0.1 * t;
        points.push(new THREE.Vector3(
            splitPt.x + dx_base + dx_sway,
            splitPt.y + dy_base + droopedY,
            splitPt.z + dz_base + dz_sway + droopedZ
        ));
    }
    return points;
}

function getJasminePoints(h, H, time, droopFactor) {
    const points = [];
    const N = 7;
    const swingSpeed = 1.25;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H;
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        
        // Elica rampicante 3D
        const angle = t * Math.PI * 3.0;
        const radius = 0.14 * h * (1.1 - t * 0.4);
        const jX = Math.cos(angle) * radius;
        const jZ = Math.sin(angle) * radius;
        
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.035 * factor * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.75 + t * Math.PI) * 0.035 * factor * swayAmt;
        
        const droopedZ = droopFactor * 0.25 * factor;
        const droopedY = -droopFactor * 0.15 * factor;
        points.push(new THREE.Vector3(jX + dx, yBase + droopedY, jZ + dz + droopedZ));
    }
    return points;
}

function getMagnoliaMainPoints(h, H, time, droopFactor) {
    const points = [];
    const N = 4;
    const swingSpeed = 0.55;
    const H_main = H * 0.5;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const yBase = 1.15 + t * H_main;
        const factor = t * t;
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx = Math.sin(time * swingSpeed + t * Math.PI) * 0.015 * factor * swayAmt;
        const dz = Math.cos(time * swingSpeed * 0.65 + t * Math.PI) * 0.015 * factor * swayAmt;
        
        const droopedZ = droopFactor * 0.1 * factor;
        const droopedY = -droopFactor * 0.06 * factor;
        points.push(new THREE.Vector3(dx, yBase + droopedY, dz + droopedZ));
    }
    return points;
}

function getMagnoliaBranchPoints(splitPt, dirSign, h, H, time, droopFactor) {
    const points = [];
    const N = 4;
    const swingSpeed = 0.75;
    const H_branch = H * 0.55;
    for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const dx_base = dirSign * Math.sin(t * Math.PI * 0.35) * 0.38 * h;
        const dy_base = t * H_branch * 0.85;
        const dz_base = Math.cos(t * Math.PI * 0.35) * 0.05 * h;
        
        const swayAmt = droopFactor >= 0.8 ? 0 : 1;
        const dx_sway = Math.sin(time * swingSpeed + t * Math.PI + dirSign) * 0.02 * t * swayAmt;
        const dz_sway = Math.cos(time * swingSpeed * 0.7 + t * Math.PI) * 0.02 * t * swayAmt;
        
        const droopedY = -droopFactor * 0.1 * t;
        const droopedZ = droopFactor * 0.06 * t;
        points.push(new THREE.Vector3(
            splitPt.x + dx_base + dx_sway,
            splitPt.y + dy_base + droopedY,
            splitPt.z + dz_base + dz_sway + droopedZ
        ));
    }
    return points;
}

// 4. FUNZIONI PROCEDURALI DI MODELLAZIONE DEI FIORI
function createOrchidFlower(group, scale, saturation) {
    const centerGeo = new THREE.SphereGeometry(0.04 * scale, 8, 8);
    const centerMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.4 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    group.add(center);

    const petalMat = new THREE.MeshPhysicalMaterial({ 
        color: new THREE.Color().setHSL(0.74, 0.25 * saturation, 0.88),
        roughness: 0.3,
        metalness: 0.02,
        transmission: 0.35,
        thickness: 0.08,
        side: THREE.DoubleSide
    });

    for (let p = 0; p < 5; p++) {
        const petalGeo = new THREE.SphereGeometry(0.18 * scale, 12, 12);
        petalGeo.scale(1.4, 0.08, 1);
        petalGeo.translate(0.18 * scale, 0, 0);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.rotation.y = (p * Math.PI * 2) / 5;
        petal.rotation.z = Math.PI / 10;
        group.add(petal);
    }
}

function createLotusFlower(group, scale, saturation, droopFactor) {
    const petalCount = 22;
    for (let k = 0; k < petalCount; k++) {
        const ratio = k / petalCount;
        const phi = k * 137.5 * (Math.PI / 180);
        const rad = 0.14 * Math.sqrt(k) * scale;

        const petalColor = new THREE.Color();
        petalColor.setHSL(0.03 + ratio * 0.09, 0.9 * saturation, 0.48 + ratio * 0.12);

        const petalMat = new THREE.MeshPhysicalMaterial({ 
            color: petalColor, 
            roughness: 0.4,
            metalness: 0.02,
            transmission: 0.3,
            thickness: 0.05,
            side: THREE.DoubleSide 
        });

        const petalGeo = new THREE.ConeGeometry(0.075 * scale, 0.28 * scale, 4);
        petalGeo.rotateX(Math.PI / 2);
        petalGeo.scale(1.1, 0.25, 1.4);
        petalGeo.translate(0, 0, 0.14 * scale);

        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(phi) * rad, ratio * 0.14 * scale, Math.sin(phi) * rad);
        petal.rotation.y = -phi;
        petal.rotation.x = (0.28 + ratio * 0.45) * (1.1 - scale * 0.5) + droopFactor * 0.1;
        group.add(petal);
    }
}

function createCampanulaFlower(group, scale, saturation, droopFactor) {
    const bellColor = new THREE.Color('#4338ca');
    let hsv = {};
    bellColor.getHSL(hsv);
    bellColor.setHSL(0.68, hsv.s * saturation, hsv.l * 0.9);

    const bellMat = new THREE.MeshPhysicalMaterial({ 
        color: bellColor, 
        roughness: 0.45, 
        metalness: 0.02,
        transmission: 0.4,
        thickness: 0.05,
        side: THREE.DoubleSide
    });

    const bellGeo = new THREE.ConeGeometry(0.12 * scale, 0.26 * scale, 8, 1, true);
    bellGeo.rotateX(Math.PI);
    bellGeo.translate(0, -0.13 * scale, 0);
    const bell = new THREE.Mesh(bellGeo, bellMat);
    group.add(bell);

    const stamenGeo = new THREE.CylinderGeometry(0.01 * scale, 0.01 * scale, 0.16 * scale);
    stamenGeo.translate(0, -0.08 * scale, 0);
    const stamenMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 });
    const stamen = new THREE.Mesh(stamenGeo, stamenMat);
    group.add(stamen);
}

function createSunflowerFlower(group, scale, saturation, droopFactor) {
    const discGeo = new THREE.CylinderGeometry(0.18 * scale, 0.18 * scale, 0.03 * scale, 16);
    discGeo.rotateX(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({ color: '#2b1704', roughness: 0.95 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.castShadow = true;
    group.add(disc);
    
    const petalMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.12, 1.0 * saturation, 0.55),
        roughness: 0.4,
        metalness: 0.02,
        transmission: 0.25,
        thickness: 0.06,
        side: THREE.DoubleSide
    });
    
    const petalCount = 18;
    for (let i = 0; i < petalCount; i++) {
        const angle = (i * Math.PI * 2) / petalCount;
        const petalGeo = new THREE.ConeGeometry(0.04 * scale, 0.22 * scale, 4);
        petalGeo.rotateX(Math.PI / 2);
        petalGeo.scale(1.1, 0.12, 1.4);
        petalGeo.translate(0, 0, 0.16 * scale);
        
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(angle) * 0.16 * scale, 0, Math.sin(angle) * 0.16 * scale);
        petal.rotation.y = -angle;
        petal.rotation.x = 0.08 + droopFactor * 0.12;
        group.add(petal);
    }
}

function createLavenderFlowerSpike(group, scale, saturation, droopFactor) {
    const bloomMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.76, 0.72 * saturation, 0.58),
        roughness: 0.65,
        metalness: 0.02,
        transmission: 0.2,
        thickness: 0.04
    });
    const whorlCount = 6;
    for (let w = 0; w < whorlCount; w++) {
        const yOffset = w * 0.11 * scale;
        const whorlScale = (1.1 - w * 0.13) * scale;
        const budCount = 5;
        for (let b = 0; b < budCount; b++) {
            const angle = (b * Math.PI * 2) / budCount + w * 0.4;
            const budGeo = new THREE.SphereGeometry(0.048 * whorlScale, 8, 8);
            budGeo.scale(1.0, 1.5, 0.7);
            const bud = new THREE.Mesh(budGeo, bloomMat);
            
            const rad = 0.042 * whorlScale;
            bud.position.set(Math.cos(angle) * rad, yOffset, Math.sin(angle) * rad);
            bud.rotation.y = -angle;
            bud.rotation.x = 0.2 + droopFactor * 0.15;
            group.add(bud);
        }
    }
}

function createRoseFlower(group, scale, saturation, droopFactor) {
    const calyxGeo = new THREE.SphereGeometry(0.065 * scale, 8, 8);
    const calyxMat = new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.8 });
    const calyx = new THREE.Mesh(calyxGeo, calyxMat);
    calyx.position.y = -0.05 * scale;
    group.add(calyx);

    const petalColor = new THREE.Color('#f43f5e');
    let hsv = {};
    petalColor.getHSL(hsv);
    
    const layers = [
        { count: 6, radius: 0.08, size: 0.19, angle: 0.58, yOffset: 0.0 },
        { count: 5, radius: 0.05, size: 0.15, angle: 0.32, yOffset: 0.04 },
        { count: 4, radius: 0.02, size: 0.11, angle: 0.12, yOffset: 0.08 }
    ];

    layers.forEach((layer, layerIdx) => {
        const layerColor = new THREE.Color().setHSL(hsv.h, hsv.s * saturation, hsv.l * (0.8 + layerIdx * 0.08));
        const petalMat = new THREE.MeshPhysicalMaterial({
            color: layerColor,
            roughness: 0.4,
            metalness: 0.02,
            transmission: 0.28,
            thickness: 0.07,
            side: THREE.DoubleSide
        });

        for (let p = 0; p < layer.count; p++) {
            const angle = (p * Math.PI * 2) / layer.count + layerIdx * 0.5;
            const petalGeo = new THREE.SphereGeometry(layer.size * scale, 8, 8);
            petalGeo.scale(1.25, 0.15, 1.0);
            petalGeo.translate(0, 0, layer.size * 0.5 * scale);
            
            const petal = new THREE.Mesh(petalGeo, petalMat);
            petal.position.set(
                Math.cos(angle) * layer.radius * scale,
                layer.yOffset * scale,
                Math.sin(angle) * layer.radius * scale
            );
            petal.rotation.y = -angle;
            petal.rotation.x = layer.angle + droopFactor * 0.22;
            group.add(petal);
        }
    });
}

function createTulipFlower(group, scale, saturation, droopFactor) {
    const petalColor = new THREE.Color('#f97316');
    let hsv = {};
    petalColor.getHSL(hsv);
    
    const petalMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(hsv.h, hsv.s * saturation, hsv.l),
        roughness: 0.4,
        metalness: 0.02,
        transmission: 0.32,
        thickness: 0.08,
        side: THREE.DoubleSide
    });

    const petalCount = 6;
    for (let p = 0; p < petalCount; p++) {
        const angle = (p * Math.PI * 2) / petalCount;
        const petalGeo = new THREE.SphereGeometry(0.18 * scale, 12, 12);
        petalGeo.scale(1.0, 0.18, 1.45);
        petalGeo.translate(0, 0, 0.18 * scale);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        
        petal.position.set(Math.cos(angle) * 0.05 * scale, 0.05 * scale, Math.sin(angle) * 0.05 * scale);
        petal.rotation.y = -angle;
        petal.rotation.x = 1.32 - droopFactor * 0.25;
        group.add(petal);
    }
    
    const pistilGeo = new THREE.CylinderGeometry(0.018 * scale, 0.018 * scale, 0.1 * scale);
    const pistilMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.5 });
    const pistil = new THREE.Mesh(pistilGeo, pistilMat);
    pistil.position.y = 0.05 * scale;
    group.add(pistil);
}

function createHibiscusFlower(group, scale, saturation, droopFactor) {
    const petalColor = new THREE.Color('#ec4899');
    let hsv = {};
    petalColor.getHSL(hsv);
    
    const petalMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(hsv.h, hsv.s * saturation, hsv.l),
        roughness: 0.45,
        metalness: 0.02,
        transmission: 0.35,
        thickness: 0.05,
        side: THREE.DoubleSide
    });

    const petalCount = 5;
    for (let p = 0; p < petalCount; p++) {
        const angle = (p * Math.PI * 2) / petalCount;
        const petalGeo = new THREE.SphereGeometry(0.24 * scale, 10, 10);
        petalGeo.scale(1.4, 0.05, 1.25);
        petalGeo.translate(0.18 * scale, 0, 0);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.rotation.y = -angle;
        petal.rotation.z = Math.PI / 15 + droopFactor * 0.15;
        group.add(petal);
    }

    const stamenGroup = new THREE.Group();
    stamenGroup.position.set(0, 0.02 * scale, 0);
    stamenGroup.rotation.x = -Math.PI / 2;
    
    const shaftGeo = new THREE.CylinderGeometry(0.012 * scale, 0.012 * scale, 0.36 * scale);
    shaftGeo.translate(0, 0.18 * scale, 0);
    const shaftMat = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.4 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    stamenGroup.add(shaft);

    const tipMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.3 });
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const tipGeo = new THREE.SphereGeometry(0.018 * scale, 4, 4);
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(Math.cos(angle) * 0.04 * scale, 0.34 * scale, Math.sin(angle) * 0.04 * scale);
        stamenGroup.add(tip);
    }
    group.add(stamenGroup);
}

function createJasmineFlower(group, scale, saturation, droopFactor) {
    const petalMat = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        emissive: '#d1fae5',
        emissiveIntensity: 0.25,
        roughness: 0.25,
        metalness: 0.01,
        transmission: 0.3,
        thickness: 0.04,
        side: THREE.DoubleSide
    });

    const petalCount = 5;
    for (let p = 0; p < petalCount; p++) {
        const angle = (p * Math.PI * 2) / petalCount;
        const petalGeo = new THREE.ConeGeometry(0.035 * scale, 0.14 * scale, 4);
        petalGeo.rotateX(Math.PI / 2);
        petalGeo.scale(1.0, 0.12, 1.25);
        petalGeo.translate(0, 0, 0.07 * scale);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.rotation.y = -angle;
        petal.rotation.x = 0.24 - droopFactor * 0.12;
        group.add(petal);
    }

    const centerGeo = new THREE.SphereGeometry(0.02 * scale, 6, 6);
    const centerMat = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.4 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    group.add(center);
}

function createMagnoliaFlower(group, scale, saturation, droopFactor) {
    const petalColor = new THREE.Color('#fbcfe8');
    let hsv = {};
    petalColor.getHSL(hsv);

    const petalMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(hsv.h, hsv.s * saturation, hsv.l),
        roughness: 0.38,
        metalness: 0.02,
        transmission: 0.25,
        thickness: 0.1,
        side: THREE.DoubleSide
    });

    const petalCount = 8;
    for (let p = 0; p < petalCount; p++) {
        const angle = (p * Math.PI * 2) / petalCount;
        const petalGeo = new THREE.SphereGeometry(0.24 * scale, 12, 12);
        petalGeo.scale(1.2, 0.18, 1.5);
        petalGeo.translate(0, 0, 0.2 * scale);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(angle) * 0.06 * scale, 0.04 * scale, Math.sin(angle) * 0.06 * scale);
        petal.rotation.y = -angle;
        petal.rotation.x = 0.8 + droopFactor * 0.2;
        group.add(petal);
    }

    const coneGeo = new THREE.ConeGeometry(0.045 * scale, 0.16 * scale, 6);
    const coneMat = new THREE.MeshStandardMaterial({ color: '#a3e635', roughness: 0.6 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.08 * scale;
    group.add(cone);
}

// Helper per orientare i fiori verso lo spotlight principale
function orientFlower(flowerGroup, position, defaultAngle) {
    flowerGroup.rotation.y = defaultAngle;
    flowerGroup.rotation.x = Math.PI / 6;
    
    if (activeSpotlight) {
        const lightPos = new THREE.Vector3().copy(activeSpotlight.position);
        const localLightDir = new THREE.Vector3().subVectors(lightPos, position).normalize();
        
        flowerGroup.rotation.x += localLightDir.z * 0.25;
        flowerGroup.rotation.y += localLightDir.x * 0.25;
    }
}

// 5. FUNZIONE DI COSTRUZIONE PRINCIPALE 3D DELLA PIANTA
function buildPlant3D(plant) {
    // Svuota il gruppo precedente rilasciando le risorse
    while (plant.threeGroup.children.length > 0) {
        const child = plant.threeGroup.children[0];
        if (typeof disposeHierarchy === 'function') {
            disposeHierarchy(child);
        } else {
            // Fallback diretto per la sicurezza
            child.traverse((c) => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                    else c.material.dispose();
                }
            });
        }
        plant.threeGroup.remove(child);
    }

    // Fase iniziale sotterranea (Germinazione sotto terra, G < 10)
    if (plant.growthProgress < 10) {
        const seedGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const seedMat = new THREE.MeshStandardMaterial({ color: '#4a3328', roughness: 0.9 });
        const seed = new THREE.Mesh(seedGeo, seedMat);
        seed.position.set(0, 1.18, 0);
        plant.threeGroup.add(seed);
        return;
    }

    // Scala di sviluppo
    const h = (plant.growthProgress - 10) / 90; // da 0 a 1
    const time = Date.now() * 0.001;
    const config = SPECIES_CONFIG[plant.specie];
    
    // Determinazione altezza fusto in base alla specie
    let maxH = 1.8;
    if (plant.specie === 'loto') maxH = 2.3;
    if (plant.specie === 'orchidea') maxH = 1.65;
    if (plant.specie === 'campanula') maxH = 2.0;
    if (plant.specie === 'girasole') maxH = 2.5;
    if (plant.specie === 'lavanda') maxH = 1.8;
    if (plant.specie === 'rosa') maxH = 2.1;
    if (plant.specie === 'tulipano') maxH = 1.5;
    if (plant.specie === 'ibisco') maxH = 1.9;
    if (plant.specie === 'gelsomino') maxH = 2.2;
    if (plant.specie === 'magnolia') maxH = 1.8;
    
    const H = maxH * h;

    // Colore di base dello stelo e calibrazione dello stato biologico
    let rawColorStr = '#10b981'; // Smeraldo di default
    if (plant.specie === 'orchidea') rawColorStr = '#44c389';
    if (plant.specie === 'loto') rawColorStr = '#10b981';
    if (plant.specie === 'campanula') rawColorStr = '#14b8a6';
    if (plant.specie === 'girasole') rawColorStr = '#84cc16'; // Verde acido vigoroso
    if (plant.specie === 'lavanda') rawColorStr = '#10b981';
    if (plant.specie === 'rosa') rawColorStr = '#047857'; // Verde scuro foresta
    if (plant.specie === 'tulipano') rawColorStr = '#34d399';
    if (plant.specie === 'ibisco') rawColorStr = '#065f46';
    if (plant.specie === 'gelsomino') rawColorStr = '#059669';
    if (plant.specie === 'magnolia') rawColorStr = '#4b5563'; // Legno grigio/marrone

    const baseStemColor = new THREE.Color(rawColorStr);
    let hsv = {};
    baseStemColor.getHSL(hsv);
    baseStemColor.setHSL(hsv.h, hsv.s * plant.colorSaturate, hsv.l * (0.5 + plant.hydration/200));

    const stemMat = new THREE.MeshPhysicalMaterial({ 
        color: baseStemColor, 
        roughness: plant.specie === 'magnolia' ? 0.9 : 0.7,
        metalness: plant.specie === 'magnolia' ? 0.15 : 0.05,
        transmission: plant.specie === 'magnolia' ? 0.0 : 0.12,
        thickness: 0.12
    });

    // 1. SPECIE DI BASE: ORCHIDEA
    if (plant.specie === 'orchidea') {
        const ctrlPts = getOrchidPoints(h, H, time, plant.droopFactor);
        const curve = new THREE.CatmullRomCurve3(ctrlPts);
        const stemGeo = createTaperedTubeGeometry(curve, 30, 8, (t) => (0.05 - 0.035 * t) * h);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        plant.threeGroup.add(stemMesh);

        // Foglie basali
        const leafCount = 3;
        for (let k = 0; k < leafCount; k++) {
            const leafGroup = new THREE.Group();
            const leafGeo = new THREE.BoxGeometry(0.44 * h, 0.02 * h, 0.75 * h);
            leafGeo.translate(0, 0, 0.38 * h);
            const leafColor = new THREE.Color('#34a873');
            leafColor.getHSL(hsv);
            leafColor.setHSL(0.38, hsv.s * plant.colorSaturate, hsv.l * (0.45 + plant.hydration/200));

            const leafMat = new THREE.MeshPhysicalMaterial({ 
                color: leafColor, 
                roughness: 0.6, 
                metalness: 0.05,
                transmission: 0.25,
                thickness: 0.1,
                side: THREE.DoubleSide
            });
            const leafMesh = new THREE.Mesh(leafGeo, leafMat);
            leafMesh.castShadow = true;
            leafMesh.receiveShadow = true;
            leafGroup.add(leafMesh);

            const leafAngle = (k * Math.PI * 2) / leafCount + Math.PI / 6;
            const radialOffset = 0.12 * h;
            leafGroup.position.set(Math.cos(leafAngle) * radialOffset, 1.15 + k * 0.06, Math.sin(leafAngle) * radialOffset);
            leafGroup.rotation.y = leafAngle;
            leafGroup.rotation.x = Math.PI / 5 + plant.droopFactor * 0.25;
            
            plant.threeGroup.add(leafGroup);
        }

        // Fiori disposti alternatamente lungo lo stelo (G >= 60)
        if (plant.growthProgress >= 60) {
            const flowerPositions = [0.5, 0.75, 0.98];
            flowerPositions.forEach((tVal, idx) => {
                if (plant.growthProgress < 85 && idx > 0) return;

                const pt = curve.getPointAt(tVal);
                const frame = getFrameAt(curve, tVal);
                const sideSign = (idx % 2 === 0 ? 1 : -1);
                const lateralOffset = 0.08 * h;
                const offsetPt = pt.clone().add(frame.normal.clone().multiplyScalar(sideSign * lateralOffset));
                
                const flowerGroup = new THREE.Group();
                flowerGroup.position.copy(offsetPt);
                const sideAngle = sideSign * Math.PI / 4;
                
                if (plant.growthProgress < 85) {
                    const budGeo = new THREE.SphereGeometry(0.12 * h, 8, 8);
                    budGeo.scale(1, 1.3, 1);
                    const budMat = new THREE.MeshPhysicalMaterial({ 
                        color: '#c084fc', 
                        roughness: 0.5, 
                        metalness: 0.02,
                        transmission: 0.2,
                        thickness: 0.08
                    });
                    const bud = new THREE.Mesh(budGeo, budMat);
                    flowerGroup.add(bud);
                } else {
                    const bloom = (plant.growthProgress - 85) / 15;
                    createOrchidFlower(flowerGroup, h * bloom, plant.colorSaturate);
                }

                orientFlower(flowerGroup, pt, sideAngle);
                plant.threeGroup.add(flowerGroup);
            });
        }
    } 
    
    // 2. SPECIE DI BASE: LOTO
    else if (plant.specie === 'loto') {
        const ctrlPts = getLotusPoints(h, H, time, plant.droopFactor);
        const curve = new THREE.CatmullRomCurve3(ctrlPts);
        const stemGeo = createTaperedTubeGeometry(curve, 25, 8, (t) => (0.06 - 0.03 * t) * h);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        plant.threeGroup.add(stemMesh);

        // Foglie basali scudate
        const leafCount = 4;
        for (let k = 0; k < leafCount; k++) {
            const leafGroup = new THREE.Group();
            const leafRadius = 0.38 * h;
            const leafGeo = new THREE.CylinderGeometry(leafRadius, leafRadius, 0.015 * h, 18, 1, false, 0, Math.PI * 1.85);
            leafGeo.rotateX(Math.PI / 2);
            
            const leafColor = new THREE.Color('#0f766e');
            leafColor.getHSL(hsv);
            leafColor.setHSL(0.33, hsv.s * plant.colorSaturate, hsv.l * (0.45 + plant.hydration/200));

            const leafMat = new THREE.MeshPhysicalMaterial({ 
                color: leafColor, 
                roughness: 0.55, 
                metalness: 0.05,
                transmission: 0.2,
                thickness: 0.08,
                side: THREE.DoubleSide
            });
            const leafMesh = new THREE.Mesh(leafGeo, leafMat);
            leafMesh.castShadow = true;
            leafMesh.receiveShadow = true;
            leafGroup.add(leafMesh);

            const angle = (k * Math.PI * 2) / leafCount + k * 0.15;
            const radDist = (0.55 + leafRadius) * h;
            leafGroup.position.set(Math.cos(angle) * radDist, 1.16 + k * 0.04, Math.sin(angle) * radDist);
            leafGroup.rotation.y = angle;
            leafGroup.rotation.x = 0.05 + Math.sin(angle) * 0.05 + plant.droopFactor * 0.12;

            plant.threeGroup.add(leafGroup);
        }

        // Fiore all'apice
        if (plant.growthProgress >= 60) {
            const pt = curve.getPointAt(1.0);
            const flowerGroup = new THREE.Group();
            flowerGroup.position.copy(pt);

            if (plant.growthProgress < 85) {
                const budGeo = new THREE.SphereGeometry(0.15 * h, 12, 12);
                budGeo.scale(1, 1.5, 1);
                const budMat = new THREE.MeshPhysicalMaterial({ 
                    color: '#f43f5e', 
                    roughness: 0.45, 
                    metalness: 0.02,
                    transmission: 0.22,
                    thickness: 0.07
                });
                const bud = new THREE.Mesh(budGeo, budMat);
                flowerGroup.add(bud);
            } else {
                const bloom = (plant.growthProgress - 85) / 15;
                createLotusFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
            }

            orientFlower(flowerGroup, pt, 0);
            plant.threeGroup.add(flowerGroup);
        }
    } 
    
    // 3. SPECIE DI BASE: CAMPANULA
    else if (plant.specie === 'campanula') {
        const mainCtrlPts = getCampanulaMainPoints(h, H, time, plant.droopFactor);
        const mainCurve = new THREE.CatmullRomCurve3(mainCtrlPts);
        const mainStemGeo = createTaperedTubeGeometry(mainCurve, 20, 8, (t) => (0.04 - 0.015 * t) * h);
        const mainStemMesh = new THREE.Mesh(mainStemGeo, stemMat);
        mainStemMesh.castShadow = true;
        mainStemMesh.receiveShadow = true;
        plant.threeGroup.add(mainStemMesh);

        const splitPoint = mainCurve.getPointAt(1.0);
        const branchCurves = [];
        [-1, 1].forEach((dirSign, idx) => {
            const branchCtrl = getCampanulaBranchPoints(splitPoint, dirSign, h, H, time, plant.droopFactor);
            const branchCurve = new THREE.CatmullRomCurve3(branchCtrl);
            branchCurves.push(branchCurve);

            const branchGeo = createTaperedTubeGeometry(branchCurve, 20, 8, (t) => (0.025 - 0.012 * t) * h);
            const branchMesh = new THREE.Mesh(branchGeo, stemMat);
            branchMesh.castShadow = true;
            branchMesh.receiveShadow = true;
            plant.threeGroup.add(branchMesh);
        });

        // Foglioline campanula
        const leafGeo = new THREE.ConeGeometry(0.038 * h, 0.18 * h, 6);
        leafGeo.rotateX(Math.PI / 2);
        leafGeo.translate(0, 0, 0.09 * h);
        const leafColor = new THREE.Color('#0d9488');
        leafColor.getHSL(hsv);
        leafColor.setHSL(0.48, hsv.s * plant.colorSaturate, hsv.l * (0.4 + plant.hydration/200));
        const leafMat = new THREE.MeshPhysicalMaterial({ 
            color: leafColor, 
            roughness: 0.6, 
            metalness: 0.05,
            transmission: 0.28,
            thickness: 0.08
        });

        for (let j = 1; j <= 3; j++) {
            const tVal = j * 0.25;
            const pt = mainCurve.getPointAt(tVal);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.copy(pt);
            leaf.rotation.y = j * 2.3;
            leaf.rotation.x = Math.PI / 4 + plant.droopFactor * 0.2;
            plant.threeGroup.add(leaf);
        }

        if (plant.growthProgress >= 60) {
            branchCurves.forEach((bCurve, bIdx) => {
                const flowerTValues = [0.6, 1.0];
                flowerTValues.forEach((tVal, idx) => {
                    if (plant.growthProgress < 85 && idx > 0) return;

                    const pt = bCurve.getPointAt(tVal);
                    const flowerGroup = new THREE.Group();
                    flowerGroup.position.copy(pt);

                    if (plant.growthProgress < 85) {
                        const budGeo = new THREE.SphereGeometry(0.08 * h, 8, 8);
                        budGeo.scale(1, 1.3, 1);
                        const budMat = new THREE.MeshPhysicalMaterial({ 
                            color: '#6366f1', 
                            roughness: 0.5, 
                            metalness: 0.02,
                            transmission: 0.25,
                            thickness: 0.06
                        });
                        const bud = new THREE.Mesh(budGeo, budMat);
                        bud.position.y = -0.05 * h;
                        flowerGroup.add(bud);
                    } else {
                        const bloom = (plant.growthProgress - 85) / 15;
                        createCampanulaFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
                    }

                    let dirToLight = new THREE.Vector3(0, 1, 0.2).normalize();
                    if (activeSpotlight) {
                        const worldPos = new THREE.Vector3().copy(pt).applyMatrix4(plant.threeGroup.matrixWorld);
                        dirToLight.subVectors(activeSpotlight.position, worldPos).normalize();
                    }
                    flowerGroup.rotation.x = Math.PI + dirToLight.z * 0.35;
                    flowerGroup.rotation.z = -dirToLight.x * 0.35 + (bIdx === 0 ? 0.2 : -0.2);

                    plant.threeGroup.add(flowerGroup);
                });
            });
        }
    } 
    
    // 4. NUOVA SPECIE: GIRASOLE
    else if (plant.specie === 'girasole') {
        const ctrlPts = getSunflowerPoints(h, H, time, plant.droopFactor);
        const curve = new THREE.CatmullRomCurve3(ctrlPts);
        const stemGeo = createTaperedTubeGeometry(curve, 25, 8, (t) => (0.075 - 0.04 * t) * h);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        plant.threeGroup.add(stemMesh);

        // Grandi foglie palmate lungo il fusto
        const leafColor = new THREE.Color('#4d7c0f');
        leafColor.getHSL(hsv);
        leafColor.setHSL(0.24, hsv.s * plant.colorSaturate, hsv.l * (0.4 + plant.hydration/200));
        const leafMat = new THREE.MeshPhysicalMaterial({ 
            color: leafColor, 
            roughness: 0.75, 
            metalness: 0.02,
            transmission: 0.18,
            thickness: 0.12
        });

        const leafCount = 4;
        for (let idx = 1; idx <= leafCount; idx++) {
            const tVal = idx * 0.2;
            const pt = curve.getPointAt(tVal);
            
            const leafGroup = new THREE.Group();
            leafGroup.position.copy(pt);
            
            const leafGeo = new THREE.BoxGeometry(0.38 * h, 0.015 * h, 0.5 * h);
            leafGeo.translate(0, 0, 0.25 * h);
            const leafMesh = new THREE.Mesh(leafGeo, leafMat);
            leafMesh.castShadow = true;
            leafGroup.add(leafMesh);

            const angle = idx * Math.PI * 0.85; // Alternanza naturale
            leafGroup.rotation.y = angle;
            leafGroup.rotation.x = Math.PI / 6 + plant.droopFactor * 0.25;
            plant.threeGroup.add(leafGroup);
        }

        // Fiore solare
        if (plant.growthProgress >= 60) {
            const pt = curve.getPointAt(1.0);
            const flowerGroup = new THREE.Group();
            flowerGroup.position.copy(pt);

            if (plant.growthProgress < 85) {
                const budGeo = new THREE.SphereGeometry(0.16 * h, 12, 12);
                budGeo.scale(1.3, 0.8, 1.3);
                const budMat = new THREE.MeshPhysicalMaterial({ 
                    color: '#854d0e', 
                    roughness: 0.65, 
                    metalness: 0.05,
                    transmission: 0.15,
                    thickness: 0.1
                });
                const bud = new THREE.Mesh(budGeo, budMat);
                flowerGroup.add(bud);
            } else {
                const bloom = (plant.growthProgress - 85) / 15;
                createSunflowerFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
            }

            orientFlower(flowerGroup, pt, 0);
            // Leggero orientamento del piattino in avanti
            flowerGroup.rotation.x += 0.25; 
            plant.threeGroup.add(flowerGroup);
        }
    } 
    
    // 5. NUOVA SPECIE: LAVANDA
    else if (plant.specie === 'lavanda') {
        const stemCount = 3;
        const stemCurves = [];
        
        for (let s = 0; s < stemCount; s++) {
            // Solo il primo fusto cresce all'inizio, gli altri crescono dopo (G>=30)
            if (s > 0 && plant.growthProgress < 30) continue;
            
            const ctrlPts = getLavenderPoints(s, h, H, time, plant.droopFactor);
            const curve = new THREE.CatmullRomCurve3(ctrlPts);
            stemCurves.push(curve);

            const stemGeo = createTaperedTubeGeometry(curve, 20, 6, (t) => (0.03 - 0.015 * t) * h);
            const stemMesh = new THREE.Mesh(stemGeo, stemMat);
            stemMesh.castShadow = true;
            stemMesh.receiveShadow = true;
            plant.threeGroup.add(stemMesh);

            // Piccole foglie aghiformi grigio-verdi
            const leafColor = new THREE.Color('#557a70');
            leafColor.getHSL(hsv);
            leafColor.setHSL(0.44, hsv.s * 0.6 * plant.colorSaturate, hsv.l * (0.45 + plant.hydration/200));
            const leafMat = new THREE.MeshPhysicalMaterial({ 
                color: leafColor, 
                roughness: 0.8, 
                metalness: 0.05,
                transmission: 0.12,
                thickness: 0.06
            });
            const leafGeo = new THREE.CylinderGeometry(0.01 * h, 0.01 * h, 0.16 * h);
            leafGeo.rotateX(Math.PI / 3);
            
            for (let j = 2; j <= 6; j++) {
                const tVal = j * 0.12;
                const pt = curve.getPointAt(tVal);
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.copy(pt);
                leaf.rotation.y = j * Math.PI * 0.66;
                plant.threeGroup.add(leaf);
            }

            // Infiorescenza a spiga (G >= 60)
            if (plant.growthProgress >= 60) {
                const startT = 0.65;
                const pt = curve.getPointAt(startT);
                
                const flowerGroup = new THREE.Group();
                flowerGroup.position.copy(pt);

                if (plant.growthProgress < 85) {
                    const budGeo = new THREE.CylinderGeometry(0.03 * h, 0.03 * h, 0.3 * h, 8);
                    const budMat = new THREE.MeshPhysicalMaterial({ 
                        color: '#818cf8', 
                        roughness: 0.7, 
                        metalness: 0.02,
                        transmission: 0.2,
                        thickness: 0.05
                    });
                    const bud = new THREE.Mesh(budGeo, budMat);
                    bud.position.y = 0.15 * h;
                    flowerGroup.add(bud);
                } else {
                    const bloom = (plant.growthProgress - 85) / 15;
                    createLavenderFlowerSpike(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
                }

                // Allineamento della spiga con l'inclinazione finale dello stelo
                const endPt = curve.getPointAt(1.0);
                const dir = new THREE.Vector3().subVectors(endPt, pt).normalize();
                const alignQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                flowerGroup.quaternion.copy(alignQuat);

                plant.threeGroup.add(flowerGroup);
            }
        }
    } 
    
    // 6. NUOVA SPECIE: ROSA
    else if (plant.specie === 'rosa') {
        const ctrlPts = getRosePoints(h, H, time, plant.droopFactor);
        const curve = new THREE.CatmullRomCurve3(ctrlPts);
        const stemGeo = createTaperedTubeGeometry(curve, 30, 8, (t) => (0.055 - 0.025 * t) * h);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        plant.threeGroup.add(stemMesh);

        // Spine procedurali (piccoli coni)
        const thornGeo = new THREE.ConeGeometry(0.015 * h, 0.055 * h, 4);
        thornGeo.rotateX(-Math.PI / 3);
        const thornMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.5 });
        
        for (let t = 2; t <= 8; t++) {
            const tVal = t * 0.09;
            const pt = curve.getPointAt(tVal);
            const thorn = new THREE.Mesh(thornGeo, thornMat);
            thorn.position.copy(pt);
            thorn.rotation.y = t * 1.8;
            plant.threeGroup.add(thorn);
        }

        // Foglie composte (ovali)
        const leafColor = new THREE.Color('#064e3b');
        leafColor.getHSL(hsv);
        leafColor.setHSL(0.35, hsv.s * plant.colorSaturate, hsv.l * (0.4 + plant.hydration/200));
        const leafMat = new THREE.MeshPhysicalMaterial({ 
            color: leafColor, 
            roughness: 0.55, 
            metalness: 0.05,
            transmission: 0.22,
            thickness: 0.09
        });
        
        const leafGeo = new THREE.BoxGeometry(0.24 * h, 0.01 * h, 0.38 * h);
        leafGeo.translate(0, 0, 0.19 * h);

        for (let j = 2; j <= 5; j++) {
            const tVal = j * 0.18;
            const pt = curve.getPointAt(tVal);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.copy(pt);
            leaf.rotation.y = j * 2.5;
            leaf.rotation.x = Math.PI / 5 + plant.droopFactor * 0.2;
            plant.threeGroup.add(leaf);
        }

        // Fiore rosa
        if (plant.growthProgress >= 60) {
            const pt = curve.getPointAt(1.0);
            const flowerGroup = new THREE.Group();
            flowerGroup.position.copy(pt);

            if (plant.growthProgress < 85) {
                const budGeo = new THREE.SphereGeometry(0.12 * h, 12, 12);
                budGeo.scale(1, 1.6, 1);
                const budMat = new THREE.MeshPhysicalMaterial({ 
                    color: '#be123c', 
                    roughness: 0.4, 
                    metalness: 0.02,
                    transmission: 0.25,
                    thickness: 0.07
                });
                const bud = new THREE.Mesh(budGeo, budMat);
                flowerGroup.add(bud);
            } else {
                const bloom = (plant.growthProgress - 85) / 15;
                createRoseFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
            }

            orientFlower(flowerGroup, pt, 0);
            plant.threeGroup.add(flowerGroup);
        }
    } 
    
    // 7. NUOVA SPECIE: TULIPANO
    else if (plant.specie === 'tulipano') {
        const ctrlPts = getTulipPoints(h, H, time, plant.droopFactor);
        const curve = new THREE.CatmullRomCurve3(ctrlPts);
        const stemGeo = createTaperedTubeGeometry(curve, 25, 8, (t) => (0.05 - 0.02 * t) * h);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        plant.threeGroup.add(stemMesh);

        // Foglie carnose erette basali
        const leafColor = new THREE.Color('#059669');
        leafColor.getHSL(hsv);
        leafColor.setHSL(0.4, hsv.s * plant.colorSaturate, hsv.l * (0.42 + plant.hydration/200));
        const leafMat = new THREE.MeshPhysicalMaterial({ 
            color: leafColor, 
            roughness: 0.5, 
            metalness: 0.05,
            transmission: 0.26,
            thickness: 0.12,
            side: THREE.DoubleSide
        });

        const leafCount = 2;
        for (let l = 0; l < leafCount; l++) {
            const leafGroup = new THREE.Group();
            // Foglie curve erette
            const leafGeo = new THREE.BoxGeometry(0.26 * h, 0.015 * h, 0.9 * h);
            leafGeo.translate(0, 0, 0.45 * h); // pivot alla base

            const leafMesh = new THREE.Mesh(leafGeo, leafMat);
            leafMesh.castShadow = true;
            leafGroup.add(leafMesh);

            const angle = l * Math.PI + Math.PI/4;
            leafGroup.position.set(Math.cos(angle) * 0.05 * h, 1.15 + l * 0.08, Math.sin(angle) * 0.05 * h);
            leafGroup.rotation.y = angle;
            // Piegatura verticale verso l'alto
            leafGroup.rotation.x = Math.PI / 4 + plant.droopFactor * 0.25;
            plant.threeGroup.add(leafGroup);
        }

        // Fiore tulipano
        if (plant.growthProgress >= 60) {
            const pt = curve.getPointAt(1.0);
            const flowerGroup = new THREE.Group();
            flowerGroup.position.copy(pt);

            if (plant.growthProgress < 85) {
                const budGeo = new THREE.SphereGeometry(0.11 * h, 10, 10);
                budGeo.scale(1, 1.5, 1);
                const budMat = new THREE.MeshPhysicalMaterial({ 
                    color: '#ea580c', 
                    roughness: 0.45, 
                    metalness: 0.02,
                    transmission: 0.28,
                    thickness: 0.08
                });
                const bud = new THREE.Mesh(budGeo, budMat);
                flowerGroup.add(bud);
            } else {
                const bloom = (plant.growthProgress - 85) / 15;
                createTulipFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
            }

            orientFlower(flowerGroup, pt, 0);
            plant.threeGroup.add(flowerGroup);
        }
    } 
    
    // 8. NUOVA SPECIE: IBISCO
    else if (plant.specie === 'ibisco') {
        const mainCtrlPts = getHibiscusMainPoints(h, H, time, plant.droopFactor);
        const mainCurve = new THREE.CatmullRomCurve3(mainCtrlPts);
        const mainStemGeo = createTaperedTubeGeometry(mainCurve, 20, 8, (t) => (0.055 - 0.02 * t) * h);
        const mainStemMesh = new THREE.Mesh(mainStemGeo, stemMat);
        mainStemMesh.castShadow = true;
        mainStemMesh.receiveShadow = true;
        plant.threeGroup.add(mainStemMesh);

        const splitPoint = mainCurve.getPointAt(1.0);
        const branchCurves = [];
        [-1, 1].forEach((dirSign, idx) => {
            const branchCtrl = getHibiscusBranchPoints(splitPoint, dirSign, h, H, time, plant.droopFactor);
            const branchCurve = new THREE.CatmullRomCurve3(branchCtrl);
            branchCurves.push(branchCurve);

            const branchGeo = createTaperedTubeGeometry(branchCurve, 20, 8, (t) => (0.035 - 0.015 * t) * h);
            const branchMesh = new THREE.Mesh(branchGeo, stemMat);
            branchMesh.castShadow = true;
            branchMesh.receiveShadow = true;
            plant.threeGroup.add(branchMesh);
        });

        // Foglie ovali
        const leafColor = new THREE.Color('#15803d');
        leafColor.getHSL(hsv);
        leafColor.setHSL(0.36, hsv.s * plant.colorSaturate, hsv.l * (0.42 + plant.hydration/200));
        const leafMat = new THREE.MeshPhysicalMaterial({ 
            color: leafColor, 
            roughness: 0.55, 
            metalness: 0.05,
            transmission: 0.24,
            thickness: 0.1
        });
        const leafGeo = new THREE.BoxGeometry(0.25 * h, 0.01 * h, 0.44 * h);
        leafGeo.translate(0, 0, 0.22 * h);

        // Foglie sul fusto principale
        for (let j = 1; j <= 3; j++) {
            const tVal = j * 0.28;
            const pt = mainCurve.getPointAt(tVal);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.copy(pt);
            leaf.rotation.y = j * Math.PI * 0.75;
            leaf.rotation.x = Math.PI / 4 + plant.droopFactor * 0.2;
            plant.threeGroup.add(leaf);
        }

        // Fiori di ibisco all'apice dei rami
        if (plant.growthProgress >= 60) {
            branchCurves.forEach((bCurve, bIdx) => {
                const pt = bCurve.getPointAt(1.0);
                const flowerGroup = new THREE.Group();
                flowerGroup.position.copy(pt);

                if (plant.growthProgress < 85) {
                    const budGeo = new THREE.SphereGeometry(0.14 * h, 10, 10);
                    budGeo.scale(1, 1.4, 1);
                    const budMat = new THREE.MeshPhysicalMaterial({ 
                        color: '#db2777', 
                        roughness: 0.45, 
                        metalness: 0.02,
                        transmission: 0.3,
                        thickness: 0.06
                    });
                    const bud = new THREE.Mesh(budGeo, budMat);
                    flowerGroup.add(bud);
                } else {
                    const bloom = (plant.growthProgress - 85) / 15;
                    createHibiscusFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
                }

                orientFlower(flowerGroup, pt, bIdx === 0 ? 0.3 : -0.3);
                plant.threeGroup.add(flowerGroup);
            });
        }
    } 
    
    // 9. NUOVA SPECIE: GELSOMINO
    else if (plant.specie === 'gelsomino') {
        const ctrlPts = getJasminePoints(h, H, time, plant.droopFactor);
        const curve = new THREE.CatmullRomCurve3(ctrlPts);
        const stemGeo = createTaperedTubeGeometry(curve, 40, 6, (t) => (0.038 - 0.02 * t) * h);
        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        plant.threeGroup.add(stemMesh);

        // Foglioline piccole opposte
        const leafColor = new THREE.Color('#047857');
        leafColor.getHSL(hsv);
        leafColor.setHSL(0.42, hsv.s * plant.colorSaturate, hsv.l * (0.43 + plant.hydration/200));
        const leafMat = new THREE.MeshPhysicalMaterial({ 
            color: leafColor, 
            roughness: 0.5, 
            metalness: 0.05,
            transmission: 0.28,
            thickness: 0.07
        });
        const leafGeo = new THREE.BoxGeometry(0.14 * h, 0.008 * h, 0.22 * h);
        leafGeo.translate(0, 0, 0.11 * h);

        const leafCount = 8;
        for (let j = 1; j <= leafCount; j++) {
            const tVal = j * 0.1;
            const pt = curve.getPointAt(tVal);
            
            // Due foglie opposte ad ogni nodo
            [-1, 1].forEach(side => {
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.copy(pt);
                leaf.rotation.y = tVal * Math.PI * 3.5 + (side * Math.PI/2);
                leaf.rotation.x = Math.PI / 6 + plant.droopFactor * 0.18;
                plant.threeGroup.add(leaf);
            });
        }

        // Fiori bianchi profumati
        if (plant.growthProgress >= 60) {
            const flowerTValues = [0.45, 0.7, 0.95];
            flowerTValues.forEach((tVal, idx) => {
                if (plant.growthProgress < 85 && idx > 0) return;

                const pt = curve.getPointAt(tVal);
                const frame = getFrameAt(curve, tVal);
                const offsetPt = pt.clone().add(frame.normal.clone().multiplyScalar(0.05 * h));
                
                const flowerGroup = new THREE.Group();
                flowerGroup.position.copy(offsetPt);

                if (plant.growthProgress < 85) {
                    const budGeo = new THREE.SphereGeometry(0.06 * h, 8, 8);
                    budGeo.scale(1, 1.4, 1);
                    const budMat = new THREE.MeshPhysicalMaterial({ 
                        color: '#f8fafc', 
                        roughness: 0.5, 
                        metalness: 0.02,
                        transmission: 0.3,
                        thickness: 0.05
                    });
                    const bud = new THREE.Mesh(budGeo, budMat);
                    flowerGroup.add(bud);
                } else {
                    const bloom = (plant.growthProgress - 85) / 15;
                    createJasmineFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
                }

                orientFlower(flowerGroup, pt, tVal * 2);
                plant.threeGroup.add(flowerGroup);
            });
        }
    } 
    
    // 10. NUOVA SPECIE: MAGNOLIA
    else if (plant.specie === 'magnolia') {
        const mainCtrlPts = getMagnoliaMainPoints(h, H, time, plant.droopFactor);
        const mainCurve = new THREE.CatmullRomCurve3(mainCtrlPts);
        const mainStemGeo = createTaperedTubeGeometry(mainCurve, 20, 8, (t) => (0.09 - 0.035 * t) * h);
        const mainStemMesh = new THREE.Mesh(mainStemGeo, stemMat);
        mainStemMesh.castShadow = true;
        mainStemMesh.receiveShadow = true;
        plant.threeGroup.add(mainStemMesh);

        const splitPoint = mainCurve.getPointAt(1.0);
        const branchCurves = [];
        [-1, 1].forEach((dirSign, idx) => {
            const branchCtrl = getMagnoliaBranchPoints(splitPoint, dirSign, h, H, time, plant.droopFactor);
            const branchCurve = new THREE.CatmullRomCurve3(branchCtrl);
            branchCurves.push(branchCurve);

            const branchGeo = createTaperedTubeGeometry(branchCurve, 20, 8, (t) => (0.055 - 0.02 * t) * h);
            const branchMesh = new THREE.Mesh(branchGeo, stemMat);
            branchMesh.castShadow = true;
            branchMesh.receiveShadow = true;
            plant.threeGroup.add(branchMesh);
        });

        // Foglie grandi coriacee
        const leafColor = new THREE.Color('#166534');
        leafColor.getHSL(hsv);
        leafColor.setHSL(0.38, hsv.s * 0.8 * plant.colorSaturate, hsv.l * (0.38 + plant.hydration/200));
        const leafMat = new THREE.MeshPhysicalMaterial({ 
            color: leafColor, 
            roughness: 0.45, 
            metalness: 0.05,
            transmission: 0.15,
            thickness: 0.14
        });
        const leafGeo = new THREE.BoxGeometry(0.35 * h, 0.015 * h, 0.58 * h);
        leafGeo.translate(0, 0, 0.29 * h);

        branchCurves.forEach(bCurve => {
            const tValues = [0.35, 0.7];
            tValues.forEach(tVal => {
                const pt = bCurve.getPointAt(tVal);
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.copy(pt);
                leaf.rotation.y = tVal * Math.PI * 2;
                leaf.rotation.x = Math.PI / 6 + plant.droopFactor * 0.15;
                plant.threeGroup.add(leaf);
            });
        });

        // Fiori di magnolia grandi
        if (plant.growthProgress >= 60) {
            branchCurves.forEach((bCurve, bIdx) => {
                const pt = bCurve.getPointAt(1.0);
                const flowerGroup = new THREE.Group();
                flowerGroup.position.copy(pt);

                if (plant.growthProgress < 85) {
                    const budGeo = new THREE.SphereGeometry(0.18 * h, 10, 10);
                    budGeo.scale(1.0, 1.6, 1.0);
                    const budMat = new THREE.MeshPhysicalMaterial({ 
                        color: '#fbcfe8', 
                        roughness: 0.45, 
                        metalness: 0.02,
                        transmission: 0.22,
                        thickness: 0.12
                    });
                    const bud = new THREE.Mesh(budGeo, budMat);
                    flowerGroup.add(bud);
                } else {
                    const bloom = (plant.growthProgress - 85) / 15;
                    createMagnoliaFlower(flowerGroup, h * bloom, plant.colorSaturate, plant.droopFactor);
                }

                orientFlower(flowerGroup, pt, bIdx === 0 ? 0.2 : -0.2);
                plant.threeGroup.add(flowerGroup);
            });
        }
    }
}
