export class Material {
    texture!: GPUTexture;
    view!: GPUTextureView;
    sampler!: GPUSampler;
    bindGroup!: GPUBindGroup;

    async initialize(device: GPUDevice, url: string, bindGroupLayout: GPUBindGroupLayout) {
        const response: Response = await fetch(url);
        const blob = await response.blob();
        const ImageData: ImageBitmap = await createImageBitmap(blob);

        await this.loadImageBitmap(device, ImageData);

        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "rgba8unorm",
            dimension: "2d",
            aspect: "all",
            baseMipLevel: 0,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: 1,
        }
        this.view = this.texture.createView(viewDescriptor);//----------------------------------IMAGE VIEW

        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1,
        }
        this.sampler = device.createSampler(samplerDescriptor);//--------------------------------IMAGE SAMPLER
        this.bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
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
    async loadImageBitmap(device: GPUDevice, imageData: ImageBitmap) {
        const textureDescriptor: GPUTextureDescriptor = {
            size: {
                width: imageData.width,
                height: imageData.height
            },
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        }

        this.texture = device.createTexture(textureDescriptor);

        device.queue.copyExternalImageToTexture(
            { source: imageData },
            { texture: this.texture },
            textureDescriptor.size
        );
    }
}