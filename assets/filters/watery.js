Phaser.Filter.Watery = function (game) {
    Phaser.Filter.call(this, game);

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = vec3(0.2*gl_FragColor.r, 1.4*gl_FragColor.g, 1.2*gl_FragColor.b);",
        "}"
    ];
};

Phaser.Filter.Watery.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Watery.prototype.constructor = Phaser.Filter.Watery;
Phaser.Filter.Watery.prototype.key = "watery";
