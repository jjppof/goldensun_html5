Phaser.Filter.PixelShift = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.x_shift = { type: '1f', value: 0.0 };
    this.uniforms.y_shift = { type: '1f', value: 0.0 };
    this.uniforms.frame_width = { type: '1f', value: 0.0 };
    this.uniforms.frame_height = { type: '1f', value: 0.0 };

    this.setResolution(game.config.width, game.config.height);

    this.fragmentSrc = `
        precision mediump float;

        varying vec2       vTextureCoord;
        uniform sampler2D  uSampler;
        uniform float      x_shift;
        uniform float      y_shift;
        uniform float      frame_width;
        uniform float      frame_height;
        uniform vec2       resolution;

        void main(void) {
            vec2 uv = vTextureCoord.xy;
            vec2 uv_px = uv * resolution;
            float mod_pos;

            if (uv_px.y >= 0.0 && uv_px.y <= frame_height) {
                mod_pos = mod(uv_px.y + y_shift, frame_height);
                uv.y = mod_pos / resolution.y;
            }

            if (uv_px.x >= 0.0 && uv_px.x <= frame_width) {
                mod_pos = mod(uv_px.x + x_shift, frame_width);
                uv.x = mod_pos / resolution.x;
            }

            gl_FragColor = texture2D(uSampler, uv);
        }
    `;
};

Phaser.Filter.PixelShift.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.PixelShift.prototype.constructor = Phaser.Filter.PixelShift;
Phaser.Filter.PixelShift.prototype.key = "pixel_shift";

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'x_shift', {
    get: function() {
        return this.uniforms.x_shift.value;
    },
    set: function(value) {
        this.uniforms.x_shift.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'y_shift', {
    get: function() {
        return this.uniforms.y_shift.value;
    },
    set: function(value) {
        this.uniforms.y_shift.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'frame_width', {
    get: function() {
        return this.uniforms.frame_width.value;
    },
    set: function(value) {
        this.uniforms.frame_width.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'frame_height', {
    get: function() {
        return this.uniforms.frame_height.value;
    },
    set: function(value) {
        this.uniforms.frame_height.value = value;
    }
});
