Phaser.Filter.Flame = function (game) {
    Phaser.Filter.call(this, game);

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = vec3(gl_FragColor.a, (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b)/3.0, 0);",
        "}"
    ];
};

Phaser.Filter.Flame.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Flame.prototype.constructor = Phaser.Filter.Flame;
Phaser.Filter.Flame.prototype.key = "flame";
