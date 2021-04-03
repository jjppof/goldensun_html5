export class Wave {
    private game: Phaser.Game;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private half_width: number;
    private half_width_sqr: number;
    private half_height: number;
    private img: Phaser.Image;
    private bmp: Phaser.BitmapData;
    public phase: number = 0;
    public red: number = 0;
    public green: number = 0;
    public blue: number = 255;
    public frequency: number;
    public transparent_radius: number = 0;

    constructor(game, x, y, width, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.resize(width, height);

        this.img = this.game.add.image(this.x, this.y);
        this.img.anchor.setTo(0.5, 0.5);
        this.bmp = this.game.add.bitmapData(this.width, this.height);
        this.bmp.smoothed = false;
        this.bmp.add(this.img);
    }

    set size(size) {
        this.resize(size, size);
        this.update();
    }

    get size() {
        return this.width;
    }

    get sprite() {
        return this.img;
    }

    private resize(width: number, height: number) {
        this.width = width | 0;
        this.height = height | 0;
        this.half_height = this.height >> 1;
        this.half_width = this.width >> 1;
        this.half_width_sqr = this.half_width * this.half_width;
        this.frequency = 2 / this.half_width;
        this.bmp?.resize(this.width, this.height);
    }

    set_color(red: number, green: number, blue: number) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    update() {
        this.bmp.clear();
        const transp_rad_sqr = this.transparent_radius * this.transparent_radius;
        const freq_pi = this.frequency * Math.PI;
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                const rho =
                    (x - this.half_width) * (x - this.half_width) + (y - this.half_height) * (y - this.half_height);
                if (rho > this.half_width_sqr || rho < transp_rad_sqr) {
                    this.bmp.setPixel32(x, y, 0, 0, 0, 0, false);
                } else {
                    const effect_color = (255 * (0.5 + Math.cos(freq_pi * Math.sqrt(rho) + this.phase) / 2)) | 0;
                    const red = Math.max(effect_color, this.red);
                    const green = Math.max(effect_color, this.green);
                    const blue = Math.max(effect_color, this.blue);
                    this.bmp.setPixel32(x, y, red, green, blue, 255, false);
                }
            }
        }
        this.bmp.context.putImageData(this.bmp.imageData, 0, 0);
    }

    destroy() {
        this.bmp.destroy();
        this.img.destroy();
    }
}
