Phaser.Filter.Reveal = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.phase = {type: "1f", value: 0};
    this.uniforms.freq = {type: "1f", value: 66};
    this.uniforms.a = {type: "1f", value: 0.2};
    this.uniforms.b = {type: "1f", value: 0.16};

    this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        "uniform vec4 dimensions;",
        "uniform sampler2D uSampler;",

        "precision highp float;",

        "uniform highp float phase;",
        "uniform highp float freq;",
        "uniform highp float a;",
        "uniform highp float b;",

        "void main(void) {",
            "float y = vTextureCoord.y;",
            //Reveal formula:
            //gain * sin(freq * y + phase) * (16*(y - 0.5)^4 - 1) + (y - 0.5)^2/a + (x - 0.5)^2/b - 1 = 0
            //gain = 0.0684, freq = 66, phase = 0, a = 0.2, b = 0.16
            "float aux = -a*b*(2736.*a*pow(y,4.)*sin(phase+freq*y)-5472.*a*pow(y,3.)*sin(phase+freq*y)+4104.*a*y*y*sin(phase+freq*y)-1368.*a*y*sin(phase+freq*y)-2500.*a+2500.*y*y-2500.*y+625.);",
            "float x = aux < 0. ? -1. : (25.*a + (vTextureCoord.x >= .5 ? sqrt(aux) : -sqrt(aux)))/(50.*a);",
            "float sqr_rho = x < 0. ? -1. : pow(x - .5, 2.) + pow(y - .5, 2.);",
            "float sqr_orig_rho = pow(vTextureCoord.x - .5, 2.) + pow(vTextureCoord.y - .5, 2.);",
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

Object.defineProperty(Phaser.Filter.Reveal.prototype, 'freq', {
    get: function() {
        return this.uniforms.freq.value;
    },
    set: function(value) {
        this.uniforms.freq.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Reveal.prototype, 'a', {
    get: function() {
        return this.uniforms.a.value;
    },
    set: function(value) {
        this.uniforms.a.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Reveal.prototype, 'b', {
    get: function() {
        return this.uniforms.b.value;
    },
    set: function(value) {
        this.uniforms.b.value = value;
    }
});
