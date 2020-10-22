Phaser.Filter.Mode7 = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.angle = {type: "1f", value: 0};
    this.uniforms.scale = {type: "1f", value: .28};
    this.uniforms.distance = {type: "1f", value: 1};
    this.uniforms.lookY = {type: "1f", value: 4.5};
    this.uniforms.inclination = {type: "1f", value: 1};

    this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        "uniform vec4 dimensions;",
        "uniform sampler2D uSampler;",

        "precision highp float;",

        "uniform highp float scale;",
        "uniform highp float lookY;",
        "uniform highp float inclination;",
        "uniform highp float distance;",
        "uniform highp float angle;",
        "highp float cos_;",
        "highp float sin_;",

        "void main(void) {",
        "    vec2 uv = vTextureCoord;",
        "    vec2 warped;",

        // perform mode7 transform on uvs
        "    warped = vec2(uv.x-0.5, 4) / vec2(-inclination*uv.y + lookY, -inclination*uv.y + lookY);",
        "    warped.y -= distance;",
        "    warped /= scale;",

        "    cos_ = cos(angle);",
        "    sin_ = sin(angle);",
        "    warped *= mat2(cos_, -sin_, sin_, cos_);", // rotate the new uvs
        "    warped += vec2(0.5, 0.5);", // centred

        "    bool isDraw = uv.y > 0.5 - lookY;",
        "    if (isDraw) {",
        "        gl_FragColor = texture2D(uSampler, warped);",
        "    } else {",
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
    }
});

Object.defineProperty(Phaser.Filter.Mode7.prototype, 'inclination', {
    get: function() {
        return this.uniforms.inclination.value;
    },
    set: function(value) {
        this.uniforms.inclination.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Mode7.prototype, 'lookY', {
    get: function() {
        return this.uniforms.lookY.value;
    },
    set: function(value) {
        this.uniforms.lookY.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Mode7.prototype, 'scale', {
    get: function() {
        return this.uniforms.scale.value;
    },
    set: function(value) {
        this.uniforms.scale.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Mode7.prototype, 'distance', {
    get: function() {
        return this.uniforms.distance.value;
    },
    set: function(value) {
        this.uniforms.distance.value = value;
    }
});