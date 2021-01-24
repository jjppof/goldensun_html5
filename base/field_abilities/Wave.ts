export class Wave {
    private game: Phaser.Game;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private half_width: number;
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
        this.bmp = this.game.add.bitmapData(this.width, this.height);
        this.bmp.add(this.img);
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.half_height = this.height >> 1;
        this.half_width = this.width >> 1;
        this.frequency = 2 / this.half_width;
        this.bmp?.resize(this.width, this.height);
    }

    get sprite() {
        return this.img;
    }

    set_color(red: number, green: number, blue: number) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    update() {
        this.bmp.clear();
        for (let x = 0; x < this.width; ++x) {
            for (let y = 0; y < this.height; ++y) {
                const rho = Math.sqrt(Math.pow(x - this.half_width, 2) + Math.pow(y - this.half_height, 2));
                if (rho > this.half_width || rho < this.transparent_radius) {
                    this.bmp.setPixel32(x, y, 0, 0, 0, 0);
                } else {
                    const effect_color = (255 * (0.5 + Math.cos(this.frequency * Math.PI * rho + this.phase) / 2)) | 0;
                    const pixel = [
                        Math.max(effect_color, this.red),
                        Math.max(effect_color, this.green),
                        Math.max(effect_color, this.blue),
                    ];
                    this.bmp.setPixel32(x, y, pixel[0], pixel[1], pixel[2], 255);
                }
            }
        }
    }

    destroy() {
        this.bmp.destroy();
        this.img.destroy();
    }
}
