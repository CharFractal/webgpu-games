import { Triangle } from "./triangle";
import { Quad } from "./quad";
import { Camera } from "./camera";
import { vec3, mat4 } from "gl-matrix";
import { ObjectTypes, RenderData } from "./definitions";
import { Cube } from "./cube";

export class Scene {
    player!: Camera;
    objectData!: Float32Array;
    objectIndex!: number;

    triangles!: Triangle[];
    triangleCount!: number;

    floorTiles!: Quad[];
    floorTileCount!: number;

    wallTiles!: Quad[];
    wallTileCount!: number;

    constructor() {
        this.objectData = new Float32Array(16 * 1024);
        this.objectIndex = 0;

        this.triangles = [];
        this.triangleCount = 0;

        this.floorTiles = [];
        this.floorTileCount = 0;

        this.wallTiles = [];
        this.wallTileCount = 0;

        this.player = new Camera([-2, 0, 0.5], 0, 0)

        this.makeTrinagles();
        this.makeFloor();
        this.makeWall();
    }
    private makeWall() {
        let wall: Quad = new Quad([0.0, 0.0, 1.0]);
        wall.eulers[1] = 0.5;
        wall.eulers[0] = 0.5;

        this.wallTiles.push(wall)
        let blankMatrix = mat4.create();
        for (var j = 0; j < 16; ++j) {
            this.objectData[(16 * this.objectIndex) + j] = <number>blankMatrix.at(j);
        }
        this.objectIndex++;
        this.wallTileCount++;
    }
    private makeFloor() {
        for (let x = -10; x < 10; ++x) {
            for (let y = -10; y < 10; ++y) {
                if (x % 2 == 0 && y % 2 == 0) {
                    this.floorTiles.push(
                        new Quad([x, y, -0.5])
                    );
                    let blankMatrix = mat4.create();
                    for (var j = 0; j < 16; ++j) {
                        this.objectData[(16 * this.objectIndex) + j] = <number>blankMatrix.at(j);
                    }
                    this.objectIndex++;
                    this.floorTileCount++;
                }
            }
        }
    }
    private makeTrinagles() {
        for (let y = -5; y <= 5; ++y) {
            this.triangles.push(
                new Triangle([2, y, 0], 0)// pos, theta
            );
            let blankMatrix = mat4.create();
            for (var j = 0; j < 16; ++j) {
                this.objectData[(16 * this.objectIndex) + j] = <number>blankMatrix.at(j);
            }
            this.objectIndex++;
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
        this.floorTiles.forEach(
            (quad) => {
                // quad.eulers[0] += 0.001;
                quad.update();
                let model = quad.getModel();
                for (let j = 0; j < 16; ++j) {
                    this.objectData[(i * 16) + j] = <number>model.at(j);
                }
                ++i;
            }
        )
        this.wallTiles.forEach(
            (quad) => {
                quad.update();
                let model = quad.getModel();
                for (let j = 0; j < 16; ++j) {
                    this.objectData[(i * 16) + j] = <number>model.at(j);
                }
                ++i;
            }
        )
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
                [ObjectTypes.FLOOR]: this.floorTileCount,
                [ObjectTypes.WALL]: this.wallTileCount,
            }
        }
    }
}
