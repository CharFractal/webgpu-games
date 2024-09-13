export class ComputeMaterial {
    texture: GPUTexture;
    view: GPUTextureView;
    sampler: GPUSampler;
    computeBindGroup: GPUBindGroup;
    renderBindGroup: GPUBindGroup;
    constructor(device: GPUDevice, width: number, height: number, computeGroupLayout: GPUBindGroupLayout, renderGroupLayout: GPUBindGroupLayout) {
        this.texture = device.createTexture({
            size: {
                width: width,
                height: height,
            },
            format: "rgba8unorm",
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        });
        this.view = this.texture.createView();//----------------------------------IMAGE VIEW

        this.sampler = device.createSampler({
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1,
        });//--------------------------------IMAGE SAMPLER
        this.computeBindGroup = device.createBindGroup({
            layout: computeGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.view,
                },
            ]
        });
        this.renderBindGroup = device.createBindGroup({
            layout: renderGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.view,
                },
                {
                    binding: 1,
                    resource: this.sampler,
                },
            ]
        });
    }
}