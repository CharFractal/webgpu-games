import { vec2, vec3 } from "gl-matrix";

export class Mesh {

    buffer!: GPUBuffer
    bufferLayout!: GPUVertexBufferLayout
    v: vec3[];
    vt: vec2[];
    vn: vec3[];
    vertices !: Float32Array;
    vertexCount!: number;

    constructor() {
        this.v = [];
        this.vt = [];
        this.vn = [];
    }

    async initialize(device: GPUDevice, url: string) {
        // x y z u v
        await this.readObjFile(url);
        this.vertexCount = this.vertices.length / 5

        const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
        const descriptor: GPUBufferDescriptor = {
            size: this.vertices.byteLength,
            usage: usage,
            mappedAtCreation: true, // equivalent ot vulkans host visible
        };

        this.buffer = device.createBuffer(descriptor)

        new Float32Array(this.buffer.getMappedRange()).set(this.vertices);
        this.buffer.unmap();

        this.bufferLayout = {
            arrayStride: 20,
            attributes: [{
                shaderLocation: 0,
                format: "float32x3",
                offset: 0
            },
            {
                shaderLocation: 1,
                format: "float32x2",
                offset: 12
            }]
        }
    }
    async readObjFile(url: string) {
        var result: number[] = [];

        // const response = await fetch(url);
        // const blob: Blob = await response.blob();
        // const data = await blob.text();
        const data = await fetch(url).then(response => response.text());
        const lines = data.split("\n");

        lines.forEach(line => {
            if (line[0] === 'v' && line[1] === ' ') this.readVertexLine(line);
            else if (line[0] === 'v' && line[1] === 't') this.readTexcoordLine(line);
            else if (line[0] === 'v' && line[1] === 'n') this.readNormalLine(line);
            else if (line[0] === 'f' && line[1] === ' ') this.readFaceLine(line, result);
        });
        this.vertices = new Float32Array(result);
    }

    readVertexLine(line: string) {
        const s = line.split(" ");
        const v: vec3 = [
            Number(s[1].valueOf()),
            Number(s[2].valueOf()),
            Number(s[3].valueOf()),
        ]
        this.v.push(v);
    }
    readTexcoordLine(line: string) {
        const s = line.split(" ");
        const vt: vec2 = [
            Number(s[1].valueOf()),
            Number(s[2].valueOf()),
        ]
        this.vt.push(vt);
    }
    readNormalLine(line: string) {
        const s = line.split(" ");
        const vn: vec3 = [
            Number(s[1].valueOf()),
            Number(s[2].valueOf()),
            Number(s[3].valueOf()),
        ]
        this.vn.push(vn);
    }
    readFaceLine(line: string, result: number[]) {
        line = line.replace("\n", "");
        const s = line.split(" ");
        const triangleCount = s.length - 3;
        for (let i = 0; i < triangleCount; ++i) {
            this.readCorner(s[1], result);
            this.readCorner(s[i + 2], result);
            this.readCorner(s[i + 3], result);
        }
    }
    readCorner(w: string, result: number[]) {
        const str = w.split("/");

        const v = this.v[Number(str[0]).valueOf() - 1];
        const vt = this.v[Number(str[0]).valueOf() - 1];

        result.push(v[0]);
        result.push(v[1]);
        result.push(v[2]);

        result.push(vt[0]);
        result.push(vt[1]);
    }
}