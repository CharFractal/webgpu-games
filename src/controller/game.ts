import { Renderer } from "../view/renderer";
import { Scene } from "../model/scene";

export class Game {
    canvas: HTMLCanvasElement;
    renderer: Renderer;
    scene: Scene;

    keyDownLabel: HTMLElement;
    keyUpLabel: HTMLElement;
    mouseXLabel: HTMLElement;
    mouseYLabel: HTMLElement;

    forwardsAmount: number;
    rightAmount: number

    constructor(canvas: HTMLCanvasElement) {

        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.scene = new Scene();

        this.forwardsAmount = 0;
        this.rightAmount = 0;

        this.keyUpLabel = <HTMLElement>document.getElementById("keyUp");
        this.keyDownLabel = <HTMLElement>document.getElementById("keyDown");
        this.mouseXLabel = <HTMLElement>document.getElementById("mouseX");
        this.mouseYLabel = <HTMLElement>document.getElementById("mouseY");

        this.canvas.onclick = () => {
            this.canvas.requestPointerLock();
        }
        this.attachEventListeners();
    }

    async initialize() {
        console.log("intializing renderer");
        await this.renderer.initialize();
    }

    run = () => {
        var running: boolean = true;

        this.scene.update();
        console.log(this.forwardsAmount);
        console.log(this.rightAmount);
        this.scene.movePlayer(this.forwardsAmount, this.rightAmount);

        this.renderer.render(
            this.scene.getPlayer(),
            this.scene.getTriangles(),
        );
        if (running) {
            requestAnimationFrame(this.run);
        }
    }

    attachEventListeners() {
        window.addEventListener('keydown', this.handleKeyPress);
        window.addEventListener('keyup', this.handleKeyRelease);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
    }

    handleKeyPress = (event: KeyboardEvent) => {
        const keyCode = event.code;
        this.keyDownLabel.textContent = `Key Press: ${keyCode}`;
        if (!event.repeat) {
            switch (keyCode) {
                case 'KeyW': this.forwardsAmount += 0.1; break;
                case 'KeyS': this.forwardsAmount -= 0.1; break;
                case 'KeyA': this.rightAmount -= 0.1; break;
                case 'KeyD': this.rightAmount += 0.1; break;
            }
        }
    }

    handleKeyRelease = (event: KeyboardEvent) => {
        const keyCode = event.code;
        this.keyUpLabel.textContent = `Key Release: ${keyCode}`;
        if (!event.repeat) {
            switch (keyCode) {
                case 'KeyW': this.forwardsAmount = 0; break;
                case 'KeyS': this.forwardsAmount = 0; break;
                case 'KeyA': this.rightAmount = 0; break;
                case 'KeyD': this.rightAmount = 0; break;
            }
        }
    }

    handleMouseMove = (event: MouseEvent) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        this.mouseXLabel.textContent = `Mouse X: ${mouseX}`;
        this.mouseYLabel.textContent = `Mouse Y: ${mouseY}`;

        this.scene.spinPlayer(event.movementX, event.movementY);
    }
}