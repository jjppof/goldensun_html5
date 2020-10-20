Phaser.Filter.Mode7 = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.angle = {type: "1f", value: 0};
    this.uniforms.sin1 = {type: "1f", value: 1};
    this.uniforms.sin2 = {type: "1f", value: 0};
    this.uniforms.cos1 = {type: "1f", value: 0};
    this.uniforms.cos2 = {type: "1f", value: -1};
    this.uniforms.scale = {type: "1f", value: .28};
    this.uniforms.distance = {type: "1f", value: 1};
    this.uniforms.lookY = {type: "1f", value: 3.5};

    this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        "uniform vec4 dimensions;",
        "uniform sampler2D uSampler;",

        "precision highp float;",
        "uniform highp float sin1;",
        "uniform highp float sin2;",
        "uniform highp float cos1;",
        "uniform highp float cos2;",

        "uniform highp float scale;",
        "uniform highp float lookY;",
        "uniform highp float distance;",

        "void main(void) {",
        "    vec2 uv = vTextureCoord;",
        "    vec2 warped;",

        // perform mode7 transform on uvs
        "    warped = vec2(uv.x-0.5, 4) / vec2(uv.y + lookY, uv.y + lookY);",
        "    warped.y -= distance;",
        "    warped /= scale;",

        "    warped *= mat2(sin1, sin2, cos1, cos2);", // rotate the new uvs
        "    warped += vec2(0.5, 0.5);", // centred

        "    bool isDraw = uv.y > 0.5 - lookY;",
        "    if (isDraw){",
        "        gl_FragColor = texture2D(uSampler, warped);",
        "    }else{",
        "        gl_FragColor = vec4(0.0,0.0,0.0,0.0);",
        "    }",
        "}",
    ];
};

Phaser.Filter.Mode7.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Mode7.prototype.constructor = Phaser.Filter.Mode7;

Object.defineProperty(Phaser.Filter.Mode7.prototype, 'angle', {
    get: function() {
        return this.uniforms.angle.value;
    },
    set: function(value) {
        this.uniforms.angle.value = value;
        this.uniforms.sin1.value = -Math.sin(value)
        this.uniforms.cos1.value = Math.cos(value)
        this.uniforms.sin2.value = Math.sin(value - 0.5*Math.PI)
        this.uniforms.cos2.value = Math.cos(value - 0.5*Math.PI)
    }
});