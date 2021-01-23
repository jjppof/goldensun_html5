Phaser.Filter.Circle = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.phase = { type: '1f', value: 4 };
    this.uniforms.freq = { type: '1f', value: 2.742 };
    this.uniforms.transparent_radius = { type: '1f', value: 0.5 };
    this.uniforms.red = { type: '1f', value: 0.0 };
    this.uniforms.green = { type: '1f', value: 0.0 };
    this.uniforms.blue = { type: '1f', value: 1.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      phase;",
        "uniform float      freq;",
        "uniform float      transparent_radius;",
        "uniform float      red;",
        "uniform float      green;",
        "uniform float      blue;",

        "void main(void) {",
            "float x = vTextureCoord.x * 2.4;",
            "float y = vTextureCoord.y * 1.6;",
            "float ro = sqrt(pow(x - 0.5, 2.) + pow(y - 0.5, 2.));",
            "float effect = cos(freq*3.141592*ro + phase);",
            "vec4 wave = vec4(clamp(effect, red, 1.), clamp(effect, green, 1.), clamp(effect, blue, 1.), 1);",
            "vec4 color = vec4(red, green, blue, 1);",
            "vec4 colored_wave = 1.0 - (1.0 - color) * (1.0 - wave);",

            "float d = pow(length(vec2(vTextureCoord.x*2.4*2.0 - 1., vTextureCoord.y*1.6*2.0 - 1.)), 500.);",
            "vec4 white_circ = clamp(vec4(vec3(1., 1., 1.) - d, 1. - d), vec4(0.,0.,0.,0.), vec4(1.,1.,1.,1.));",

            "d = pow(log2(2./transparent_radius)*length(vec2(vTextureCoord.x*2.4*2.0 - 1., vTextureCoord.y*1.6*2.0 - 1.)), 500.);",
            "vec4 transparent_circ = clamp(vec4(vec3(1., 1., 1.) * d, d), vec4(0.,0.,0.,0.), vec4(1.,1.,1.,1.));",

            "gl_FragColor = transparent_circ * white_circ * colored_wave;",
        "}"
    ];
};

Phaser.Filter.Circle.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Circle.prototype.constructor = Phaser.Filter.Circle;
Object.defineProperty(Phaser.Filter.Circle.prototype, 'phase', {
    get: function() {
        return this.uniforms.phase.value;
    },
    set: function(value) {
        this.uniforms.phase.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Circle.prototype, 'freq', {
    get: function() {
        return this.uniforms.freq.value;
    },
    set: function(value) {
        this.uniforms.freq.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Circle.prototype, 'transparent_radius', {
    get: function() {
        return this.uniforms.transparent_radius.value;
    },
    set: function(value) {
        this.uniforms.transparent_radius.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Circle.prototype, 'color', {
    get: function() {
        return [
            this.uniforms.red.value,
            this.uniforms.green.value,
            this.uniforms.blue.value,
        ];
    },
    set: function(value) {
        this.uniforms.red.value = value[0];
        this.uniforms.green.value = value[1];
        this.uniforms.blue.value = value[2];
    }
});
