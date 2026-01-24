Phaser.Filter.Levels = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.min_input = { type: '1f', value: -1.0 };
    this.uniforms.max_input = { type: '1f', value: -1.0 };
    this.uniforms.gamma = { type: '1f', value: -1.0 };

    this.fragmentSrc = [
        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform sampler2D  uSampler;",
        "uniform float      min_input;",
        "uniform float      max_input;",
        "uniform float      gamma;",

        "vec3 gammaCorrect(vec3 color, float gamma, float alpha){",
            "return pow(color, alpha * vec3(1.0/gamma));",
        "}",

        "vec3 levelRange(vec3 color, float minInput, float maxInput, float alpha){",
            "return min(max(color - alpha*vec3(minInput), vec3(0.0)) / (vec3(maxInput) - vec3(minInput)), vec3(1.0));",
        "}",

        "vec3 finalLevels(vec3 color, float minInput, float gamma, float maxInput, float alpha){",
            "return gammaCorrect(levelRange(color, minInput, maxInput, alpha), gamma, alpha);",
        "}",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = finalLevels(gl_FragColor.rgb, min_input, gamma, max_input, gl_FragColor.a);",
        "}"
    ];
};

Phaser.Filter.Levels.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Levels.prototype.constructor = Phaser.Filter.Levels;
Phaser.Filter.Levels.prototype.key = "levels";

Object.defineProperty(Phaser.Filter.Levels.prototype, 'min_input', {
    get: function() {
        return this.uniforms.min_input.value;
    },
    set: function(value) {
        this.uniforms.min_input.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Levels.prototype, 'max_input', {
    get: function() {
        return this.uniforms.max_input.value;
    },
    set: function(value) {
        this.uniforms.max_input.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Levels.prototype, 'gamma', {
    get: function() {
        return this.uniforms.gamma.value;
    },
    set: function(value) {
        this.uniforms.gamma.value = value;
    }
});
