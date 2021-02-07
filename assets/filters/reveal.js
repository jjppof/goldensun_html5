Phaser.Filter.Reveal = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.phase = {type: "1f", value: 0};
    this.uniforms.frequency = {type: "1f", value: 66};

    this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        "uniform vec4 dimensions;",
        "uniform sampler2D uSampler;",

        "precision highp float;",

        "uniform highp float phase;",
        "uniform highp float frequency;",

        "void main(void) {",
            "float y = vTextureCoord.y;",
            //Reveal formula:
            //gain * sin(freq * y + phase) * (y^4 - 1) + (y - 0.5)^2/a + (x = 0.5)^2/b = 1
            //gain = 0.0684, freq = 66, phase = 0, a = 0.2, b = 0.16
            "float aux = -171.*(pow(y, 4.) - 1.)*sin(phase+frequency*y)-625.*(20.*y*y -20.*y+1.);",
            "float x = aux < 0. ? -1. : .5 + 0.008*(vTextureCoord.x >= .5 ? sqrt(aux) : -sqrt(aux));",
            "float sqr_rho = x < 0. ? -1. : pow(x - .5, 2.) + pow(y - .5, 2.);",
            "float sqr_orig_rho = pow(vTextureCoord.x - .5, 2.) + pow(vTextureCoord.y - .5, 2.);",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgba = vec4(0,0,0,sqr_orig_rho<sqr_rho ? 0 : 1);",
        "}",
    ];
};

Phaser.Filter.Reveal.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Reveal.prototype.constructor = Phaser.Filter.Reveal;

Object.defineProperty(Phaser.Filter.Reveal.prototype, 'phase', {
    get: function() {
        return this.uniforms.phase.value;
    },
    set: function(value) {
        this.uniforms.phase.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Reveal.prototype, 'frequency', {
    get: function() {
        return this.uniforms.frequency.value;
    },
    set: function(value) {
        this.uniforms.frequency.value = value;
    }
});
