"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shader_wgsl_1 = __importDefault(require("./shader.wgsl"));
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!navigator.gpu) {
        throw Error("WebGPU not supported.");
    }
    console.log("WebGPU is supported");
    const canvas = document.getElementById("canvas");
    if (!canvas) {
        throw Error("Canvas element not found.");
    }
    const adapter = yield navigator.gpu.requestAdapter();
    if (!adapter) {
        throw Error("Failed to get GPU adapter heheha.");
    }
    const device = yield adapter.requestDevice();
    if (!device) {
        throw Error("Failed to get GPU device.");
    }
    const context = canvas.getContext("webgpu");
    if (!context) {
        throw Error("Failed to get WebGPU context.");
    }
    const format = "bgra8unorm";
    context.configure({
        device: device,
        format: format
    });
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: shader_wgsl_1.default
            }),
            entryPoint: 'vs_main'
        },
        fragment: {
            module: device.createShaderModule({
                code: shader_wgsl_1.default
            }),
            entryPoint: "fs_main",
            targets: [{
                    format: format
                }]
        },
        primitive: {
            topology: "triangle-list"
        }
    });
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }]
    });
    renderPass.setPipeline(pipeline);
    renderPass.draw(3, 1, 0, 0);
    device.queue.submit([commandEncoder.finish()]);
});
init().catch(console.error);
