Phaser.Filter.AlphaGray = function (game) {
    Phaser.Filter.call(this, game);

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgba = vec4(gl_FragColor.r, gl_FragColor.g, gl_FragColor.b, (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3.0);",
        "}"
    ];
};

Phaser.Filter.AlphaGray.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.AlphaGray.prototype.constructor = Phaser.Filter.AlphaGray;
Phaser.Filter.AlphaGray.prototype.key = "alpha_gray";
