Phaser.Filter.PixelShift = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.x_shift = { type: '1f', value: 0.0 };
    this.uniforms.y_shift = { type: '1f', value: 0.0 };
    this.uniforms.frame_width = { type: '1f', value: 0.0 };
    this.uniforms.frame_height = { type: '1f', value: 0.0 };
    this.uniforms.base_texture_width = { type: '1f', value: 0.0 };
    this.uniforms.base_texture_height = { type: '1f', value: 0.0 };

    this.fragmentSrc = `
        precision mediump float;

        varying vec2       vTextureCoord;
        uniform sampler2D  uSampler;
        uniform float      x_shift;
        uniform float      y_shift;
        uniform float      frame_width;
        uniform float      frame_height;
        uniform float      base_texture_width;
        uniform float      base_texture_height;

        void main(void) {
            vec2 base_texture_size = vec2(base_texture_width, base_texture_height);
            vec2 uv = vTextureCoord.xy;
            vec2 uv_px = uv * base_texture_size;
            float mod_pos;

            if (uv_px.y >= 0.0 && uv_px.y <= frame_height) {
                mod_pos = mod(uv_px.y + y_shift, frame_height);
                uv.y = mod_pos / base_texture_size.y;
            }

            if (uv_px.x >= 0.0 && uv_px.x <= frame_width * 2.0) {
                mod_pos = mod(uv_px.x + x_shift, frame_width * 2.0);
                uv.x = mod_pos / base_texture_size.x;
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

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'base_texture_width', {
    get: function() {
        return this.uniforms.base_texture_width.value;
    },
    set: function(value) {
        this.uniforms.base_texture_width.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'base_texture_height', {
    get: function() {
        return this.uniforms.base_texture_height.value;
    },
    set: function(value) {
        this.uniforms.base_texture_height.value = value;
    }
});
