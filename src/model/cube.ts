import { vec3, mat4 } from "gl-matrix"
import { deg2rad } from "./mathTypes"

export class Cube {
    position: vec3;
    eulers: vec3;
    model!: mat4;

    constructor(position: vec3, eulers: vec3) {
        this.position = position;
        this.eulers = eulers
    }
    update() {
        this.eulers[2] += 0.01;
        this.eulers[2] %= 360
        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);
        mat4.rotateY(this.model, this.model, deg2rad(this.eulers[1]));
        mat4.rotateZ(this.model, this.model, deg2rad(this.eulers[2]));
    }
    getModel(): mat4 {
        return this.model;
    }
}