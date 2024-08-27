import shader from "../../shaders/shader.wgsl";
import { Material } from "./material";
import { TriangleMesh } from "./triangle_mesh";
import { mat4 } from "gl-matrix";
import { Camera } from "../model/camera";
import { Triangle } from "../model/triangle";

export class Renderer {
    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipeline objects
    uniformBuffer!: GPUBuffer;
    bindGroup!: GPUBindGroup;
    pipeline!: GPURenderPipeline;

    // Assets
    triangleMesh!: TriangleMesh;
    material!: Material;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async initialize() {

        try {
            await this.setupDevice();        // Ensure device setup is complete
            await this.createAssets();       // Create assets
            await this.makePipeline();       // Create pipeline after assets are created

        } catch (error) {
            console.error("Initialization failed: ", error);
        }
        console.log("Renderer initalized")

    }

    async setupDevice() {
        // Adapter: wrapper around (physical) GPU. Describes features and limits
        this.adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
        if (!this.adapter) {
            throw new Error("Failed to get GPU adapter");
        }

        // Device: wrapper around GPU functionality. Function calls are made through the device
        this.device = await this.adapter?.requestDevice() as GPUDevice;
        if (!this.device) {
            throw new Error("Failed to get GPU device");
        }
        // Context: similar to Vulkan instance (or OpenGL context)
        this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
        this.format = "bgra8unorm";

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });
        console.log("Device setup succesfull")
    }

    async makePipeline() {
        if (!this.triangleMesh) {
            throw new Error("TriangleMesh not initialized");
        }

        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {},
                }
            ],
        });

        this.bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                    }
                },
                {
                    binding: 1,
                    resource: this.material.view,
                },
                {
                    binding: 2,
                    resource: this.material.sampler,
                }
            ]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            vertex: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "vs_main",
                buffers: [this.triangleMesh.bufferLayout],
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "fs_main",
                targets: [{
                    format: this.format
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
            layout: pipelineLayout
        });
        console.log("Pipeline setup succesfull")
    }

    async createAssets() {
        this.triangleMesh = new TriangleMesh(this.device);
        this.material = new Material();

        await this.material.initialize(this.device, "images/1.jpeg");
        console.log("Assets loaded succesfully");
    }

    async render(camera: Camera, triangles: Triangle[]) {

        const projection = mat4.create();
        mat4.perspective(projection, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 10);
        const view = camera.getView()

        this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.uniformBuffer, 128, <ArrayBuffer>projection);
        // Command encoder: records draw commands for submission
        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
        // Texture view: image view to the color buffer in this case
        const textureView: GPUTextureView = this.context.getCurrentTexture().createView();
        // Render pass: holds draw commands, allocated from command encoder
        const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.25, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        renderpass.setPipeline(this.pipeline);
        renderpass.setVertexBuffer(0, this.triangleMesh.buffer);

        triangles.forEach(
            (triangle) => {
                const model = triangle.getModel();
                this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>model);
                renderpass.setBindGroup(0, this.bindGroup);
                renderpass.draw(3, 1, 0, 0)
            }
        )

        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);

    }
}
