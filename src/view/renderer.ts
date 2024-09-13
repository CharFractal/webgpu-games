import screenShader from "../../shaders/shader.wgsl";
import raytracerKernel from "../../shaders/raytracerKernel.wgsl"
import { Material } from "./material";
import { TriangleMesh } from "./triangleMesh";
import { QuadMesh } from "./quadMesh";
import { mat4 } from "gl-matrix";
import { ObjectTypes, RenderData } from "../model/definitions";
import { Mesh } from "./mesh";
import { ComputeMaterial } from "./computeMaterial";

export class Renderer {
    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;
    // screen 
    renderPipeline!: GPURenderPipeline;
    renderGroupLayout!: GPUBindGroupLayout;
    renderBindGroup!: GPUBindGroup;
    // compute
    computePipeline!: GPUComputePipeline;
    computeGroupLayout!: GPUBindGroupLayout;
    computeBindgroup!: GPUBindGroup;
    // materials
    materialGroupLayout!: GPUBindGroupLayout;
    //Depth Stencil
    depthStencilState!: GPUDepthStencilState;// how it will be used
    depthStencilBuffer!: GPUTexture;// texture from which it will be created
    depthStencilView!: GPUTextureView;
    depthStencilAttachment!: GPURenderPassDepthStencilAttachment;
    // Buffers
    uniformBuffer!: GPUBuffer;
    objectBuffer!: GPUBuffer;
    // Meshes
    triangleMesh!: TriangleMesh;
    floorMesh!: QuadMesh;
    wallMesh!: QuadMesh;
    // Materials
    triangleMaterial!: Material;
    floorMaterial!: Material;
    wallMaterial!: ComputeMaterial;

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
    makeBindGroupLayouts() {
        this.renderGroupLayout = this.device.createBindGroupLayout({
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
        this.computeGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d",
                    }
                }
            ]
        })
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
    async createAssets() {
        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.objectBuffer = this.device.createBuffer({
            size: 64 * 1024,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.triangleMesh = new TriangleMesh(this.device);
        this.triangleMaterial = new Material();
        await this.triangleMaterial.initialize(this.device, "images/1.jpeg", this.materialGroupLayout);

        this.floorMesh = new QuadMesh(this.device);
        this.floorMaterial = new Material();
        await this.floorMaterial.initialize(this.device, "images/floor.png", this.materialGroupLayout);

        this.wallMesh = new QuadMesh(this.device);
        this.wallMaterial = new ComputeMaterial(this.device, 720, 720, this.computeGroupLayout, this.materialGroupLayout);

        console.log("Assets loaded succesfully");
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
    async makePipeline() {
        if (!this.triangleMesh) {
            throw new Error("TriangleMesh not initialized");
        }
        const screenPipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.renderGroupLayout, this.materialGroupLayout]
        });
        const computePipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.computeGroupLayout]
        })
        this.renderPipeline = this.device.createRenderPipeline({
            layout: screenPipelineLayout,
            depthStencil: this.depthStencilState,
            vertex: {
                module: this.device.createShaderModule({
                    code: screenShader
                }),
                entryPoint: "vs_main",
                buffers: [this.triangleMesh.bufferLayout],
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: screenShader
                }),
                entryPoint: "fs_main",
                targets: [{
                    format: this.format
                }]
            },
            primitive: {
                topology: "triangle-list"
            },

        });
        this.computePipeline = this.device.createComputePipeline({
            layout: computePipelineLayout,
            compute: {
                module: this.device.createShaderModule({
                    code: raytracerKernel,
                }),
                entryPoint: "main",
            }
        })
        console.log("Pipelines setup succesfull")
    }
    async makeBindGroup() {
        this.renderBindGroup = this.device.createBindGroup({
            layout: this.renderGroupLayout,
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
        // Render pass: holds draw commands, allocated from command encoder

        const computepass: GPUComputePassEncoder = commandEncoder.beginComputePass();
        computepass.setPipeline(this.computePipeline);
        computepass.setBindGroup(0, this.wallMaterial.computeBindGroup);
        computepass.dispatchWorkgroups(this.canvas.width, this.canvas.height, 1);
        computepass.end();

        // Texture view: image view to the color buffer in this case
        const textureView: GPUTextureView = this.context.getCurrentTexture().createView();
        const screenpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment,
        });
        screenpass.setPipeline(this.renderPipeline);
        screenpass.setBindGroup(0, this.renderBindGroup);

        let objectDrawn = 0;
        //Triangles
        screenpass.setVertexBuffer(0, this.triangleMesh.buffer);
        screenpass.setBindGroup(1, this.triangleMaterial.bindGroup);
        screenpass.draw(3, renderables.objectCount[ObjectTypes.TRIANGLE], 0, objectDrawn);
        objectDrawn += renderables.objectCount[ObjectTypes.TRIANGLE];
        //Floor
        screenpass.setVertexBuffer(0, this.floorMesh.buffer);
        screenpass.setBindGroup(1, this.floorMaterial.bindGroup);
        screenpass.draw(6, renderables.objectCount[ObjectTypes.FLOOR], 0, objectDrawn);
        objectDrawn += renderables.objectCount[ObjectTypes.FLOOR];
        //Wall
        screenpass.setVertexBuffer(0, this.wallMesh.buffer);
        screenpass.setBindGroup(1, this.wallMaterial.renderBindGroup);
        screenpass.draw(6, renderables.objectCount[ObjectTypes.WALL], 0, objectDrawn);
        objectDrawn += renderables.objectCount[ObjectTypes.WALL];
        screenpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}
