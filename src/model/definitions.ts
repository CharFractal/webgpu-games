import { mat4 } from "gl-matrix";

export enum ObjectTypes {
    TRIANGLE,
    QUAD,
};

export interface RenderData {
    viewTransform: mat4;
    modelTransforms: Float32Array;
    objectCount: { [obj in ObjectTypes]: number }
};