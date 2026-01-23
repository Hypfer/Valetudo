const fs = require('fs');

// Usage: node convert-obj.js input.obj output.json
const inputFile = process.argv[2];
const outputFile = process.argv[3] || 'model.json';

if (!inputFile) {
    console.error("Please provide an input file: node convert-obj.js <input.obj> [output.json]");
    process.exit(1);
}

const fileContent = fs.readFileSync(inputFile, 'utf8');
const lines = fileContent.split('\n');

const vertices = [];
const edges = [];
const edgeSet = new Set();

console.log("Parsing OBJ...");

lines.forEach(line => {
    const cleanLine = line.split('#')[0].trim();
    if (!cleanLine) return;

    const parts = cleanLine.split(/\s+/);
    const type = parts[0];

    if (type === 'v') {
        vertices.push({
            x: parseFloat(parts[1]),
            y: parseFloat(parts[2]),
            z: parseFloat(parts[3])
        });
    } else if (type === 'f') {
        const faceIndices = [];
        for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            const indexStr = p.split('/')[0];
            const indexInt = parseInt(indexStr, 10);
            faceIndices.push(indexInt - 1);
        }
        
        for (let i = 0; i < faceIndices.length; i++) {
            const v1 = faceIndices[i];
            const v2 = faceIndices[(i + 1) % faceIndices.length];
            
            const key = v1 < v2 ? `${v1}_${v2}` : `${v2}_${v1}`;

            if (!edgeSet.has(key)) {
                edgeSet.add(key);
                edges.push(v1, v2);
            }
        }
    }
});

if (vertices.length === 0) {
    console.error("No vertices found!");
    process.exit(1);
}

console.log(`Normalizing ${vertices.length} vertices...`);

let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

vertices.forEach(v => {
    minX = Math.min(minX, v.x); minY = Math.min(minY, v.y); minZ = Math.min(minZ, v.z);
    maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
});

const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
const cz = (minZ + maxZ) / 2;

const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
const scale = maxDim > 0 ? 2.0 / maxDim : 1;

const flatVertices = [];
vertices.forEach(v => {
    flatVertices.push(
        (v.x - cx) * scale,
        (v.y - cy) * -scale,
        (v.z - cz) * scale
    );
});

const output = {
    v: flatVertices.map(n => parseFloat(n.toFixed(4))),
    e: edges
};

fs.writeFileSync(outputFile, JSON.stringify(output));
console.log(`Done! Saved to ${outputFile}`);
console.log(`Vertices: ${flatVertices.length / 3}, Edges: ${edges.length / 2}`);
