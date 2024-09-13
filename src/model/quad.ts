import { vec3, mat4 } from "gl-matrix"
import { deg2rad } from "./mathTypes";

export class Quad {
    position: vec3;
    public eulers: vec3;
    model!: mat4;

    constructor(position: vec3) {
        this.position = position;
        this.eulers = vec3.create();

    }

    update() {

        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);
        mat4.rotateX(this.model, this.model, deg2rad(this.eulers[0]));
        mat4.rotateY(this.model, this.model, deg2rad(this.eulers[1]));
        mat4.rotateZ(this.model, this.model, deg2rad(this.eulers[2]));
    }

    getModel(): mat4 {
        return this.model;
    }
}