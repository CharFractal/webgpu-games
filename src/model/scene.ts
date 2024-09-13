import { Triangle } from "./triangle";
import { Quad } from "./quad";
import { Camera } from "./camera";
import { vec3, mat4 } from "gl-matrix";
import { ObjectTypes, RenderData } from "./definitions";
import { Cube } from "./cube";

export class Scene {
    triangles!: Triangle[];
    quads!: Quad[];
    cube!: Cube;
    player!: Camera;
    objectData!: Float32Array;
    triangleCount!: number;
    quadCount!: number;

    constructor() {
        this.objectData = new Float32Array(16 * 1024);
        this.triangles = [];
        this.quads = [];
        this.triangleCount = 0;
        this.quadCount = 0;

        this.player = new Camera([-2, 0, 0.5], 0, 0)

        this.makeTrinagles();
        this.makeQuads();
        this.cube = new Cube([5, 0, 1], [0, 0, 0]);
    }

    private makeQuads() {
        let i = this.triangleCount;
        for (let x = -10; x < 10; ++x) {
            for (let y = -10; y < 10; ++y) {
                this.quads.push(
                    new Quad([x, y, -0.5])
                );
                let blankMatrix = mat4.create();
                for (var j = 0; j < 16; ++j) {
                    this.objectData[(16 * i) + j] = <number>blankMatrix.at(j);
                }
                i++;
                this.quadCount++;
            }
        }
    }
    private makeTrinagles() {
        let i = 0;
        for (let y = -5; y <= 5; ++y) {
            this.triangles.push(
                new Triangle([2, y, 0], 0)// pos, theta
            );
            let blankMatrix = mat4.create();
            for (var j = 0; j < 16; ++j) {
                this.objectData[(16 * i) + j] = <number>blankMatrix.at(j);
            }
            i++;
            this.triangleCount++;
        }
    }

    update() {
        let i = 0;
        this.triangles.forEach(
            (triangle) => {
                triangle.update();
                let model = triangle.getModel();
                for (let j = 0; j < 16; ++j) {
                    this.objectData[(i * 16) + j] = <number>model.at(j);
                }
                ++i;
            }
        )
        this.quads.forEach(
            (quad) => {
                quad.update();
                let model = quad.getModel();
                for (let j = 0; j < 16; ++j) {
                    this.objectData[(i * 16) + j] = <number>model.at(j);
                }
                ++i;
            }
        )
        this.cube.update();
        let model = this.cube.getModel();
        for (let j = 0; j < 16; ++j) {
            this.objectData[(i * 16) + j] = <number>model.at(j);
        }
        ++i;

        this.player.update();
    }

    spinPlayer(dx: number, dy: number) {
        this.player.eulers[2] -= dx * 1e-3;
        this.player.eulers[2] %= 360;

        this.player.eulers[1] = Math.min(
            89, Math.max(
                -89,
                this.player.eulers[1] - (dy * 1e-3),
            )
        )// clamp between 89 and -89
    }

    movePlayer(forwardAmount: number, rightAmount: number, upAmount: number) {
        vec3.scaleAndAdd(
            this.player.position, this.player.position,
            this.player.forwards, forwardAmount
        )// take the forwards vector , scale it by forward amount and add

        vec3.scaleAndAdd(
            this.player.position, this.player.position,
            this.player.right, rightAmount
        )// take the forwards vector , scale it by forward amount and add

        vec3.scaleAndAdd(
            this.player.position, this.player.position,
            this.player.up, upAmount
        )// take the forwards vector , scale it by forward amount and add
    }
    getPlayer(): Camera {
        return this.player;
    }
    getRenderables(): RenderData {
        return {
            viewTransform: this.player.getView(),
            modelTransforms: this.objectData,
            objectCount: {
                [ObjectTypes.TRIANGLE]: this.triangleCount,
                [ObjectTypes.QUAD]: this.quadCount,
            }
        }
    }
}
