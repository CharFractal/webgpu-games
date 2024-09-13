import shader from "../../shaders/shader.wgsl";
import { Material } from "./material";
import { TriangleMesh } from "./triangleMesh";
import { QuadMesh } from "./quadMesh";
import { mat4 } from "gl-matrix";
import { ObjectTypes, RenderData } from "../model/definitions";
import { Mesh } from "./mesh";

export class Renderer {
    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipeline objects
    pipeline!: GPURenderPipeline;
    uniformBuffer!: GPUBuffer;
    frameGroupLayout!: GPUBindGroupLayout;
    materialGroupLayout!: GPUBindGroupLayout;
    frameBindGroup!: GPUBindGroup;

    //Depth Stencil
    depthStencilState!: GPUDepthStencilState;// how it will be used
    depthStencilBuffer!: GPUTexture;// texture from which it will be created
    depthStencilView!: GPUTextureView;
    depthStencilAttachment!: GPURenderPassDepthStencilAttachment;

    // Assets
    objectBuffer!: GPUBuffer;
    triangleMesh!: TriangleMesh;
    triangleMaterial!: Material;
    quadMesh!: QuadMesh;
    quadMaterial!: Material;
    cubeMesh!: Mesh;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async initialize() {

        try {
            await this.setupDevice();
            await this.makeBindGroupLayouts();
            await this.createAssets();
            await this.makeDepthBufferResources();
            await this.makePipeline();
            await this.makeBindGroup();

        } catch (error) {
            console.error("Initialization failed: ", error);
        }
        console.log("Renderer initalized")

    }
    makeBindGroupLayouts() {
        this.frameGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                    }
                }
            ],
        });
        this.materialGroupLayout = this.device.createBindGroupLayout({
            entries: [

                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {},
                },

            ],
        });
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

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.frameGroupLayout, this.materialGroupLayout]
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
            layout: pipelineLayout,
            depthStencil: this.depthStencilState,
        });
        console.log("Pipeline setup succesfull")
    }

    async makeBindGroup() {
        this.frameBindGroup = this.device.createBindGroup({
            layout: this.frameGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.objectBuffer,
                    }
                }
            ]
        });
    }

    async makeDepthBufferResources() {
        this.depthStencilState = {
            format: "depth24plus-stencil8",
            depthWriteEnabled: true,
            depthCompare: "less-equal",
        }
        const size: GPUExtent3D = {
            width: this.canvas.width,
            height: this.canvas.height,
            depthOrArrayLayers: 1,
        }
        const depthBufferDescriptor: GPUTextureDescriptor = {
            size: size,
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        }
        const depthBufferView: GPUTextureViewDescriptor = {
            format: "depth24plus-stencil8",
            dimension: "2d",
            aspect: "all"
        };

        this.depthStencilBuffer = this.device.createTexture(depthBufferDescriptor);
        this.depthStencilView = this.depthStencilBuffer.createView(depthBufferView);

        this.depthStencilAttachment = {
            view: this.depthStencilView,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
            stencilLoadOp: "clear",
            stencilStoreOp: "discard",
        }
    }
    async createAssets() {
        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const modelBufferDescriptor: GPUBufferDescriptor = {
            size: 64 * 1024,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        };

        this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);

        this.triangleMesh = new TriangleMesh(this.device);
        this.triangleMaterial = new Material();

        this.quadMesh = new QuadMesh(this.device);
        this.quadMaterial = new Material();

        this.cubeMesh = new Mesh();
        await this.triangleMaterial.initialize(this.device, "images/1.jpeg", this.materialGroupLayout);
        await this.quadMaterial.initialize(this.device, "images/floor.png", this.materialGroupLayout);
        await this.cubeMesh.initialize(this.device, "models/cube.obj");
        console.log("Assets loaded succesfully");
    }

    async render(renderables: RenderData) {

        const projection = mat4.create();
        mat4.perspective(projection, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 10);
        const view = renderables.viewTransform;

        this.device.queue.writeBuffer(
            this.objectBuffer, 0,
            renderables.modelTransforms, 0,
            renderables.modelTransforms.length
        );

        this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>projection);
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
            }],
            depthStencilAttachment: this.depthStencilAttachment,
        });
        renderpass.setPipeline(this.pipeline);
        renderpass.setBindGroup(0, this.frameBindGroup);

        let objectDrawn = 0;
        //triangles
        renderpass.setVertexBuffer(0, this.triangleMesh.buffer);
        renderpass.setBindGroup(1, this.triangleMaterial.bindGroup);
        renderpass.draw(3, renderables.objectCount[ObjectTypes.TRIANGLE], 0, objectDrawn);
        objectDrawn += renderables.objectCount[ObjectTypes.TRIANGLE];

        //Quads
        renderpass.setVertexBuffer(0, this.quadMesh.buffer);
        renderpass.setBindGroup(1, this.quadMaterial.bindGroup);
        renderpass.draw(6, renderables.objectCount[ObjectTypes.QUAD], 0, objectDrawn);
        objectDrawn += renderables.objectCount[ObjectTypes.QUAD];

        //Cube
        renderpass.setVertexBuffer(0, this.cubeMesh.buffer);
        renderpass.setBindGroup(1, this.triangleMaterial.bindGroup);
        renderpass.draw(this.cubeMesh.vertexCount, 1, 0, objectDrawn);
        objectDrawn += 1;
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}
