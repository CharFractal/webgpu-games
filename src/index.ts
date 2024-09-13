import { Game } from "./controller/game";

const App = async () => {

  document.body.style.background = "black";

  if (!navigator.gpu) {
    throw Error("WebGPU not supported.");
  }
  console.log("WebGPU is supported");

  const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) {
    throw Error("Canvas element not found.");
  }
  canvas.width = 720;
  canvas.height = 720;

  const game = new Game(canvas);
  game.initialize().then(() => game.run());

};

App().catch(console.error);

