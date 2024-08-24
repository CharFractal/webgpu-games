import shader from './shader.wgsl'

const init = async () => {
  if (!navigator.gpu) {
    throw Error("WebGPU not supported.");
  }

  console.log("WebGPU is supported");

  const canvas : HTMLCanvasElement= document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) {
    throw Error("Canvas element not found.");
  }

  const adapter : GPUAdapter = <GPUAdapter>await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error("Failed to get GPU adapter heheha.");
  }

  const device  : GPUDevice= <GPUDevice>await adapter.requestDevice();
  if (!device) {
    throw Error("Failed to get GPU device.");
  }

  const context : GPUCanvasContext = <GPUCanvasContext> canvas.getContext("webgpu") as GPUCanvasContext;
  if (!context) {
    throw Error("Failed to get WebGPU context.");
  }

  const format : GPUTextureFormat = "bgra8unorm";

  context.configure({
    device: device,
    format: format
  });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: shader
      }),
      entryPoint: 'vs_main'
    },
    fragment: {
      module: device.createShaderModule({
        code: shader
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
      clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
      loadOp: "clear",
      storeOp: "store"
    }]
  });

  renderPass.setPipeline(pipeline);
  renderPass.draw(3, 1, 0, 0);

  device.queue.submit([commandEncoder.finish()]);
};

init().catch(console.error);

