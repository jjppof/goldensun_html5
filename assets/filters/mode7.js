Phaser.Filter.Mode7 = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.angle = {type: "1f", value: 0};
    this.uniforms.scale = {type: "1f", value: .44};
    this.uniforms.distance = {type: "1f", value: 1.023};
    this.uniforms.lookY = {type: "1f", value: 4.59};
    this.uniforms.lookX = {type: "1f", value: 0.48};
    this.uniforms.inclination = {type: "1f", value: 1.37};

    this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        "uniform vec4 dimensions;",
        "uniform sampler2D uSampler;",

        "precision highp float;",

        "uniform highp float scale;",
        "uniform highp float lookY;",
        "uniform highp float lookX;",
        "uniform highp float inclination;",
        "uniform highp float distance;",
        "uniform highp float angle;",
        "highp float cos_;",
        "highp float sin_;",

        "void main(void) {",
        "    vec2 warped;",

        "    warped.x = (vTextureCoord.x - lookX) / (-inclination*vTextureCoord.y + lookY);",
        "    warped.y = 4.0 / (-inclination*vTextureCoord.y + lookY);",
        "    warped.y -= distance;",
        "    warped /= scale;",

        "    cos_ = cos(angle);",
        "    sin_ = sin(angle);",
        "    warped *= mat2(cos_, -sin_, sin_, cos_);",
        "    warped += vec2(0.5, 0.5);",

        "    bool isDraw = vTextureCoord.y > 0.5 - lookY;",
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

Object.defineProperty(Phaser.Filter.Mode7.prototype, 'lookX', {
    get: function() {
        return this.uniforms.lookX.value;
    },
    set: function(value) {
        this.uniforms.lookX.value = value;
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