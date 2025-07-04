/// <reference path="pixi.d.ts" />
/// <reference path="p2.d.ts" />

// Type definitions for Phaser CE
// Project: https://github.com/photonstorm/phaser-ce

interface MediaTrackConstraints { }

declare module "phaser-ce" {
    export = Phaser;
}

declare class Phaser {

    static VERSION: string;
    static DEV_VERSION: string;
    static GAMES: Phaser.Game[];

    static AUTO: number;
    static CANVAS: number;
    static WEBGL: number;
    static HEADLESS: number;
    static WEBGL_MULTI: number;

    static BITMAPDATA: number;
    static BITMAPTEXT: number;
    static BUTTON: number;
    static CANVAS_FILTER: number;
    static CIRCLE: number;
    static ELLIPSE: number;
    static EMITTER: number;
    static GRAPHICS: number;
    static GROUP: number;
    static IMAGE: number;
    static LINE: number;
    static MATRIX: number;
    static POINT: number;
    static POINTER: number;
    static POLYGON: number;
    static RECTANGLE: number;
    static ROUNDEDRECTANGLE: number;
    static RENDERTEXTURE: number;
    static RETROFONT: number;
    static SPRITE: number;
    static SPRITEBATCH: number;
    static TEXT: number;
    static TILEMAP: number;
    static TILEMAPLAYER: number;
    static TILESPRITE: number;
    static WEBGL_FILTER: number;
    static ROPE: number;
    static CREATURE: number;
    static VIDEO: number;

    static NONE: number;
    static LEFT: number;
    static RIGHT: number;
    static UP: number;
    static DOWN: number;

    static HORIZONTAL: number;
    static VERTICAL: number;
    static LANDSCAPE: number;
    static PORTRAIT: number;

    static ANGLE_UP: number;
    static ANGLE_DOWN: number;
    static ANGLE_LEFT: number;
    static ANGLE_RIGHT: number;
    static ANGLE_NORTH_EAST: number;
    static ANGLE_NORTH_WEST: number;
    static ANGLE_SOUTH_EAST: number;
    static ANGLE_SOUTH_WEST: number;

    static TOP_LEFT: number;
    static TOP_CENTER: number;
    static TOP_RIGHT: number;

    static LEFT_TOP: number;
    static LEFT_CENTER: number;
    static LEFT_BOTTOM: number;

    static CENTER: number;

    static RIGHT_TOP: number;
    static RIGHT_CENTER: number;
    static RIGHT_BOTTOM: number;

    static BOTTOM_LEFT: number;
    static BOTTOM_CENTER: number;
    static BOTTOM_RIGHT: number;

    static EmptyRectangle: Phaser.Rectangle;

}

declare module Phaser {

    enum blendModes {

        NORMAL,
        ADD,
        MULTIPLY,
        SCREEN,
        OVERLAY,
        DARKEN,
        LIGHTEN,
        COLOR_DODGE,
        COLOR_BURN,
        HARD_LIGHT,
        SOFT_LIGHT,
        DIFFERENCE,
        EXCLUSION,
        HUE,
        SATURATION,
        COLOR,
        LUMINOSITY

    }

    export enum scaleModes {

        DEFAULT,
        LINEAR,
        NEAREST

    }

    class Animation {

        constructor(game: Phaser.Game, parent: Phaser.Sprite, name: string, frameData: Phaser.FrameData, frames: number[] | string[], frameRate?: number, loop?: boolean);

        currentFrame: Phaser.Frame;
        delay: number;
        enableUpdate: boolean;
        frame: number;
        frameTotal: number;
        _frameData: any;
        game: Phaser.Game;
        isFinished: boolean;
        isPaused: boolean;
        isPlaying: boolean;
        killOnComplete: boolean;
        loop: boolean;
        loopCount: number;
        name: string;
        onComplete: Phaser.Signal;
        onLoop: Phaser.Signal;
        onStart: Phaser.Signal;
        onUpdate: Phaser.Signal;
        paused: boolean;
        reversed: boolean;
        speed: number;

        complete(): void;
        destroy(): void;
        static generateFrameNames(prefix: string, start: number, stop: number, suffix?: string, zeroPad?: number): string[];
        next(quantity?: number): void;
        onPause(): void;
        onResume(): void;
        play(frameRate?: number, loop?: boolean, killOnComplete?: boolean): Phaser.Animation;
        previous(quantity?: number): void;
        restart(): void;
        reverse(): Animation;
        reverseOnce(): Animation;
        setFrame(frameId?: string | number, useLocalFrameIndex?: boolean): void;
        stop(resetFrame?: boolean, dispatchComplete?: boolean): void;
        update(): boolean;
        updateCurrentFrame(signalUpdate: boolean, fromPlay?: boolean): boolean;
        updateFrameData(frameData: FrameData): void;

    }

    class AnimationManager {
        constructor(sprite: Phaser.Sprite);

        anims: {[animation_key: string]: Phaser.Animation};
        currentAnim: Phaser.Animation;
        currentFrame: Phaser.Frame;
        frame: number;
        frameData: Phaser.FrameData;
        frameName: string;
        frameTotal: number;
        game: Phaser.Game;
        isLoaded: boolean;
        name: string;
        paused: boolean;
        sprite: Phaser.Sprite;
        updateIfVisible: boolean;

        add(name: string, frames?: number[] | string[], frameRate?: number, loop?: boolean, useNumericIndex?: boolean): Phaser.Animation;
        copyFrameData(frameData: Phaser.FrameData, frame: string | number): boolean;
        destroy(): void;
        getAnimation(name: string): Phaser.Animation;
        next(quantity?: number): void;
        play(name: string, frameRate?: number, loop?: boolean, killOnComplete?: boolean): Phaser.Animation;
        previous(quantity?: number): void;
        stop(name?: string, resetFrame?: boolean): void;
        update(): boolean;
        validateFrames(frames: Phaser.Frame[], useNumericIndex?: boolean): boolean;

    }

    class AnimationParser {

        static JSONData(game: Phaser.Game, json: any): Phaser.FrameData;
        static JSONDataHash(game: Phaser.Game, json: any): Phaser.FrameData;
        static JSONDataPyxel(game: Phaser.Game, json: any): Phaser.FrameData;
        static spriteSheet(game: Phaser.Game, key: string, frameWidth: number, frameHeight: number, frameMax?: number, margin?: number, spacing?: number, skipFrames?: number): Phaser.FrameData;
        static XMLData(game: Phaser.Game, xml: any): Phaser.FrameData;

    }

    class AudioSprite {

        constructor(game: Phaser.Game, key: string);

        game: Phaser.Game;
        key: string;
        config: any;
        autoplayKey: string;
        autoplay: boolean;
        sounds: any;

        get(marker: string): Phaser.Sound;
        play(marker: string, volume?: number, position_shift?: number): Phaser.Sound;
        stop(marker: string): Phaser.Sound;

    }

    class ArraySet {

        constructor(list: any[]);

        position: number;
        list: any[];
        total: number;
        first: any;
        next: any;

        add(item: any): any;
        getByKey(property: string, value: any): any;
        getIndex(item: any): number;
        exists(item: any): boolean;
        reset(): void;
        remove(item: any): any;
        removeAll(destoy?: boolean): void;
        setAll(key: any, value: any): void;
        callAll(key: string, ...parameter: any[]): void;

    }

    class ArrayUtils {

        static getRandomItem<T>(objects: T[], startIndex?: number, length?: number): T;
        static removeRandomItem<T>(objects: T[], startIndex?: number, length?: number): T;
        static remove<T>(array: T[], startIndex: number, count?: number): T;
        static shuffle<T>(array: T[]): T[];
        static transposeMatrix<T>(array: T[]): T;
        static rotateMatrix(matrix: any, direction: number | string): any;
        static findClosest(value: number, arr: number[]): number;
        static rotate(array: any[]): any;
        static rotateLeft(array: any[]): any;
        static rotateRight(array: any[]): any;
        static numberArray(start: number, end?: number): number[];
        static numberArrayStep(start: number, end?: number, step?: number): number[];

    }

    interface BitmapFont {

        base: PIXI.BaseTexture;
        data: HTMLImageElement;
        font: Phaser.BMFont;
        url: string;

    }

    interface BMFont {

        chars: Phaser.BMFontChar[];
        font: string;
        lineHeight: number;
        size: number;

    }

    interface BMFontChar {

        x: number;
        y: number;
        width: number;
        height: number;
        xOffset: number;
        yOffset: number;
        xAdvance: number;
        kerning: number[];
        texture: PIXI.BaseTexture;

    }

    class BitmapData {

        constructor(game: Phaser.Game, key: string, width?: number, height?: number, skipPool?: boolean);

        baseTexture: PIXI.BaseTexture;
        buffer: ArrayBuffer;
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
        ctx: CanvasRenderingContext2D;
        data: Uint8Array;
        dirty: boolean;
        disableTextureUpload: boolean;
        game: Phaser.Game;
        height: number;
        imageData: ImageData;
        key: string;
        op: string;
        pixels: Uint32Array;
        smoothed: boolean;
        smoothProperty: string;
        texture: PIXI.Texture;
        textureFrame: Phaser.Frame;
        trail_factor: number;
        type: number;
        width: number;

        static getTransform(translateX: number, translateY: number, scaleX: number, scaleY: number, skewX: number, skewY: number): any;

        add(object: any): Phaser.BitmapData;
        addToWorld(x?: number, y?: number, anchorX?: number, anchorY?: number, scaleX?: number, scaleY?: number): Phaser.Image;
        alphaMask(source: any, mask?: any, sourceRect?: Phaser.Rectangle, maskRect?: Phaser.Rectangle): Phaser.BitmapData;
        blendAdd(): Phaser.BitmapData;
        blendColor(): Phaser.BitmapData;
        blendColorBurn(): Phaser.BitmapData;
        blendColorDodge(): Phaser.BitmapData;
        blendDarken(): Phaser.BitmapData;
        blendDestinationAtop(): Phaser.BitmapData;
        blendDestinationIn(): Phaser.BitmapData;
        blendDestinationOut(): Phaser.BitmapData;
        blendDestinationOver(): Phaser.BitmapData;
        blendDifference(): Phaser.BitmapData;
        blendExclusion(): Phaser.BitmapData;
        blendHardLight(): Phaser.BitmapData;
        blendHue(): Phaser.BitmapData;
        blendLighten(): Phaser.BitmapData;
        blendLuminosity(): Phaser.BitmapData;
        blendMultiply(): Phaser.BitmapData;
        blendOverlay(): Phaser.BitmapData;
        blendReset(): Phaser.BitmapData;
        blendSaturation(): Phaser.BitmapData;
        blendScreen(): Phaser.BitmapData;
        blendSoftLight(): Phaser.BitmapData;
        blendSourceAtop(): Phaser.BitmapData;
        blendSourceIn(): Phaser.BitmapData;
        blendSourceOut(): Phaser.BitmapData;
        blendSourceOver(): Phaser.BitmapData;
        blendXor(): Phaser.BitmapData;
        circle(x: number, y: number, radius: number, fillStyle?: string): Phaser.BitmapData;
        clear(x?: number, y?: number, width?: number, height?: number): Phaser.BitmapData;
        cls(): Phaser.BitmapData;
        copy(source?: any, x?: number, y?: number, width?: number, height?: number, tx?: number, ty?: number, newWidth?: number, newHeight?: number, rotate?: number, anchorX?: number, anchorY?: number, scaleX?: number, scaleY?: number, alpha?: number, blendMode?: string, roundPx?: boolean): Phaser.BitmapData;
        copyPixels(source: any, area: Phaser.Rectangle, x: number, y: number, alpha?: number): void;
        copyRect(source: any, area: Phaser.Rectangle, x?: number, y?: number, alpha?: number, blendMode?: string, roundPx?: boolean): Phaser.BitmapData;
        copyTransform(source: any, blendMode?: string, roundPx?: boolean): Phaser.BitmapData;
        destroy(): void;
        draw(source: any, x?: number, y?: number, width?: number, height?: number, blendMode?: string, roundPx?: boolean): Phaser.BitmapData;
        drawFull(parent: any, blendMode?: string, roundPx?: boolean): Phaser.BitmapData;
        drawGroup(group: Phaser.Group, blendMode?: string, roundPx?: boolean): Phaser.BitmapData;
        extract(destination: Phaser.BitmapData, r: number, g: number, b: number, a?: number, resize?: boolean, r2?: number, g2?: number, b2?: number): Phaser.BitmapData;
        fill(r: number, g: number, b: number, a?: number): Phaser.BitmapData;
        generateTexture(key: string, callback?: (texture: PIXI.Texture) => void, callbackContext?: any): PIXI.Texture;
        getBounds(rect?: Phaser.Rectangle): Phaser.Rectangle;
        getFirstPixel(direction: number): { r: number; g: number; b: number; x: number; y: number; };
        getPixel(x: number, y: number, out?: any): any;
        getPixelRGB(x: number, y: number, out?: any, hsl?: boolean, hsv?: boolean): any;
        getPixel32(x: number, y: number): number;
        getPixels(rect: Phaser.Rectangle): ImageData;
        getTransform(translateX: number, translateY: number, scaleX: number, scaleY: number, skewX: number, skewY: number): any;
        line(x1: number, y1: number, x2: number, y2: number, color?: string, width?: number): Phaser.BitmapData;
        load(source: any): Phaser.BitmapData;
        move(x: number, y: number, wrap?: boolean): Phaser.BitmapData;
        moveH(distance: number, wrap?: boolean): Phaser.BitmapData;
        moveV(distance: number, wrap?: boolean): Phaser.BitmapData;
        polygon(points: any[], fillStyle?: string | CanvasGradient | CanvasPattern, lineWidth?: number, strokeStyle?: string | CanvasGradient | CanvasPattern): Phaser.BitmapData;
        processPixel(callback: (color: number, x: number, y: number) => void, callbackContext?: any, x?: number, y?: Number, width?: number, height?: number): Phaser.BitmapData;
        processPixelRGB(callback: (color: ColorComponents, x: number, y: number) => void, callbackContext?: any, x?: number, y?: Number, width?: number, height?: number): Phaser.BitmapData;
        rect(x: number, y: number, width: number, height: number, fillStyle?: string): Phaser.BitmapData;
        render(): Phaser.BitmapData;
        replaceRGB(r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number, region?: Phaser.Rectangle): Phaser.BitmapData;
        resize(width: number, height: number): Phaser.BitmapData;
        resizeFrame(parent: any, width: number, height: number): void;
        setHSL(h?: number, s?: number, l?: number, region?: Phaser.Rectangle): Phaser.BitmapData;
        setPixel(x: number, y: number, red: number, green: number, blue: number, immediate?: boolean): Phaser.BitmapData;
        setPixel32(x: number, y: number, red: number, green: number, blue: number, alpha: number, immediate?: boolean): Phaser.BitmapData;
        shadow(color: string, blur?: number, x?: number, y?: number): Phaser.BitmapData;
        shiftHSL(h?: number, s?: number, l?: number, region?: Phaser.Rectangle): Phaser.BitmapData;
        text(text: string, x?: number, y?: number, font?: string, color?: string, shadow?: boolean): Phaser.BitmapData;
        textureLine(line: Phaser.Line, key: string, repeat?: string): Phaser.BitmapData;
        update(x?: number, y?: number, width?: number, height?: number): Phaser.BitmapData;
        writeOnCanvas(source: Phaser.Sprite | Phaser.TileSprite, dx: number, dy: number, scaleX: number, scaleY: number, alpha?: number, rotation?: number, blendMode?: string): Phaser.BitmapData;
        copyBitmapData(source: Phaser.BitmapData, x: number, y: number): Phaser.BitmapData;

    }

    class BitmapText extends PIXI.DisplayObjectContainer {

        constructor(game: Phaser.Game, x: number, y: number, font: string, text?: string, size?: number, align?: string);

        align: string;
        alive: boolean;
        anchor: Phaser.Point;
        animations: Phaser.AnimationManager;
        angle: number;
        autoCull: boolean;
        autoRound: boolean;
        body: Phaser.Physics.Arcade.Body | Phaser.Physics.P2.Body | Phaser.Physics.Ninja.Body | any;
        bottom: number;
        cameraOffset: Phaser.Point;
        checkWorldBounds: boolean;
        centerX: number;
        centerY: number;
        data: any;
        destroyPhase: boolean;
        debug: boolean;
        dirty: boolean;
        events: Phaser.Events;
        exists: boolean;
        fixedToCamera: boolean;
        font: string;
        fontSize: number;
        fresh: boolean;
        game: Phaser.Game;
        input: Phaser.InputHandler;
        inputEnabled: boolean;
        inCamera: boolean;
        inWorld: boolean;
        key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture;
        left: number;
        name: string;
        components: any;
        lifespan: number;
        maxWidth: number;
        offsetX: number;
        offsetY: number;
        outOfBoundsKill: boolean;
        pendingDestroy: boolean;
        physicsType: number;
        previousPosition: Phaser.Point;
        previousRotation: number;
        position: Phaser.Point;
        renderOrderID: number;
        right: number;
        text: string;
        smoothed: boolean;
        textWidth: number;
        textHeight: number;
        tint: number | number[];
        top: number;
        type: number;
        world: Phaser.Point;
        x: number;
        y: number;
        z: number;

        alignIn(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        alignTo(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        destroy(destroyChildren?: boolean): void;
        kill(): void;
        postUpdate(): void;
        preUpdate(): void;
        purgeGlyphs(): number;
        reset(x: number, y: number, health?: number): Phaser.BitmapText;
        revive(health?: number): Phaser.BitmapText;
        scanLine(data: any, scale: number, text: string): { width: number; text: string; end: boolean; chars: string[] };
        setText(text: string): void;
        update(): void;
        updateText(): void;
        updateTransform(): void;

    }

    class Bullet extends Phaser.Sprite {

        constructor(game: Phaser.Game, x: number, y: number, key?: any, frame?: any);

        kill(): Phaser.Bullet;
        update(): void;

    }

    class Button extends Phaser.Image {

        constructor(game: Phaser.Game, x?: number, y?: number, key?: string, callback?: Function, callbackContext?: any, overFrame?: string | number, outFrame?: string | number, downFrame?: string | number, upFrame?: string | number);

        forceOut: boolean;
        freezeFrames: boolean;
        onDownSound: Phaser.Sound | Phaser.AudioSprite;
        onDownSoundMarker: string;
        onInputDown: Phaser.Signal;
        onInputOut: Phaser.Signal;
        onInputOver: Phaser.Signal;
        onInputUp: Phaser.Signal;
        onOutSound: Phaser.Sound | Phaser.AudioSprite;
        onOutSoundMarker: string;
        onOverSound: Phaser.Sound | Phaser.AudioSprite;
        onOverSoundMarker: string;
        onOverMouseOnly: boolean;
        onUpSound: Phaser.Sound | Phaser.AudioSprite;
        onUpSoundMaker: string;
        physicsType: number;
        type: number;

        clearFrames(): void;
        setDownSound(sound: Phaser.Sound | Phaser.AudioSprite, marker?: string): void;
        setFrames(overFrame?: string | number, outFrame?: string | number, downFrame?: string | number, upFrame?: string | number): void;
        onInputOverHandler(sprite: Phaser.Button, pointer: Phaser.Pointer): void;
        onInputOutHandler(sprite: Phaser.Button, pointer: Phaser.Pointer): void;
        onInputDownHandler(sprite: Phaser.Button, pointer: Phaser.Pointer): void;
        onInputUpHandler(sprite: Phaser.Button, pointer: Phaser.Pointer, isOver: boolean): void;
        removedFromWorld(): void;
        setOutSound(sound: Phaser.Sound | Phaser.AudioSprite, marker?: string): void;
        setOverSound(sound: Phaser.Sound | Phaser.AudioSprite, marker?: string): void;
        setSounds(overSound?: Phaser.Sound | Phaser.AudioSprite, overMarker?: string, downSound?: Phaser.Sound | Phaser.AudioSprite, downMarker?: string, outSound?: Phaser.Sound | Phaser.AudioSprite, outMarker?: string, upSound?: Phaser.Sound | Phaser.AudioSprite, upMarker?: string): void;
        setState(newState: number): void;
        setUpSound(sound: Phaser.Sound | Phaser.AudioSprite, marker?: string): void;

    }

    class PointerMode {

        static CURSOR: number;
        static CONTACT: number;

    }

    class Cache {

        constructor(game: Phaser.Game);

        static BINARY: number;
        static BITMAPDATA: number;
        static BITMAPFONT: number;
        static CANVAS: number;
        static IMAGE: number;
        static JSON: number;
        static PHYSICS: number;
        static READY_TIMEOUT: number;
        static RENDER_TEXTURE: number;
        static SHADER: number;
        static SOUND: number;
        static SPRITE_SHEET: number;
        static TEXT: number;
        static TEXTURE: number;
        static TEXTURE_ATLAS: number;
        static TILEMAP: number;
        static XML: number;
        static VIDEO: number;

        static DEFAULT: PIXI.Texture;
        static MISSING: PIXI.Texture;

        autoResolveURL: boolean;
        game: Phaser.Game;
        onReady: Phaser.Signal;
        onSoundUnlock: Phaser.Signal;

        addBinary(key: string, binaryData: any): void;
        addBitmapData(key: string, bitmapData: Phaser.BitmapData, frameData?: Phaser.FrameData): Phaser.BitmapData;
        addBitmapFont(key: string, url: string, data: any, atlasData: any, atlasType: string, xSpacing?: number, ySpacing?: number): void;
        addBitmapFontFromAtlas(key: string, atlasKey: string, atlasFrame: string, dataKey: string, dataType?: string, xSpacing?: number, ySpacing?: number): void;
        addCanvas(key: string, canvas: HTMLCanvasElement, context?: CanvasRenderingContext2D): void;
        addDefaultImage(): void;
        addImage(key: string, url: string, data: any): HTMLImageElement;
        addJSON(key: string, urL: string, data: any): void;
        addMissingImage(): void;
        addPhysicsData(key: string, url: string, JSONData: any, format: number): void;
        addRenderTexture(key: string, texture: RenderTexture): void;
        addShader(key: string, url: string, data: any): void;
        addSound(key: string, url: string, data: any, webAudio: boolean, audioTag: boolean): void;
        addSpriteSheet(key: string, url: string, data: any, frameWidth: number, frameHeight: number, frameMax?: number, margin?: number, spacing?: number, skipFrames?: number): void;
        addText(key: string, url: string, data: any): void;
        addTextureAtlas(key: string, url: string, data: any, atlasData: any, format: number): void;
        addTilemap(key: string, url: string, mapData: any, format: number): void;
        addVideo(key: string, url: string, data: any, isBlob?: boolean): void;
        addXML(key: string, url: string, data: any): void;
        checkBinaryKey(key: string): boolean;
        checkBitmapDataKey(key: string): boolean;
        checkBitmapFontKey(key: string): boolean;
        checkCanvasKey(key: string): boolean;
        checkImageKey(key: string): boolean;
        checkJSONKey(key: string): boolean;
        checkKey(cache: number, key: string): boolean;
        checkPhysicsKey(key: string): boolean;
        checkRenderTextureKey(key: string): boolean;
        checkShaderKey(key: string): boolean;
        checkSoundKey(key: string): boolean;
        checkTextKey(key: string): boolean;
        checkTextureKey(key: string): boolean;
        checkTilemapKey(key: string): boolean;
        checkURL(url: string): any;
        checkUrl(url: string): any;
        checkXMLKey(key: string): boolean;
        checkVideoKey(key: string): boolean;
        clearGLTextures(): void;
        decodedSound(key: string, data: any): void;
        destroy(): void;
        getBaseTexture(key: string, cache?: number): PIXI.BaseTexture;
        getBinary(key: string): any;
        getBitmapData(key: string): Phaser.BitmapData;
        getBitmapFont(key: string): Phaser.BitmapFont;
        getCanvas(key: string): HTMLCanvasElement;
        getFrame(key: string, cache?: number): Phaser.Frame;
        getFrameByIndex(key: string, index: number, cache?: number): Phaser.Frame;
        getFrameByName(key: string, name: string, cache?: number): Phaser.Frame;
        getFrameCount(key: string, cache?: number): number;
        getFrameData(key: string, cache?: number): Phaser.FrameData;
        getImage(key: string, full?: boolean): HTMLImageElement;
        getItem(key: string, cache: number, method?: string, property?: string): any;
        getJSON(key: string, clone?: boolean): any;
        getKeys(cache: number): string[];
        getPhysicsData(key: string, object?: string, fixtureKey?: string): any[];
        getRenderTexture(key: string): Phaser.CachedRenderTexture;
        getShader(key: string): string;
        getSound(key: string): Phaser.Sound;
        getSoundData(key: string): any;
        getSpriteSheetKey(key: string): boolean;
        getText(key: string): string;
        getTextKeys(): string[];
        getTexture(key: string): Phaser.RenderTexture;
        getTextureAtlasKey(key: string): boolean;
        getTextureFrame(key: string): Phaser.Frame;
        getTilemap(key: string): any;
        getTilemapData(key: string): any;
        getURL(url: string): any;
        getXML(key: string): any;
        getVideo(key: string): Phaser.Video;
        hasFrameData(key: string, cache?: number): boolean;
        isSoundDecoded(key: string): boolean;
        isSoundReady(key: string): boolean;
        isSpriteSheet(key: string): boolean;
        reloadSound(key: string): void;
        reloadSoundComplete(key: string): void;
        removeBinary(key: string): void;
        removeBitmapData(key: string): void;
        removeBitmapFont(key: string): void;
        removeCanvas(key: string): void;
        removeImage(key: string, destroyBaseTexture?: boolean): void;
        removeJSON(key: string): void;
        removePhysics(key: string): void;
        removeRenderTexture(key: string): void;
        removeShader(key: string): void;
        removeSound(key: string): void;
        removeSpriteSheet(key: string): void;
        removeText(key: string): void;
        removeTextureAtlas(key: string): void;
        removeTilemap(key: string): void;
        removeXML(key: string): void;
        removeVideo(key: string): void;
        setCacheAlias(alias_key: string, reference_key: string, cache: number): any;
        updateFrameData(key: string, frameData: any, cache?: number): void;
        updateSound(key: string, property: string, value: Phaser.Sound): void;

    }

    interface CachedRenderTexture {

        frame: Phaser.Frame;
        texture: Phaser.RenderTexture;

    }

    class Camera {

        constructor(game: Phaser.Game, id: number, x: number, y: number, width: number, height: number);

        static FOLLOW_LOCKON: number;
        static FOLLOW_PLATFORMER: number;
        static FOLLOW_TOPDOWN: number;
        static FOLLOW_TOPDOWN_TIGHT: number;
        static SHAKE_BOTH: number;
        static SHAKE_HORIZONTAL: number;
        static SHAKE_VERTICAL: number;
        static ENABLE_FX: number;
        static FLASH: number;
        static FADE_OUT: number;
        static FADE_IN: number;

        atLimit: { x: boolean; y: boolean; };
        bounds: Phaser.Rectangle;
        deadzone: Phaser.Rectangle;
        displayObject: PIXI.DisplayObject;
        id: number;
        fixedView: Phaser.Rectangle;
        fx: Phaser.Graphics;
        fxType: number;
        game: Phaser.Game;
        height: number;
        lerp: Phaser.Point;
        position: Phaser.Point;
        roundPx: boolean;
        scale: Phaser.Point;
        shakeIntensity: number;
        onFadeComplete: Phaser.Signal;
        onFlashComplete: Phaser.Signal;
        onShakeComplete: Phaser.Signal;
        target: Phaser.Sprite;
        totalInView: number;
        view: Phaser.Rectangle;
        visible: boolean;
        width: number;
        world: Phaser.World;
        x: number;
        y: number;

        checkBounds(): void;
        fade(color?: number, duration?: number, force?: boolean, alpha?: number): boolean;
        flash(color?: number, duration?: number, force?: boolean, alpha?: number): boolean;
        focusOn(displayObject: PIXI.DisplayObject): void;
        focusOnXY(x: number, y: number): void;
        follow(target: Phaser.Sprite, style?: number, lerpX?: number, lerpY?: number): void;
        reset(): void;
        resetFX(): void;
        setBoundsToWorld(): void;
        setPosition(x: number, y: number): void;
        setSize(width: number, height: number): void;
        shake(intensity?: number, duration?: number, force?: boolean, direction?: number, shakeBounds?: boolean): boolean;
        unfollow(): void;
        update(): void;

    }

    class Canvas {

        static addToDOM(canvas: HTMLCanvasElement, parent: HTMLElement, overflowHidden?: boolean): HTMLCanvasElement;
        static create(parent: HTMLDivElement, width?: number, height?: number, id?: string, skipPool?: boolean): HTMLCanvasElement;
        static getSmoothingEnabled(context: CanvasRenderingContext2D): boolean;
        static getSmoothingPrefix(context: CanvasRenderingContext2D): string;
        static removeFromDOM(canvas: HTMLCanvasElement): void;
        static setBackgroundColor(canvas: HTMLCanvasElement, color: string): HTMLCanvasElement;
        static setImageRenderingBicubic(canvas: HTMLCanvasElement): HTMLCanvasElement;
        static setImageRenderingCrisp(canvas: HTMLCanvasElement): HTMLCanvasElement;
        static setSmoothingEnabled(context: CanvasRenderingContext2D, value: boolean): CanvasRenderingContext2D;
        static setTouchAction(canvas: HTMLCanvasElement, value: string): HTMLCanvasElement;
        static setTransform(context: CanvasRenderingContext2D, translateX: number, translateY: number, scaleX: number, scaleY: number, skewX: number, skewY: number): CanvasRenderingContext2D;
        static setUserSelect(canvas: HTMLCanvasElement, value?: string): HTMLCanvasElement;

    }

    export class CanvasPool {

        static create(parent: HTMLElement, width?: number, height?: number): HTMLCanvasElement;
        static getFirst(): HTMLCanvasElement;
        static remove(parent: HTMLElement): void;
        static removeByCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement;
        static getTotal(): number;
        static getFree(): number;
        static length: number;
        static log(): void;

    }

    class Circle {

        constructor(x?: number, y?: number, diameter?: number);

        area: number;
        bottom: number;
        diameter: number;
        empty: boolean;
        left: number;
        radius: number;
        right: number;
        top: number;
        x: number;
        y: number;

        static circumferencePoint(a: Phaser.Circle, angle: number, asDegrees: boolean, out?: Phaser.Point): Phaser.Point;
        static contains(a: Phaser.Circle, x: number, y: number): boolean;
        static equals(a: Phaser.Circle, b: Phaser.Circle): boolean;
        static intersects(a: Phaser.Circle, b: Phaser.Circle): boolean;
        static intersectsRectangle(c: Phaser.Circle, r: Phaser.Rectangle): boolean;

        circumference(): number;
        circumferencePoint(angle: number, asDegrees?: boolean, out?: Phaser.Point): Phaser.Point;
        clone(output?: Phaser.Circle): Phaser.Circle;
        contains(x: number, y: number): boolean;
        copyFrom(source: any): Circle;
        copyTo(dest: any): any;
        distance(dest: any, round?: boolean): number;
        getBounds(): Phaser.Rectangle;
        offset(dx: number, dy: number): Phaser.Circle;
        offsetPoint(point: Phaser.Point): Phaser.Circle;
        random(out?: Phaser.Point): Phaser.Point;
        sample(steps?: number, startAngle?: number, endAngle?: number, asDegrees?: boolean, out?: any[]): any[];
        scale(x: number, y?: number): Phaser.Rectangle;
        setTo(x: number, y: number, diameter: number): Circle;
        toString(): string;

    }

    class Color {

        static AQUA: number;
        static BLACK: number;
        static BLUE: number;
        static GRAY: number;
        static GREEN: number;
        static ORANGE: number;
        static RED: number;
        static VIOLET: number;
        static WHITE: number;
        static YELLOW: number;

        static componentToHex(color: number): string;
        static createColor(r?: number, g?: number, b?: number, a?: number, h?: number, s?: number, l?: number, v?: number): ColorComponents;
        static fromRGBA(rgba: number, out?: ColorComponents): ColorComponents;
        static getAlpha(color: number): number;
        static getAlphaFloat(color: number): number;
        static getBlue(color: number): number;
        static getColor(red: number, green: number, blue: number): number;
        static getColor32(alpha: number, red: number, green: number, blue: number): number;
        static getGreen(color: number): number;
        static getRandomColor(min?: number, max?: number, alpha?: number): number;
        static getRed(color: number): number;
        static getRGB(color: number): RGBColor;
        static getWebRGB(color: number | RGBColor): string;
        static hexToRGBArray(color: number): number[];
        static hexToRGB(h: string): number;
        static hexToColor(hex: string, out?: ColorComponents): ColorComponents;
        static HSLtoRGB(h: number, s: number, l: number, out?: ColorComponents): ColorComponents;
        static HSLColorWheel(s?: number, l?: number): ColorComponents[];
        static HSVtoRGB(h: number, s: number, v: number, out?: ColorComponents): ColorComponents;
        static HSVColorWheel(s?: number, v?: number): ColorComponents[];
        static hueToColor(p: number, q: number, t: number): number;
        static interpolateColor(color1: number, color2: number, steps: number, currentStep: number, alpha?: number, colorSpace?: number): number;
        static interpolateColorWithRGB(color: number, r: number, g: number, b: number, steps: number, currentStep: number): number;
        static interpolateRGB(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, steps: number, currentStep: number): number;
        static linear(color1: number, color2: number, t: number): number;
        static linearInterpolation(colors: number[], t: number): number;
        static packPixel(r: number, g: number, b: number, a: number): number;
        static RGBArrayToHex(rgb: number[]): number;
        static RGBtoHSL(r: number, g: number, b: number, out?: ColorComponents): ColorComponents;
        static RGBtoHSV(r: number, g: number, b: number, out?: ColorComponents): ColorComponents;
        static RGBtoString(r: number, g: number, b: number, a?: number, prefix?: string): string;
        static toRGBA(r: number, g: number, b: number, a: number): number;
        static toABGR(r: number, g: number, b: number, a: number): number;
        static unpackPixel(rgba: number, out?: ColorComponents, hsl?: boolean, hsv?: boolean): ColorComponents;
        static updateColor(out: ColorComponents): ColorComponents;
        static valueToColor(value: string, out?: ColorComponents): ColorComponents;
        static webToColor(web: string, out?: ColorComponents): ColorComponents;
        static blendNormal(a: number): number;
        static blendLighten(a: number, b: number): number;
        static blendDarken(a: number, b: number): number;
        static blendMultiply(a: number, b: number): number;
        static blendAverage(a: number, b: number): number;
        static blendAdd(a: number, b: number): number;
        static blendSubtract(a: number, b: number): number;
        static blendDifference(a: number, b: number): number;
        static blendNegation(a: number, b: number): number;
        static blendScreen(a: number, b: number): number;
        static blendExclusion(a: number, b: number): number;
        static blendOverlay(a: number, b: number): number;
        static blendSoftLight(a: number, b: number): number;
        static blendHardLight(a: number, b: number): number;
        static blendColorDodge(a: number, b: number): number;
        static blendColorBurn(a: number, b: number): number;
        static blendLinearDodge(a: number, b: number): number;
        static blendLinearBurn(a: number, b: number): number;
        static blendLinearLight(a: number, b: number): number;
        static blendVividLight(a: number, b: number): number;
        static blendPinLight(a: number, b: number): number;
        static blendHardMix(a: number, b: number): number;
        static blendReflect(a: number, b: number): number;
        static blendGlow(a: number, b: number): number;
        static blendPhoenix(a: number, b: number): number;

    }

    module Component {

        module Core {
            var skipTypeChecks: boolean;
        }
    }

    interface RGBColor {
        r: number;
        g: number;
        b: number;
        a: number;
    }
    interface ColorComponents extends RGBColor {
        h: number;
        s: number;
        v: number;
        l: number;
        color: number;
        color32: number;
        rgba: string;
    }

    class Create {

        constructor(game: Phaser.Game);

        static PALETTE_ARNE: number;
        static PALETTE_JMP: number;
        static PALETTE_CGA: number;
        static PALETTE_C64: number;
        static PALETTE_JAPANESE_MACHINE: number;

        bmd: Phaser.BitmapData;
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        game: Phaser.Game;
        palettes: any;

        copy(dest?: Phaser.BitmapData, x?: number, y?: number, width?: number, height?: number, blendMode?: string, roundPx?: boolean): Phaser.BitmapData;
        grid(key: string, width: number, height: number, cellWidth: number, cellHeight: number, color: string, generateTexture?: boolean, callback?: Function, callbackContext?: any): PIXI.Texture;
        texture(key: string, data: any, pixelWidth?: number, pixelHeight?: number, palette?: number, generateTexture?: boolean, callback?: Function, callbackContext?: any): PIXI.Texture;

    }

    interface CursorKeys {

        up: Phaser.Key;
        down: Phaser.Key;
        left: Phaser.Key;
        right: Phaser.Key;

    }

    class Device {

        static LITTLE_ENDIAN: boolean;
        static onInitialized: Phaser.Signal;

        static checkFullScreenSupport(): void;
        static canPlayAudio(type: string): boolean;
        static canPlayVideo(type: string): boolean;
        static isConsoleOpen(): boolean;
        static isAndroidStockBrowser(): string;
        static whenReady: (callback: Function, context?: any) => void;

        android: boolean;
        arora: boolean;
        audioData: boolean;
        cancelFullScreen: string;
        canHandleAlpha: boolean;
        canUseMultiply: boolean;
        canvas: boolean;
        chrome: boolean;
        chromeOS: boolean;
        chromeVersion: number;
        cocoonJS: boolean;
        cocoonJSApp: boolean;
        cordova: boolean;
        crosswalk: boolean;
        css3D: boolean;
        desktop: boolean;
        deviceReadyAt: number;
        edge: boolean;
        electron: boolean;
        ejecta: boolean;
        epiphany: boolean;
        file: boolean;
        fileSystem: boolean;
        firefox: boolean;
        firefoxVersion: number;
        fullScreen: boolean;
        fullScreenKeyboard: boolean;
        getUserMedia: boolean;
        game: Phaser.Game;
        h264Video: boolean;
        hlsVideo: boolean;
        ie: boolean;
        ieVersion: number;
        iOS: boolean;
        iOSVersion: number;
        initialized: boolean;
        iPad: boolean;
        iPhone: boolean;
        iPhone4: boolean;
        kindle: boolean;
        linux: boolean;
        littleEndian: boolean;
        localStorage: boolean;
        m4a: boolean;
        macOS: boolean;
        midori: boolean;
        mobileSafari: boolean;
        mp3: boolean;
        mp4Video: boolean;
        mspointer: boolean;
        node: boolean;
        nodeWebkit: boolean;
        ogg: boolean;
        oggVideo: number;
        opera: boolean;
        opus: boolean;
        pixelRatio: number;
        pointerLock: boolean;
        quirksMode: boolean;
        requestFullScreen: string;
        safari: boolean;
        silk: boolean;
        support32bit: boolean;
        touch: boolean;
        trident: boolean;
        tridentVersion: number;
        typedArray: boolean;
        vibration: boolean;
        vita: boolean;
        wav: boolean;
        webApp: boolean;
        webAudio: boolean;
        webGL: boolean;
        webm: boolean;
        webmVideo: boolean;
        windows: boolean;
        windowsPhone: boolean;
        wheelEvent: string;
        worker: boolean;
        wp9Video: boolean;

    }

    class DeviceButton {

        constructor(parent: Phaser.Pointer | Phaser.SinglePad, butonCode: number);

        buttonCode: number;
        game: Phaser.Game;
        isDown: boolean;
        isUp: boolean;
        onDown: Phaser.Signal;
        onFloat: Phaser.Signal;
        onUp: Phaser.Signal;
        pad: Phaser.Gamepad;
        repeats: number;
        timeDown: number;
        timeUp: number;
        value: number;

        destroy(): void;
        justPressed(duration?: number): boolean;
        justReleased(duration?: number): boolean;
        processButtonDown(value: number): void;
        processButtonFloat(value: number): void;
        processButtonUp(value: number): void;
        reset(): void;

    }

    module Easing {

        var Default: Function;
        var Power0: Function;
        var Power1: Function;
        var power2: Function;
        var power3: Function;
        var power4: Function;

        class Back {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Bounce {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Circular {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Cubic {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Elastic {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Exponential {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Linear {
            static None(k: number): number;
        }

        class Quadratic {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Quartic {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Quintic {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

        class Sinusoidal {
            static In(k: number): number;
            static Out(k: number): number;
            static InOut(k: number): number;
        }

    }

    class Ellipse {

        constructor(x?: number, y?: number, width?: number, height?: number);

        bottom: number;
        centerX: number;
        centerY: number;
        empty: boolean;
        height: number;
        left: number;
        right: number;
        top: number;
        type: number;
        width: number;
        x: number;
        y: number;

        static constains(a: Phaser.Ellipse, x: number, y: number): boolean;

        clone(output?: Phaser.Ellipse): Phaser.Ellipse;
        contains(x: number, y: number): boolean;
        copyFrom(source: any): Phaser.Ellipse;
        copyTo(dest: any): any;
        getBounds(): Phaser.Rectangle;
        random(out?: Phaser.Point): Phaser.Point;
        setTo(x: number, y: number, width: number, height: number): Phaser.Ellipse;
        toString(): string;

    }

    class Events {

        constructor(sprite: Phaser.Sprite);

        parent: Phaser.Sprite;
        onAddedToGroup: Phaser.Signal;
        onRemovedFromGroup: Phaser.Signal;
        onRemovedFromWorld: Phaser.Signal;
        onKilled: Phaser.Signal;
        onRevived: Phaser.Signal;
        onOutOfBounds: Phaser.Signal;
        onEnterBounds: Phaser.Signal;
        onInputOver: Phaser.Signal;
        onInputOut: Phaser.Signal;
        onInputDown: Phaser.Signal;
        onInputUp: Phaser.Signal;
        onDestroy: Phaser.Signal;
        onDragStart: Phaser.Signal;
        onDragStop: Phaser.Signal;
        onDragUpdate: Phaser.Signal;
        onAnimationStart: Phaser.Signal;
        onAnimationComplete: Phaser.Signal;
        onAnimationLoop: Phaser.Signal;

        destroy(): void;

    }

    class Filter extends PIXI.AbstractFilter {

        constructor(game: Phaser.Game, uniforms: any, fragmentSrc: string | string[]);

        dirty: boolean;
        game: Phaser.Game;
        height: number;
        fragmentSrc: string | string[];
        padding: number;
        prevPoint: Phaser.Point;
        type: number;
        uniforms: any;
        width: number;

        addToWorld(x?: number, y?: number, width?: number, height?: number, anchorX?: number, anchorY?: number): Phaser.Image;
        apply(frameBuffer: WebGLFramebuffer): void;
        destroy(): void;
        init(...args: any[]): void;
        setResolution(width: number, height: number): void;
        syncUniforms(): void;
        update(pointer?: Phaser.Pointer): void;

    }

    module Filter {

        class Outline extends Phaser.Filter {
            texture_width: number;
            texture_height: number;
            r: number;
            g: number;
            b: number;
            keep_transparent: boolean;
        }

        class Gray extends Phaser.Filter {
            intensity: number;
        }

        class Hue extends Phaser.Filter {
            angle: number;
        }

        class Tint extends Phaser.Filter {
            r: number;
            g: number;
            b: number;
        }

        class ColorBlend extends Phaser.Filter {
            r: number;
            g: number;
            b: number;
            fake_blend: boolean;
        }

        class Flame extends Phaser.Filter { }

        class Watery extends Phaser.Filter { }

        class Levels extends Phaser.Filter {
            min_input: number;
            max_input: number;
            gamma: number;
        }

        class Colorize extends Phaser.Filter {
            intensity: number;
            color: number;
        }

        class Mode7 extends Phaser.Filter {
            angle: number;
            inclination: number;
            lookY: number;
            lookX: number;
            scale: number;
            distance: number;
        }

        class PixelShift extends Phaser.Filter {
            x_shift: number;
            y_shift: number;
            frame_width: number;
            frame_height: number;
            repeat_texture: boolean;
        }

        class BinarySerpents extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number, march?: number, maxDistance?: number);

            fog: number;

        }

        class BlurX extends Phaser.Filter {

            blur: number;

        }

        class BlurY extends Phaser.Filter {

            blur: number;

        }

        class CausticLight extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number, divisor?: number);

            init(width: number, height: number, divisor?: number): void;

        }

        class CheckerWave extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number);

            alpha: number;
            cameraX: number;
            cameraY: number;
            cameraZ: number;

            init(width: number, height: number): void;
            setColor1(red: number, green: number, blue: number): void;
            setColor2(red: number, green: number, blue: number): void;

        }

        class ColorBars extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number);

            alpha: number;

            init(width: number, height: number): void;

        }

        class Fire extends Phaser.Filter {

            constructor(width: number, height: number, alpha?: number, shift?: number);

            alpha: number;
            shift: number;
            speed: number;

            init(width: number, height: number, alpha?: number, shift?: number): void;

        }

        class HueRotate extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number, texture: any);

            alpha: number;

            init(width: number, height: number, texture: any): void;

        }

        class LazerBeam extends Phaser.Filter {

            init(width: number, height: number, divisor?: number): void;

        }

        class LightBeam extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number);

            alpha: number;
            blue: number;
            green: number;
            red: number;
            thickness: number;
            speed: number;

            init(width: number, height: number): void;

        }

        class Marble extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number, speed?: number, intensity?: number);

            alpha: number;
            intensity: number;
            speed: number;

            init(width: number, height: number, speed?: number, intensity?: number): void;

        }

        class Pixelate extends Phaser.Filter {

            size: number;
            sizeX: number;
            sizeY: number;

        }

        class Plasma extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number, alpha?: number, size?: number);

            alpha: number;
            blueShift: number;
            greenShift: number;
            redShift: number;
            size: number;

            init(width: number, height: number, alpha?: number, size?: number): void;

        }

        class SampleFilter extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number, divisor?: number);

            init(width: number, height: number, divisor?: number): void;

        }

        class Tunnel extends Phaser.Filter {

            constructor(game: Phaser.Game, width: number, height: number, texture: any);

            alpha: number;
            origin: number;

            init(width: number, height: number, texture: any): void;

        }
    }

    class FlexGrid {

        constructor(manager: Phaser.ScaleManager, width: number, height: number);

        game: Phaser.Game;
        manager: Phaser.ScaleManager;
        width: number;
        height: number;
        boundsCustom: Phaser.Rectangle;
        boundsFluid: Phaser.Rectangle;
        boundsFull: Phaser.Rectangle;
        boundsNone: Phaser.Rectangle;
        customWidth: number;
        customHeight: number;
        customOffsetX: number;
        customOffsetY: number;
        positionCustom: Phaser.Point;
        positionFluid: Phaser.Point;
        positionFull: Phaser.Point;
        positionNone: Phaser.Point;
        scaleCustom: Phaser.Point;
        scaleFluid: Phaser.Point;
        scaleFluidInversed: Phaser.Point;
        scaleFull: Phaser.Point;
        scaleNone: Phaser.Point;
        ratioH: number;
        ratioV: number;
        multiplier: number;

        createCustomLayer(width: number, height: number, children?: PIXI.DisplayObject[], addToWorld?: boolean): Phaser.FlexLayer;
        createFluidLayer(children: PIXI.DisplayObject[]): Phaser.FlexLayer;
        createFullLayer(children: PIXI.DisplayObject[]): Phaser.FlexLayer;
        createFixedLayer(children: PIXI.DisplayObject[]): Phaser.FlexLayer;
        debug(): void;
        fitSprite(sprite: Phaser.Sprite): void;
        onResize(width: number, height: number): void;
        refresh(): void;
        reset(): void;
        setSize(width: number, height: number): void;

    }

    class FlexLayer extends Phaser.Group {

        constructor(manager: Phaser.ScaleManager, position: Phaser.Point, bounds: Phaser.Rectangle, scale: Phaser.Point);

        grid: Phaser.FlexGrid;
        manager: Phaser.ScaleManager;

        bottomLeft: Phaser.Point;
        bottomMiddle: Phaser.Point;
        bottomRight: Phaser.Point;
        bounds: Phaser.Rectangle;
        persist: boolean;
        position: Phaser.Point;
        scale: Phaser.Point;
        topLeft: Phaser.Point;
        topMiddle: Phaser.Point;
        topRight: Phaser.Point;

        debug(): void;
        resize(): void;

    }

    class Frame {

        constructor(index: number, x: number, y: number, width: number, height: number, name: string);

        bottom: number;
        centerX: number;
        centerY: number;
        distance: number;
        height: number;
        index: number;
        name: string;
        right: number;
        rotated: boolean;
        sourceSizeH: number;
        sourceSizeW: number;
        spriteSourceSizeH: number;
        spriteSourceSizeW: number;
        spriteSourceSizeX: number;
        spriteSourceSizeY: number;
        trimmed: boolean;
        uuid: string;
        width: number;
        x: number;
        y: number;

        clone(): Phaser.Frame;
        getRect(out?: Phaser.Rectangle): Phaser.Rectangle;
        setTrim(trimmed: boolean, actualWidth: number, actualHeight: number, destX: number, destY: number, destWidth: number, destHeight: number): void;
        resize(width: number, height: number): void;

    }

    class FrameData {

        total: number;

        addFrame(frame: Frame): Phaser.Frame;
        checkFrameName(name: string): boolean;
        clone(): Phaser.FrameData;
        getFrame(index: number): Phaser.Frame;
        getFrameByName(name: string): Phaser.Frame;
        getFrameIndexes(frames?: number[], useNumericIndex?: boolean, output?: number[]): number[];
        getFrameRange(start: number, end: number, output: Phaser.Frame[]): Phaser.Frame[];
        getFrames(frames?: number[], useNumericIndex?: boolean, output?: Phaser.Frame[]): Phaser.Frame[];

    }

    interface IGameConfig {

        alignH?: boolean;
        alignV?: boolean;
        antialias?: boolean;
        backgroundColor?: number | string;
        canvas?: HTMLCanvasElement;
        canvasId?: string;
        canvasStyle?: string;
        crisp?: boolean;
        disableVisibilityChange?: boolean;
        disableStart?: boolean;
        enableDebug?: boolean;
        failIfMajorPerformanceCaveat?: boolean;
        forceSetTimeOut?: boolean;
        fullScreenScaleMode?: number;
        fullScreenTarget?: HTMLElement;
        height?: number | string;
        keyboard?: boolean;
        maxPointers?: number;
        mouse?: boolean;
        mouseWheel?: boolean;
        mspointer?: boolean;
        multiTexture?: boolean;
        parent?: HTMLElement | string;
        physicsConfig?: any;
        pointerLock?: boolean;
        powerPreference?: string;
        preserveDrawingBuffer?: boolean;
        renderer?: number;
        resolution?: number;
        roundPixels?: boolean;
        scaleH?: number;
        scaleMode?: number;
        scaleV?: number
        seed?: number;
        state?: any;
        touch?: boolean;
        transparent?: boolean;
        trimH?: number;
        trimV?: number;
        width?: number | string;

    }

    interface InputConfig {

        keyboard?: boolean;
        maxPointers?: number;
        mouse?: boolean;
        mouseWheel?: boolean;
        mspointer?: boolean;
        pointerLock?: boolean;
        touch?: boolean;

    }

    class Game {

        constructor(width?: number | string, height?: number | string, renderer?: number, parent?: any, state?: any, transparent?: boolean, antialias?: boolean, physicsConfig?: any);
        constructor(config: IGameConfig);

        add: Phaser.GameObjectFactory;
        antialias: boolean;
        cache: Phaser.Cache;
        camera: Phaser.Camera;
        canvas: HTMLCanvasElement;
        clearBeforeRender: boolean;
        config: IGameConfig;
        context: CanvasRenderingContext2D;
        count: number;
        create: Phaser.Create;
        debug: Phaser.Utils.Debug;
        device: Phaser.Device;
        dropFrames: boolean;
        forceSingleRender: boolean;
        forceSingleUpdate: boolean;
        fpsProblemNotifier: Phaser.Signal;
        height: number;
        id: number;
        input: Phaser.Input;
        isBooted: boolean;
        isRunning: boolean;
        load: Phaser.Loader;
        lockRender: boolean;
        make: Phaser.GameObjectCreator;
        math: Phaser.Math;
        onBlur: Phaser.Signal;
        onBoot: Phaser.Signal;
        onFocus: Phaser.Signal;
        onPause: Phaser.Signal;
        onResume: Phaser.Signal;
        parent: HTMLElement;
        particles: Phaser.Particles;
        paused: boolean;
        pendingDestroy: boolean;
        pendingStep: boolean;
        physics: Phaser.Physics;
        physicsConfig: any;
        plugins: PluginManager;
        powerPreference: string;
        preserveDrawingBuffer: Boolean;
        raf: Phaser.RequestAnimationFrame;
        renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
        renderType: number;
        resolution: number;
        rnd: Phaser.RandomDataGenerator;
        scale: Phaser.ScaleManager;
        scratch: Phaser.BitmapData;
        sound: Phaser.SoundManager;
        stage: Phaser.Stage;
        state: Phaser.StateManager;
        stepCount: number;
        stepping: boolean;
        time: Phaser.Time;
        transparent: boolean;
        tweens: Phaser.TweenManager;
        currentUpdateID: number;
        updatesThisFrame: number;
        width: number;
        world: Phaser.World;

        boot(): void;
        destroy(): void;
        disableStep(): void;
        enableStep(): void;
        focusGain(event: any): void;
        focusLoss(event: any): void;
        gamePaused(event: any): void;
        gameResumed(event: any): void;
        parseConfig(config: any): void;
        removeFromDOM(canvas: HTMLCanvasElement): void;
        setUpRenderer(): void;
        showDebugHeader(): void;
        step(): void;
        update(time: number): void;
        updateLogic(timeStep: number): void;
        updateRender(timeStep: number): void;

    }

    class GameObjectCreator {

        constructor(game: Phaser.Game);

        game: Phaser.Game;
        world: Phaser.World;

        audio(key: string, volume?: number, loop?: boolean, connect?: boolean): Phaser.Sound;
        audioSprite(key: string): Phaser.AudioSprite;
        bitmapData(width?: number, height?: number, key?: string, addToCache?: boolean, skipPool?: boolean): Phaser.BitmapData;
        bitmapText(x: number, y: number, font: string, text?: string, size?: number, align?: string): Phaser.BitmapText;
        button(x?: number, y?: number, key?: string, callback?: Function, callbackContext?: any, overFrame?: any, outFrame?: any, downFrame?: any, upFrame?: any): Phaser.Button;
        emitter(x?: number, y?: number, maxParticles?: number): Phaser.Particles.Arcade.Emitter;
        filter(filter: any, ...args: any[]): Phaser.Filter;
        graphics(x?: number, y?: number): Phaser.Graphics;
        group(parent?: any, name?: string, addToStage?: boolean, enableBody?: boolean, physicsBodyType?: number): Phaser.Group;
        image(x: number, y: number, key?: any, frame?: any): Phaser.Image;
        renderTexture(width?: number, height?: number, key?: any, addToCache?: boolean): Phaser.RenderTexture;
        retroFont(font: string, characterWidth: number, characterHeight: number, chars: string, charsPerRow: number, xSpacing?: number, ySpacing?: number, xOffset?: number, yOffset?: number): Phaser.RetroFont;
        rope(x: number, y: number, key: any, frame?: any, points?: Phaser.Point[]): Phaser.Rope;
        sound(key: string, volume?: number, loop?: boolean, connect?: boolean): Phaser.Sound;
        sprite(x: number, y: number, key?: any, frame?: any): Phaser.Sprite;
        spriteBatch(parent: any, name?: String, addToStage?: boolean): Phaser.SpriteBatch;
        text(x: number, y: number, text?: string, style?: PhaserTextStyle): Phaser.Text;
        tilemap(key: string, tileWidth?: number, tileHeight?: number, width?: number, height?: number): Phaser.Tilemap;
        tileSprite(x: number, y: number, width: number, height: number, key: any, frame: any): Phaser.TileSprite;
        tween(obj: any): Phaser.Tween;

    }

    class GameObjectFactory {

        constructor(game: Phaser.Game);

        game: Phaser.Game;
        world: Phaser.World;

        audio(key: string, volume?: number, loop?: boolean, connect?: boolean): Phaser.Sound;
        audioSprite(key: string): Phaser.AudioSprite;
        bitmapData(width?: number, height?: number, key?: string, addToCache?: boolean, skipPool?: boolean): Phaser.BitmapData;
        bitmapText(x: number, y: number, font: string, text?: string, size?: number, group?: Phaser.Group | Phaser.Stage): Phaser.BitmapText;
        button(x?: number, y?: number, key?: string, callback?: Function, callbackContext?: any, overFrame?: any, outFrame?: any, downFrame?: any, upFrame?: any, group?: Phaser.Group | Phaser.Stage): Phaser.Button;
        emitter(x?: number, y?: number, maxParticles?: number): Phaser.Particles.Arcade.Emitter;
        existing(object: any): any;
        filter(filter: string, ...args: any[]): Phaser.Filter;
        graphics(x?: number, y?: number, group?: Phaser.Group | Phaser.Stage): Phaser.Graphics;
        group(parent?: any, name?: string, addToStage?: boolean, enableBody?: boolean, physicsBodyType?: number): Phaser.Group;
        image(x?: number, y?: number, key?: any, frame?: any, group?: Phaser.Group | Phaser.Stage): Phaser.Image;
        physicsGroup(physicsBodyType?: number, parent?: any, name?: string, addToStage?: boolean): Phaser.Group;
        plugin(plugin: Phaser.Plugin, ...parameter: any[]): Phaser.Plugin;
        renderTexture(width?: number, height?: number, key?: string, addToCache?: boolean): Phaser.RenderTexture;
        retroFont(font: string, characterWidth: number, characterHeight: number, chars: string, charsPerRow: number, xSpacing?: number, ySpacing?: number, xOffset?: number, yOffset?: number): Phaser.RetroFont;
        rope(x?: number, y?: number, key?: any, frame?: any, points?: Phaser.Point[]): Phaser.Rope;
        sound(key: string, volume?: number, loop?: boolean, connect?: boolean): Phaser.Sound;
        sprite(x?: number, y?: number, key?: any, frame?: any, group?: Phaser.Group | Phaser.Stage): Phaser.Sprite;
        spriteBatch(parent: any, name?: string, addToStage?: boolean): Phaser.SpriteBatch;
        text(x?: number, y?: number, text?: string, style?: PhaserTextStyle, group?: Phaser.Group | Phaser.Stage): Phaser.Text;
        tilemap(key?: string, tileWidth?: number, tileHeight?: number, width?: number, height?: number): Phaser.Tilemap;
        tileSprite(x: number, y: number, width: number, height: number, key?: any, frame?: any, group?: Phaser.Group | Phaser.Stage): Phaser.TileSprite;
        tween(obj: any): Phaser.Tween;
        weapon(quantity?: number, key?: any, frame?: any, group?: Phaser.Group, bulletClass?: Phaser.Bullet): Phaser.Weapon;
        video(key?: string, url?: string): Phaser.Video;

    }

    class Gamepad {

        constructor(game: Phaser.Game);

        static BUTTON_0: number;
        static BUTTON_1: number;
        static BUTTON_2: number;
        static BUTTON_3: number;
        static BUTTON_4: number;
        static BUTTON_5: number;
        static BUTTON_6: number;
        static BUTTON_7: number;
        static BUTTON_8: number;
        static BUTTON_9: number;
        static BUTTON_10: number;
        static BUTTON_11: number;
        static BUTTON_12: number;
        static BUTTON_13: number;
        static BUTTON_14: number;
        static BUTTON_15: number;

        static AXIS_0: number;
        static AXIS_1: number;
        static AXIS_2: number;
        static AXIS_3: number;
        static AXIS_4: number;
        static AXIS_5: number;
        static AXIS_6: number;
        static AXIS_7: number;
        static AXIS_8: number;
        static AXIS_9: number;

        static XBOX360_A: number;
        static XBOX360_B: number;
        static XBOX360_X: number;
        static XBOX360_Y: number;
        static XBOX360_LEFT_BUMPER: number;
        static XBOX360_RIGHT_BUMPER: number;
        static XBOX360_LEFT_TRIGGER: number;
        static XBOX360_RIGHT_TRIGGER: number;
        static XBOX360_BACK: number;
        static XBOX360_START: number;
        static XBOX360_STICK_LEFT_BUTTON: number;
        static XBOX360_STICK_RIGHT_BUTTON: number;
        static XBOX360_DPAD_LEFT: number;
        static XBOX360_DPAD_RIGHT: number;
        static XBOX360_DPAD_UP: number;
        static XBOX360_DPAD_DOWN: number;
        static XBOX360_STICK_LEFT_X: number;
        static XBOX360_STICK_LEFT_Y: number;
        static XBOX360_STICK_RIGHT_X: number;
        static XBOX360_STICK_RIGHT_Y: number;

        static PS3XC_X: number;
        static PS3XC_CIRCLE: number;
        static PS3XC_SQUARE: number;
        static PS3XC_TRIANGLE: number;
        static PS3XC_L1: number;
        static PS3XC_R1: number;
        static PS3XC_L2: number;
        static PS3XC_R2: number;
        static PS3XC_SELECT: number;
        static PS3XC_START: number;
        static PS3XC_STICK_LEFT_BUTTON: number;
        static PS3XC_STICK_RIGHT_BUTTON: number;
        static PS3XC_DPAD_UP: number;
        static PS3XC_DPAD_DOWN: number;
        static PS3XC_DPAD_LEFT: number;
        static PS3XC_DPAD_RIGHT: number;
        static PS3XC_STICK_LEFT_X: number;
        static PS3XC_STICK_LEFT_Y: number;
        static PS3XC_STICK_RIGHT_X: number;
        static PS3XC_STICK_RIGHT_Y: number;

        active: boolean;
        callbackContext: any;
        enabled: boolean;
        game: Phaser.Game;
        onAxisCallback: Function;
        onConnectCallback: Function;
        onDisconnectCallback: Function;
        onDownCallback: Function;
        onFloatCallback: Function;
        onUpCallback: Function;
        pad1: Phaser.SinglePad;
        pad2: Phaser.SinglePad;
        pad3: Phaser.SinglePad;
        pad4: Phaser.SinglePad;
        padsConnected: number;
        supported: boolean;

        addCallbacks(context: any, callbacks: any): void;
        isDown(buttonCode: number): boolean;
        justPressed(buttonCode: number, duration?: number): boolean;
        justReleased(buttonCode: number, duration?: number): boolean;
        reset(): void;
        setDeadZones(value: any): void;
        start(): void;
        stop(): void;
        update(): void;

    }

    class Graphics extends PIXI.DisplayObjectContainer {

        constructor(game: Phaser.Game, x?: number, y?: number);

        alive: boolean;
        angle: number;
        animations: Phaser.AnimationManager;
        autoCull: boolean;
        blendMode: Phaser.blendModes;
        body: Phaser.Physics.Arcade.Body | Phaser.Physics.P2.Body | Phaser.Physics.Ninja.Body | any;
        bottom: number;
        boundsPadding: number;
        cameraOffset: Phaser.Point;
        centerX: number;
        centerY: number;
        checkWorldBounds: boolean;
        components: any;
        data: any;
        debug: boolean;
        destroyPhase: boolean;
        events: Phaser.Events;
        exists: boolean;
        fillAlpha: number;
        fixedToCamera: boolean;
        fresh: boolean;
        game: Phaser.Game;
        graphicsData: Phaser.GraphicsData[];
        height: number;
        inCamera: boolean;
        inWorld: boolean;
        input: Phaser.InputHandler;
        inputEnabled: boolean;
        isMask: boolean;
        key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture;
        left: number;
        lifespan: number;
        lineColor: number;
        lineWidth: number;
        name: string;
        offsetX: number;
        offsetY: number;
        outOfBoundsKill: boolean;
        pendingDestroy: boolean;
        physicsType: number;
        position: Phaser.Point;
        previousPosition: Phaser.Point;
        previousRotation: number;
        renderOrderID: number;
        right: number;
        tint: number;
        top: number;
        type: number;
        width: number;
        world: Phaser.Point;
        worldAlpha: number;
        z: number;

        alignIn(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        alignTo(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean): Phaser.Graphics;
        arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): Phaser.Graphics;
        beginFill(color?: number, alpha?: number): Phaser.Graphics;
        bezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number): Phaser.Graphics;
        clear(): Phaser.Graphics;
        destroy(destroyChildren?: boolean): void;
        destroyCachedSprite(): void;
        drawCircle(x: number, y: number, diameter: number): Phaser.Graphics;
        drawEllipse(centerX: number, centerY: number, halfWidth: number, halfHeight: number): Phaser.Graphics;
        drawPolygon(...path: any[]): Phaser.Graphics;
        drawRect(x: number, y: number, width: number, height: number): Phaser.Graphics;
        drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): Phaser.Graphics;
        drawShape(shape: Circle): Phaser.GraphicsData;
        drawShape(shape: Ellipse): Phaser.GraphicsData;
        drawShape(shape: Polygon): Phaser.GraphicsData;
        drawShape(shape: Rectangle): Phaser.GraphicsData;
        drawTriangle(points: Phaser.Point[], cull?: boolean): void;
        drawTriangles(vertices: Phaser.Point[] | number[], indices?: number[], cull?: boolean): void;
        endFill(): Phaser.Graphics;
        generateTexture(resolution?: number, scaleMode?: Phaser.scaleModes, padding?: number): Phaser.RenderTexture;
        kill(): Phaser.Graphics;
        lineStyle(lineWidth?: number, color?: number, alpha?: number): Phaser.Graphics;
        lineTo(x: number, y: number): Phaser.Graphics;
        moveTo(x: number, y: number): Phaser.Graphics;
        postUpdate(): void;
        preUpdate(): void;
        quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): Phaser.Graphics;
        reset(x: number, y: number, health?: number): Phaser.Graphics;
        revive(health?: number): Phaser.Graphics;
        update(): void;

    }

    class GraphicsData {

        constructor(lineWidth?: number, lineColor?: number, lineAlpha?: number, fillColor?: number, fillAlpha?: number, fill?: boolean, shape?: any);

        lineWidth: number;
        lineColor: number;
        lineAlpha: number;
        fillColor: number;
        fillAlpha: number;
        fill: boolean;
        shape: any;
        type: number;

    }

    class Group extends PIXI.DisplayObjectContainer {

        constructor(game: Phaser.Game, parent?: PIXI.DisplayObjectContainer, name?: string, addToStage?: boolean, enableBody?: boolean, physicsBodyType?: number);

        static RETURN_CHILD: number;
        static RETURN_NONE: number;
        static RETURN_TOTAL: number;
        static RETURN_ALL: number;
        static SORT_ASCENDING: number;
        static SORT_DESCENDING: number;

        alpha: number;
        angle: number;
        alive: boolean;
        bottom: number;
        cameraOffset: Phaser.Point;
        centerX: number;
        centerY: number;
        classType: any;
        cursor: any;
        cursorIndex: number;
        data: any;
        enableBody: boolean;
        enableBodyDebug: boolean;
        exists: boolean;
        fixedToCamera: boolean;
        game: Phaser.Game;
        hash: PIXI.DisplayObject[];
        ignoreDestroy: boolean;
        inputEnableChildren: boolean;
        left: number;
        length: number;
        name: string;
        onChildInputDown: Phaser.Signal;
        onChildInputUp: Phaser.Signal;
        onChildInputOver: Phaser.Signal;
        onChildInputOut: Phaser.Signal;
        onDestroy: Phaser.Signal;
        pendingDestroy: boolean;
        physicsBodyType: number;
        physicsType: number;
        physicsSortDirection: number;
        position: Phaser.Point;
        right: number;
        rotation: number;
        scale: Phaser.Point;
        top: number;
        total: number;
        transformCallback: (transformCallbackContext?, wt?, pt?) => void;
        type: number;
        updateOnlyExistingChildren: boolean;
        visible: boolean;
        z: number;

        add(child: any, silent?: boolean, index?: number): any;
        addAll(property: string, amount: number, checkAlive?: boolean, checkVisible?: boolean): void;
        addAt(child: any, index: number, silent?: boolean): any;
        addMultiple(children: any[], silent?: boolean): any[];
        addToHash(child: PIXI.DisplayObject): boolean;
        align(width: number, height: number, cellWidth: number, cellHeight: number, position?: number, offset?: number): boolean;
        alignIn(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): Phaser.Group;
        alignTo(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): Phaser.Group;
        bringToTop(child: any): any;
        callAll(method: string, context: any, ...parameters: any[]): void;
        callAllExists(callback: string, existsValue: boolean, ...parameters: any[]): void;
        callbackFromArray(child: any, callback: Function, length: number): void;
        checkAll(key: string, value: any, checkAlive?: boolean, checkVisible?: boolean, force?: boolean): boolean;
        checkAny(key: string, value: any, checkAlive?: boolean, checkVisible?: boolean): boolean;
        checkProperty(child: any, key: string, value: any, force?: boolean): boolean;
        count(key: string, value: any): number;
        countDead(): number;
        countLiving(): number;
        create(x: number, y: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number, exists?: boolean, index?: number): any;
        createMultiple(quantity: number, key: string | string[], frame?: any | any[], exists?: boolean, callback?: Function, callbackContext?: any): any[];
        customSort(sortHandler: Function, context?: any): void;
        destroy(destroyChildren?: boolean, soft?: boolean): void;
        divideAll(property: string, amount: number, checkAlive?: boolean, checkVisible?: boolean): void;
        forEach(callback: Function, callbackContext?: any, checkExists?: boolean, ...args: any[]): void;
        forEachAlive(callback: Function, callbackContext?: any, ...args: any[]): void;
        forEachDead(callback: Function, callbackContext?: any, ...args: any[]): void;
        forEachExists(callback: Function, callbackContext?: any): void;
        filter(predicate: Function, checkExists?: boolean): ArraySet;
        getAll(property?: string, value?: any, startIndex?: number, endIndex?: number): any[];
        getAt(index: number): PIXI.DisplayObject | number;
        getBottom(): any;
        getByName(name: string): any;
        getClosestTo(object: any, callback?: Function, callbackContext?: any): any;
        getFirst(key: string, value: any): any;
        getFirstAlive(createIfNull?: boolean, x?: number, y?: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number): any;
        getFirstDead(createIfNull?: boolean, x?: number, y?: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number): any;
        getFirstExists(exists: boolean, createIfNull?: boolean, x?: number, y?: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number): any;
        getFurthestFrom(object: any, callback?: Function, callbackContext?: any): any;
        getIndex(child: any): number;
        getRandom(startIndex?: number, length?: number): any;
        getTop(): any;
        hasProperty(child: any, key: string[]): boolean;
        iterate(key: string, value: any, returnType: number, callback?: Function, callbackContext?: any, ...args: any[]): any;
        kill(): void;
        killAll(): void;
        moveAll(group: Phaser.Group, silent?: boolean): Phaser.Group;
        moveDown(child: any): any;
        moveUp(child: any): any;
        multiplyAll(property: string, amount: number, checkAlive: boolean, checkVisible: boolean): void;
        next(): any;
        postUpdate(): void;
        preUpdate(): void;
        previous(): any;
        remove(child: any, destroy?: boolean, silent?: boolean): boolean;
        removeAll(destroy?: boolean, silent?: boolean, destroyTexture?: boolean): void;
        removeBetween(startIndex: number, endIndex?: number, destroy?: boolean, silent?: boolean): void;
        removeFromHash(child: PIXI.DisplayObject): boolean;
        replace(oldChild: any, newChild: any): any;
        resetAll(x?: number, y?: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number, checkExists?: boolean): void;
        resetChild(child: any, x?: number, y?: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number): any;
        resetCursor(index?: number): any;
        reverse(): void;
        revive(): void;
        reviveAll(): void;
        scatter(rect?: Phaser.Rectangle, checkExists?: boolean): void;
        sendToBack(child: any): any;
        set(child: any, key: string[], value: any, operation?: number, force?: boolean): boolean;
        setAll(key: string, value: any, checkAlive?: boolean, checkVisible?: boolean, operation?: number, force?: boolean): void;
        setAllChildren(key: string, value: any, checkAlive?: boolean, checkVisible?: boolean, operation?: number, force?: boolean): void;
        setProperty(child: any, key: string[], value: any, operation?: number, force?: boolean): boolean;
        shuffle(): void;
        sort(key?: string, order?: number): void;
        subAll(property: string, amount: number, checkAlive: boolean, checkVisible: boolean): void;
        swap(child1: any, child2: any): boolean;
        update(): void;
        updateZ(): void;
        xy(index: number, x: number, y: number): void;

    }

    class Image extends PIXI.Sprite {

        constructor(game: Phaser.Game, x: number, y: number, key: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture, frame?: string | number);

        alive: boolean;
        angle: number;
        anchor: Phaser.Point;
        animations: Phaser.AnimationManager;
        autoCull: boolean;
        bottom: number;
        cameraOffset: Phaser.Point;
        centerX: number;
        centerY: number;
        components: any;
        cropRect: Phaser.Rectangle;
        customRender: boolean;
        data: any;
        debug: boolean;
        deltaX: number;
        deltaY: number;
        deltaZ: number;
        destroyPhase: boolean;
        events: Phaser.Events;
        exists: boolean;
        fixedToCamera: boolean;
        frame: string | number;
        frameName: string;
        fresh: boolean;
        game: Phaser.Game;
        inCamera: boolean;
        input: Phaser.InputHandler;
        inputEnabled: boolean;
        inWorld: boolean;
        key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture;
        lifespan: number;
        left: number;
        name: string;
        offsetX: number;
        offsetY: number;
        pendingDestroy: boolean;
        position: Phaser.Point;
        previousPosition: Phaser.Point;
        previousRotation: number;
        renderOrderID: number;
        right: number;
        scale: Phaser.Point;
        scaleMax: Phaser.Point;
        scaleMin: Phaser.Point;
        smoothed: boolean;
        top: number;
        type: number;
        world: Phaser.Point;
        z: number;

        alignIn(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        alignTo(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        bringToTop(): Phaser.Image;
        crop(rect: Phaser.Rectangle, copy?: boolean): void;
        destroy(destroyChildren?: boolean): void;
        kill(): Phaser.Image;
        loadTexture(key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number, stopAnimation?: boolean): void;
        resizeFrame(parent: any, width: number, height: number): void;
        moveDown(): Phaser.Image;
        moveUp(): Phaser.Image;
        overlap(displayObject: Phaser.Sprite | Phaser.Image | Phaser.TileSprite | Phaser.Button | PIXI.DisplayObject): boolean;
        play(name: string, frameRate?: number, loop?: boolean, killOnComplete?: boolean): Phaser.Animation;
        postUpdate(): void;
        preUpdate(): void;
        reset(x: number, y: number, health?: number): Phaser.Image;
        resetFrame(): void;
        revive(health?: number): Phaser.Image;
        sendToBack(): Phaser.Image;
        setFrame(frame: Phaser.Frame): void;
        setScaleMinMax(minX?: number, minY?: number, maxX?: number, maxY?: number): void; // minX: null | number
        update(): void;
        updateCrop(): void;

    }

    class ImageCollection {

        constructor(name: string, firstgid: number, width?: number, height?: number, margin?: number, spacing?: number, properties?: any);

        name: string;
        firstgid: number;
        imageWidth: number;
        imageHeight: number;
        imageMargin: number;
        imageSpacing: number;
        properties: any;
        images: any[];
        total: number;

        addImage(gid: number, image: string): void;
        containsImageIndex(imageIndex: number): boolean;

    }

    class Input {

        constructor(game: Phaser.Game);

        static MAX_POINTERS: number;
        static MOUSE_OVERRIDES_TOUCH: number;
        static MOUSE_TOUCH_COMBINE: number;
        static TOUCH_OVERRIDES_MOUSE: number;

        activePointer: Phaser.Pointer;
        circle: Phaser.Circle;
        enabled: boolean;
        doubleTapRate: number;
        game: Phaser.Game;
        gamepad: Phaser.Gamepad;
        hitCanvas: HTMLCanvasElement;
        hitContext: CanvasRenderingContext2D;
        holdRate: number;
        interactiveItems: Phaser.ArraySet;
        justPressedRate: number;
        justReleasedRate: number;
        keyboard: Phaser.Keyboard;
        maxPointers: number;
        minPriorityID: number;
        mouse: Phaser.Mouse;
        mousePointer: Phaser.Pointer;
        moveCallbacks: (pointer: Phaser.Pointer, x: number, y: number) => void[];
        mspointer: Phaser.MSPointer;
        multiInputOverride: number;
        onDown: Phaser.Signal;
        onHold: Phaser.Signal;
        onTap: Phaser.Signal;
        onUp: Phaser.Signal;
        pointer1: Phaser.Pointer;
        pointer2: Phaser.Pointer;
        pointer3: Phaser.Pointer;
        pointer4: Phaser.Pointer;
        pointer5: Phaser.Pointer;
        pointer6: Phaser.Pointer;
        pointer7: Phaser.Pointer;
        pointer8: Phaser.Pointer;
        pointer9: Phaser.Pointer;
        pointer10: Phaser.Pointer;
        pollLocked: boolean;
        pollRate: number;
        position: Phaser.Point;
        pointers: Phaser.Pointer[];
        recordLimit: number;
        recordPointerHistory: boolean;
        recordRate: number;
        resetLocked: boolean;
        scale: Phaser.Point;
        speed: Phaser.Point;
        tapRate: number;
        totalActivePointers: number;
        totalInactivePointers: number;
        touch: Phaser.Touch;
        worldX: number;
        worldY: number;
        x: number;
        y: number;

        addPointer(): Phaser.Pointer;
        addMoveCallback(callback: Function, context: any): number;
        boot(config: InputConfig): void;
        countActivePointers(limit?: number): number;
        deleteMoveCallback(callback: Function, context?: any): void;
        destroy(): void;
        getLocalPosition(displayObject: any, pointer: Phaser.Pointer): Phaser.Point;
        getPointer(isActive?: boolean): Phaser.Pointer;
        getPointerFromId(pointerID: number): Phaser.Pointer;
        getPointerFromIdentifier(identifier: number): Phaser.Pointer;
        hitTest(displayObject: PIXI.DisplayObject, pointer: Phaser.Pointer, localPoint: Phaser.Point): void;
        reset(hard?: boolean): void;
        resetSpeed(x: number, y: number): void;
        setInteractiveCandidateHandler(callback: Function, context?: any): void;
        startPointer(event: any): Phaser.Pointer;
        stopPointer(event: any): Phaser.Pointer;
        update(): void;
        updatePointer(event: any): Phaser.Pointer;

    }

    class InputHandler {

        constructor(sprite: Phaser.Sprite);

        allowHorizontalDrag: boolean;
        allowVerticalDrag: boolean;
        boundsRect: Phaser.Rectangle;
        boundsSprite: Phaser.Sprite;
        bringToTop: boolean;
        downPoint: Phaser.Point;
        dragDistanceThreshold: number;
        dragOffset: Phaser.Point;
        dragFromCenter: boolean;
        draggable: boolean;
        dragStartPoint: Phaser.Point;
        dragStopBlocksInputUp: boolean;
        dragTimeThreshold: number;
        enabled: boolean;
        game: Phaser.Game;
        globalToLocalX(x: number): number;
        globalToLocalY(y: number): number;
        isDragged: boolean;
        pixelPerfectAlpha: number;
        pixelPerfectClick: boolean;
        pixelPerfectOver: boolean;
        priorityID: number;
        scaleLayer: boolean;
        snapOffset: Phaser.Point;
        snapOffsetX: number;
        snapOffsetY: number;
        snapOnDrag: boolean;
        snapOnRelease: boolean;
        snapPoint: Phaser.Point;
        snapX: number;
        snapY: number;
        sprite: Phaser.Sprite;
        useHandCursor: boolean;

        checkBoundsRect(): void;
        checkBoundsSprite(): void;
        checkPixel(x: number, y: number, pointer?: Phaser.Pointer): boolean;
        checkPointerDown(pointer: Phaser.Pointer, fastTest?: boolean): boolean;
        checkPointerOver(pointer: Phaser.Pointer, fastTest?: boolean): boolean;
        destroy(): void;
        disableDrag(): void;
        disableSnap(): void;
        downDuration(pointerId?: number): number;
        enableDrag(lockCenter?: boolean, bringToTop?: boolean, pixelPerfect?: boolean, alphaThreshold?: number, boundsRect?: Phaser.Rectangle, boundsSprite?: Phaser.Sprite): void;
        enableSnap(snapX: number, snapY: number, onDrag?: boolean, onRelease?: boolean, snapOffsetX?: number, snapOffsetY?: number): void;
        isPixelPerfect(): boolean;
        justOut(pointerId?: number, delay?: number): boolean;
        justOver(pointerId?: number, delay?: number): boolean;
        justPressed(pointerId?: number, delay?: number): boolean;
        justReleased(pointerId?: number, delay?: number): boolean;
        overDuration(pointerId?: number): number;
        pointerDown(pointerId?: number): boolean;
        pointerDragged(pointerId?: number): boolean;
        pointerOut(pointerId?: number): boolean;
        pointerOver(pointerId?: number): boolean;
        pointerTimeDown(pointerId?: number): number;
        pointerTimeOut(pointerId?: number): number;
        pointerTimeOver(pointerId?: number): number;
        pointerTimeUp(pointerId?: number): number;
        pointerUp(pointerId?: number): boolean;
        pointerX(pointerId?: number): number;
        pointerY(pointerId?: number): number;
        reset(): void;
        setDragLock(allowHorizontal?: boolean, allowVertical?: boolean): void;
        start(priority?: number, useHandCursor?: boolean): Phaser.Sprite;
        startDrag(pointer: Phaser.Pointer): void;
        stop(): void;
        stopDrag(pointer: Phaser.Pointer): void;
        update(pointer: Phaser.Pointer): void;
        updateDrag(pointer: Phaser.Pointer): boolean;
        validForInput(highestID: number, highestRenderID: number, includePixelPerfect?: boolean): boolean;

    }

    class Key {

        constructor(game: Phaser.Game, keycode: number);

        altKey: boolean;
        ctrlKey: boolean;
        duration: number;
        enabled: boolean;
        event: any;
        game: Phaser.Game;
        isDown: boolean;
        isUp: boolean;
        _justDown: boolean;
        justDown: boolean;
        _justUp: boolean;
        justUp: boolean;
        keyCode: number;
        onDown: Phaser.Signal;
        onHoldCallback: Function;
        onHoldContext: any;
        onUp: Phaser.Signal;
        repeats: number;
        shiftKey: boolean;
        timeDown: number;
        timeUp: number;

        downDuration(duration?: number): boolean;
        processKeyDown(event: KeyboardEvent): void;
        processKeyUp(event: KeyboardEvent): void;
        reset(hard?: boolean): void;
        update(): void;
        upDuration(duration?: number): boolean;

    }

    class Keyboard {

        constructor(game: Phaser.Game);

        static A: number;
        static B: number;
        static C: number;
        static D: number;
        static E: number;
        static F: number;
        static G: number;
        static H: number;
        static I: number;
        static J: number;
        static K: number;
        static L: number;
        static M: number;
        static N: number;
        static O: number;
        static P: number;
        static Q: number;
        static R: number;
        static S: number;
        static T: number;
        static U: number;
        static V: number;
        static W: number;
        static X: number;
        static Y: number;
        static Z: number;
        static ZERO: number;
        static ONE: number;
        static TWO: number;
        static THREE: number;
        static FOUR: number;
        static FIVE: number;
        static SIX: number;
        static SEVEN: number;
        static EIGHT: number;
        static NINE: number;
        static NUMPAD_0: number;
        static NUMPAD_1: number;
        static NUMPAD_2: number;
        static NUMPAD_3: number;
        static NUMPAD_4: number;
        static NUMPAD_5: number;
        static NUMPAD_6: number;
        static NUMPAD_7: number;
        static NUMPAD_8: number;
        static NUMPAD_9: number;
        static NUMPAD_MULTIPLY: number;
        static NUMPAD_ADD: number;
        static NUMPAD_ENTER: number;
        static NUMPAD_SUBTRACT: number;
        static NUMPAD_DECIMAL: number;
        static NUMPAD_DIVIDE: number;
        static F1: number;
        static F2: number;
        static F3: number;
        static F4: number;
        static F5: number;
        static F6: number;
        static F7: number;
        static F8: number;
        static F9: number;
        static F10: number;
        static F11: number;
        static F12: number;
        static F13: number;
        static F14: number;
        static F15: number;
        static COLON: number;
        static EQUALS: number;
        static COMMA: number;
        static UNDERSCORE: number;
        static PERIOD: number;
        static QUESTION_MARK: number;
        static TILDE: number;
        static OPEN_BRACKET: number;
        static BACKWARD_SLASH: number;
        static CLOSED_BRACKET: number;
        static QUOTES: number;
        static BACKSPACE: number;
        static TAB: number;
        static CLEAR: number;
        static ENTER: number;
        static SHIFT: number;
        static CONTROL: number;
        static ALT: number;
        static CAPS_LOCK: number;
        static ESC: number;
        static SPACEBAR: number;
        static PAGE_UP: number;
        static PAGE_DOWN: number;
        static END: number;
        static HOME: number;
        static LEFT: number;
        static UP: number;
        static RIGHT: number;
        static DOWN: number;
        static INSERT: number;
        static DELETE: number;
        static HELP: number;
        static NUM_LOCK: number;
        static PLUS: number;
        static MINUS: number;

        active: boolean;
        callbackContext: any;
        enabled: boolean;
        event: any;
        game: Phaser.Game;
        lastChar: string;
        lastKey: Phaser.Key;
        onDownCallback: Function;
        onPressCallback: Function;
        onUpCallback: Function;
        pressEvent: any;

        addCallbacks(context: any, onDown?: Function, onUp?: Function, onPress?: Function): void;
        addKey(keycode: number): Phaser.Key;
        addKeys(keys: any): any;
        addKeyCapture(keycode: any): void;
        createCursorKeys(): Phaser.CursorKeys;
        clearCaptures(): void;
        destroy(): void;
        downDuration(keycode: number, duration?: number): boolean;
        isDown(keycode: number): boolean;
        processKeyDown(event: KeyboardEvent): void;
        processKeyPress(event: KeyboardEvent): void;
        processKeyUp(event: KeyboardEvent): void;
        removeCallbacks(): void;
        removeKey(keycode: number): void;
        removeKeyCapture(keycode: number): void;
        reset(hard?: boolean): void;
        start(): void;
        stop(): void;
        update(): void;
        upDuration(keycode: number, duration?: number): boolean;

    }

    class KeyCode {

        static A: number;
        static B: number;
        static C: number;
        static D: number;
        static E: number;
        static F: number;
        static G: number;
        static H: number;
        static I: number;
        static J: number;
        static K: number;
        static L: number;
        static M: number;
        static N: number;
        static O: number;
        static P: number;
        static Q: number;
        static R: number;
        static S: number;
        static T: number;
        static U: number;
        static V: number;
        static W: number;
        static X: number;
        static Y: number;
        static Z: number;
        static ZERO: number;
        static ONE: number;
        static TWO: number;
        static THREE: number;
        static FOUR: number;
        static FIVE: number;
        static SIX: number;
        static SEVEN: number;
        static EIGHT: number;
        static NINE: number;
        static NUMPAD_0: number;
        static NUMPAD_1: number;
        static NUMPAD_2: number;
        static NUMPAD_3: number;
        static NUMPAD_4: number;
        static NUMPAD_5: number;
        static NUMPAD_6: number;
        static NUMPAD_7: number;
        static NUMPAD_8: number;
        static NUMPAD_9: number;
        static NUMPAD_MULTIPLY: number;
        static NUMPAD_ADD: number;
        static NUMPAD_ENTER: number;
        static NUMPAD_SUBTRACT: number;
        static NUMPAD_DECIMAL: number;
        static NUMPAD_DIVIDE: number;
        static F1: number;
        static F2: number;
        static F3: number;
        static F4: number;
        static F5: number;
        static F6: number;
        static F7: number;
        static F8: number;
        static F9: number;
        static F10: number;
        static F11: number;
        static F12: number;
        static F13: number;
        static F14: number;
        static F15: number;
        static COLON: number;
        static EQUALS: number;
        static COMMA: number;
        static UNDERSCORE: number;
        static PERIOD: number;
        static QUESTION_MARK: number;
        static TILDE: number;
        static OPEN_BRACKET: number;
        static BACKWARD_SLASH: number;
        static CLOSED_BRACKET: number;
        static QUOTES: number;
        static BACKSPACE: number;
        static TAB: number;
        static CLEAR: number;
        static ENTER: number;
        static SHIFT: number;
        static CONTROL: number;
        static ALT: number;
        static CAPS_LOCK: number;
        static ESC: number;
        static SPACEBAR: number;
        static PAGE_UP: number;
        static PAGE_DOWN: number;
        static END: number;
        static HOME: number;
        static LEFT: number;
        static UP: number;
        static RIGHT: number;
        static DOWN: number;
        static INSERT: number;
        static DELETE: number;
        static HELP: number;
        static NUM_LOCK: number;
        static PLUS: number;
        static MINUS: number;

    }

    class Line {

        constructor(x1?: number, y1?: number, x2?: number, y2?: number);

        angle: number;
        end: Phaser.Point;
        height: number;
        left: number;
        length: number;
        normalAngle: number;
        normalX: number;
        normalY: number;
        perpSlope: number;
        right: number;
        slope: number;
        start: Phaser.Point;
        top: number;
        type: number;
        width: number;
        x: number;
        y: number;

        static intersectionWithRectangle(line: Phaser.Line, rect: Phaser.Rectangle, result?: Phaser.Point): Phaser.Point;
        static intersectsPoints(a: Phaser.Point, b: Phaser.Point, e: Phaser.Point, f: Phaser.Point, asSegment?: boolean, result?: Phaser.Point): Phaser.Point;
        static intersects(a: Phaser.Line, b: Phaser.Line, asSegment?: boolean, result?: Phaser.Point): Phaser.Point;
        static intersectsRectangle(line: Phaser.Line, rect: Phaser.Rectangle): boolean;
        static reflect(a: Phaser.Line, b: Phaser.Line): number;

        centerOn(x: number, y: number): Phaser.Line;
        clone(output?: Phaser.Line): Phaser.Line;
        coordinatesOnLine(stepRate: number, results: any[]): any[];
        fromAngle(x: number, y: number, angle: number, length: number): Phaser.Line;
        fromPoints(start: any, end: any): Phaser.Line;
        fromSprite(startSprite: Phaser.Sprite, endSprite: Phaser.Sprite, useCenter?: boolean): Phaser.Line;
        intersects(line: Phaser.Line, asSegment?: boolean, result?: Phaser.Point): Phaser.Point;
        midPoint(out?: Phaser.Point): Phaser.Point;
        pointOnLine(x: number, y: number, epsilon?: number): boolean;
        pointOnSegment(x: number, y: number, epsilon?: number): boolean;
        random(out?: Phaser.Point): Phaser.Point;
        reflect(line: Phaser.Line): number;
        rotate(angle: number, asDegrees?: boolean): Phaser.Line;
        rotateAround(x: number, y: number, angle: number, asDegrees?: boolean): Phaser.Line;
        setTo(x1?: number, y1?: number, x2?: number, y2?: number): Phaser.Line;

    }

    class LinkedList {

        first: any;
        last: any;
        next: any;
        prev: any;
        total: number;

        add(item: any): any;
        callAll(callback: Function): void;
        remove(item: any): void;
        reset(): void;

    }

    class Loader {

        constructor(game: Phaser.Game);

        static PHYSICS_LIME_CORONA_JSON: number;
        static PHYSICS_PHASER_JSON: number;
        static TEXTURE_ATLAS_JSON_ARRAY: number;
        static TEXTURE_ATLAS_JSON_HASH: number;
        static TEXTURE_ATLAS_XML_STARLING: number;
        static TEXTURE_ATLAS_JSON_PYXEL: number;

        baseURL: string;
        cache: Phaser.Cache;
        crossOrigin: boolean | string;
        enableParallel: boolean;
        game: Phaser.Game;
        hasLoaded: boolean;
        headers: any;
        isLoading: boolean;
        maxParallelDownloads: number;
        onBeforeLoadComplete: Phaser.Signal;
        onFileStart: Phaser.Signal;
        onFileComplete: Phaser.Signal;
        onFileError: Phaser.Signal;
        onLoadComplete: Phaser.Signal;
        onLoadStart: Phaser.Signal;
        onPackComplete: Phaser.Signal;
        path: string;
        preloadSprite: any;
        progress: number;
        progressFloat: number;
        resetLocked: boolean;
        useXDomainRequest: boolean;

        asyncComplete(file: any, errorMessage?: string): void;
        addSyncPoint(type: string, key: string): Phaser.Loader;
        addToFileList(type: string, key: string, url?: string, properties?: any, overwrite?: boolean, extension?: string): Phaser.Loader;
        atlas(key: string, textureURL?: string, atlasURL?: string, atlasData?: any, format?: number): Phaser.Loader;
        atlasJSONArray(key: string, textureURL?: string, atlasURL?: string, atlasData?: any): Phaser.Loader;
        atlasJSONHash(key: string, textureURL?: string, atlasURL?: string, atlasData?: any): Phaser.Loader;
        atlasXML(key: string, textureURL?: string, atlasURL?: string, atlasData?: any): Phaser.Loader;
        audio(key: string, urls: string | string[] | any, autoDecode?: boolean): Phaser.Loader;
        audiosprite(key: string, urls: string | string[], jsonURL?: string, jsonData?: string | any, autoDecode?: boolean): Phaser.Loader;
        binary(key: string, url?: string, callback?: Function, callbackContext?: any): Phaser.Loader;
        bitmapFont(key: string, textureURL?: string, atlasURL?: string, atlasData?: any, xSpacing?: number, ySpacing?: number): Phaser.Loader;
        checkKeyExists(type: string, key: string): boolean;
        csvLoadComplete(file: any, xhr: XMLHttpRequest): void;
        fileComplete(file: any, xhr: XMLHttpRequest): void;
        fileError(file: any, xhr: XMLHttpRequest, reason: string): void;
        finishedLoading(abnormal?: boolean): void;
        getAsset(type: string, key: string): any;
        getAssetIndex(type: string, key: string): number;
        getAudioURL(urls: any[]): void;
        image(key: string, url?: string | any, overwrite?: boolean): Phaser.Loader;
        imageFromBitmapData(key: string, bitmapData: Phaser.BitmapData, overwrite?: boolean): Phaser.Loader;
        imageFromGrid(key: string, width: number, height: number, cellWidth: number, cellHeight: number, color?: string): Phaser.Loader;
        imageFromTexture(key: string, data: any, pixelWidth: number, pixelHeight: number, palette?: number): Phaser.Loader;
        images(keys: string[], urls?: string[]): Phaser.Loader;
        json(key: string, url?: string, overwrite?: boolean): Phaser.Loader;
        jsonLoadComplete(file: any, xhr: XMLHttpRequest): void;
        loadAudioTag(file: any): void;
        loadFile(file: any): void;
        loadImageTag(file: any): void;
        pack(key: string, url?: string, data?: any, callbackContext?: any): Phaser.Loader;
        parseXml(data: string): XMLDocument;
        physics(key: string, url?: string, data?: any, format?: string): Phaser.Loader;
        processLoadQueue(): void;
        processPack(pack: any): void;
        removeAll(): void;
        removeFile(type: string, key: string): void;
        replaceInFileList(type: string, key: string, url: string, properties: any): void;
        reset(hard?: boolean, clearEvents?: boolean): void;
        resize(): void;
        script(key: string, url?: String, callback?: Function, callbackContext?: any): Phaser.Loader;
        shader(key: string, url?: String, overwrite?: boolean): Phaser.Loader;
        setPreloadSprite(sprite: Phaser.Sprite | Phaser.Image, direction?: number): void;
        spritesheet(key: string, url: string, frameWidth: number, frameHeight: number, frameMax?: number, margin?: number, spacing?: number, skipFrames?: number): Phaser.Loader;
        start(): void;
        text(key: string, url?: string, overwrite?: boolean): Phaser.Loader;
        texture(key: string, object: any, overwrite?: boolean): Phaser.Loader;
        tilemap(key: string, url?: string, data?: any, format?: number): Phaser.Loader;
        totalLoadedFiles(): number;
        totalLoadedPacks(): number;
        totalQueuedFiles(): number;
        totalQueuedPacks(): number;
        transformUrl(url: string, file?: any): string;
        updateProgress(): void;
        video(key: string, urls: string | string[] | any, loadEvent?: string, asBlob?: boolean): Phaser.Loader;
        withSyncPoint(callback: Function, callbackContext?: any): Phaser.Loader;
        xml(key: string, url?: string, overwrite?: boolean): Phaser.Loader;
        xhrLoad(file: any, url: string, type: string, onload: Function, onerror?: Function): void;
        xmlLoadComplete(file: any, xhr: XMLHttpRequest): void;

    }

    class LoaderParser {

        static bitmapFont(xml: any, baseTexture: PIXI.BaseTexture, xSpacing?: number, ySpacing?: number, frame?: Phaser.Frame, resolution?: number): any;
        static xmlBitmapFont(xml: any, baseTexture: PIXI.BaseTexture, xSpacing?: number, ySpacing?: number, frame?: Phaser.Frame, resolution?: number): any;
        static jsonBitmapFont(json: any, baseTexture: PIXI.BaseTexture, xSpacing?: number, ySpacing?: number, frame?: Phaser.Frame, resolution?: number): any;

    }

    class Matrix {

        a: number;
        b: number;
        c: number;
        d: number;
        tx: number;
        ty: number;
        type: number;

        constructor(a?: number, b?: number, c?: number, d?: number, tx?: number, ty?: number);

        apply(pos: Phaser.Point, newPos?: Phaser.Point): Phaser.Point;
        applyInverse(pos: Phaser.Point, newPos?: Phaser.Point): Phaser.Point;
        clone(output?: Phaser.Matrix): Phaser.Matrix;
        copyFrom(matrix: Phaser.Matrix): Phaser.Matrix;
        copyTo(matrix: Phaser.Matrix): Phaser.Matrix;
        fromArray(array: number[]): Phaser.Matrix;
        setTo(a: number, b: number, c: number, d: number, tx: number, ty: number): Phaser.Matrix;
        toArray(transpose?: boolean, array?: number[]): number[];
        translate(x: number, y: number): Phaser.Matrix;
        scale(x: number, y: number): Phaser.Matrix;
        rotate(angle: number): Phaser.Matrix;
        append(matrix: Phaser.Matrix): Phaser.Matrix;
        identity(): Phaser.Matrix;

    }

    class Math {

        static angleBetween(x1: number, y1: number, x2: number, y2: number): number;
        static angleBetweenPoints(point1: Phaser.Point, point2: Phaser.Point): number;
        static angleBetweenY(x1: number, y1: number, x2: number, y2: number): number;
        static angleBetweenPointsY(point1: Phaser.Point, point2: Phaser.Point): number;
        static average(...numbers: number[]): number;
        static bernstein(n: number, i: number): number;
        static random(min: number, max: number): number;
        static between(min: number, max: number): number;
        static bezierInterpolation(v: number[], k: number): number;
        static catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number;
        static catmullRomInterpolation(v: number[], k: number): number;
        static ceilTo(value: number, place?: number, base?: number): number;
        static clamp(x: number, a: number, b: number): number;
        static clampBottom(x: number, a: number): number;
        static degToRad(degrees: number): number;
        static difference(a: number, b: number): number;
        static distance(x1: number, y1: number, x2: number, y2: number): number;
        static distanceSq(x1: number, y1: number, x2: number, y2: number): number;
        static distancePow(xy: number, y1: number, x2: number, y2: number, pow?: number): number;
        static factorial(value: number): number;
        static floorTo(value: number, place?: number, base?: number): number;
        static fuzzyCeil(val: number, epsilon?: number): number;
        static fuzzyEqual(a: number, b: number, epsilon?: number): boolean;
        static fuzzyLessThan(a: number, b: number, epsilon?: number): boolean;
        static fuzzyFloor(val: number, epsilon?: number): number;
        static fuzzyGreaterThan(a: number, b: number, epsilon?: number): boolean;
        static fuzzyLessThan(a: number, b: number, epsilon?: number): boolean;
        static getShortestAngle(angle1: number, angle2: number): number;
        static getNextPowerOfTwo(value: number): number;
        static HALF_PI: number;
        static isEven(n: number): boolean;
        static isOdd(n: number): boolean;
        static isPowerOfTwo(width: number, height: number): boolean;
        static linear(p0: number, p1: number, t: number): number;
        static linearInterpolation(v: number[], k: number): number;
        static mapLinear(x: number, a1: number, a2: number, b1: number, b2: number): number;
        static max(...numbers: number[]): number;
        static maxAdd(value: number, amount: number, max: number): number;
        static maxProperty(...numbers: number[]): number;
        static min(...numbers: number[]): number;
        static minProperty(...numbers: number[]): number;
        static minSub(value: number, amount: number, min: number): number;
        static normalizeAngle(angle: number, radians?: boolean): number;
        static percent(a: number, b: number, base?: number): number;
        static p2px(v: number): number;
        static PI2: number;
        static radToDeg(radians: number): number;
        static reverseAngle(angleRed: number): number;
        static rotateToAngle(currentAngle: number, targetAngle: number, lerp?: number): number;
        static roundAwayFromZero(value: number): number;
        static roundTo(value: number, place?: number, base?: number): number;
        static shear(n: number): number;
        static sign(x: number): number;
        static sinCosGenerator(length: number, sinAmplitude?: number, cosAmplitude?: number, frequency?: number): { sin: number[]; cos: number[]; };
        static hypot(a: number, b: number): number;
        static smootherstep(x: number, min: number, max: number): number;
        static smoothstep(x: number, min: number, max: number): number;
        static snapTo(input: number, gap: number, start?: number): number;
        static snapToCeil(input: number, gap: number, start?: number): number;
        static snapToFloor(input: number, gap: number, start?: number): number;
        static within(a: number, b: number, tolerance: number): boolean;
        static wrap(value: number, min: number, max: number): number;
        static wrapAngle(angle: number, radians?: boolean): number;
        static wrapValue(value: number, amount: number, max: number): number;

    }

    interface WheelEventProxy {

        bindEvent(event: any): WheelEventProxy;

        type: string;
        deltaMode: number;
        deltaX: number;
        deltaY: number;
        deltaZ: number;

    }

    class Mouse {

        constructor(game: Phaser.Game);

        static NO_BUTTON: number;
        static LEFT_BUTTON: number;
        static MIDDLE_BUTTON: number;
        static RIGHT_BUTTON: number;
        static BACK_BUTTON: number;
        static FORWARD_BUTTON: number;
        static WHEEL_DOWN: number;
        static WHEEL_UP: number;

        button: number;
        callbackContext: any;
        capture: boolean;
        active: boolean;
        enabled: boolean;
        event: MouseEvent;
        game: Phaser.Game;
        input: Phaser.Input;
        locked: boolean;
        mouseDownCallback: (event: MouseEvent) => void;
        mouseOutCallback: (event: MouseEvent) => void;
        mouseOverCallback: (event: MouseEvent) => void;
        mouseUpCallback: (event: MouseEvent) => void;
        mouseWheelCallback: (event: MouseEvent) => void;
        _onMouseDown: (event: MouseEvent) => void;
        _onMouseMove: (event: MouseEvent) => void;
        _onMouseUp: (event: MouseEvent) => void;
        _onMouseOut: (event: MouseEvent) => void;
        _onMouseOver: (event: MouseEvent) => void;
        _onMouseWheel: (event: MouseEvent) => void;
        _wheelEvent: WheelEventProxy;
        pointerLock: Phaser.Signal;
        stopOnGameOut: boolean;
        wheelDelta: number;

        onMouseDown(event: MouseEvent): void;
        onMouseMove(event: MouseEvent): void;
        onMouseOut(event: MouseEvent): void;
        onMouseOver(event: MouseEvent): void;
        onMouseUp(event: MouseEvent): void;
        onMouseUpGlobal(event: MouseEvent): void;
        onMouseWheel(event: MouseEvent): void;
        pointerLockChange(event: MouseEvent): void;
        releasePointerLock(): void;
        requestPointerLock(): void;
        start(): boolean;
        stop(): void;

    }

    class MouseWheel {

        static UP: number;
        static DOWN: number;

        game: Phaser.Game;
        input: Phaser.Input;
        element: HTMLElement;
        preventDefault: boolean
        active: boolean;
        callback: (event: WheelEvent) => void;
        callbackContext: any;
        delta: number;

        start(): boolean;
        stop(): void;

    }

    class MSPointer {

        constructor(game: Phaser.Game);

        button: number;
        capture: boolean;
        active: boolean;
        enabled: boolean;
        callbackContext: any;
        event: PointerEvent;
        game: Phaser.Game;
        input: Phaser.Input;

        onPointerDown: (event: PointerEvent) => void;
        onPointerMove: (event: PointerEvent) => void;
        onPointerUp: (event: PointerEvent) => void;
        mouseDownCallback: (event: PointerEvent) => void;
        mouseMoveCallback: (event: PointerEvent) => void;
        mouseUpCallback: (event: PointerEvent) => void;
        pointerDownCallback: (event: PointerEvent) => void;
        pointerMoveCallback: (event: PointerEvent) => void;
        pointerUpCallback: (event: PointerEvent) => void;

        start(): boolean;
        stop(): void;

    }

    class Particle extends Phaser.Sprite {

        constructor(game: Phaser.Game, x: number, y: number, key?: any, frame?: any);

        fresh: boolean;
        onEmit: () => void;

        reset(x: number, y: number, health?: number): Phaser.Particle;
        setAlphaData(data: any[]): void;
        setScaleData(data: any[]): void;
        update(): void;

    }

    class Particles {

        constructor(game: Phaser.Game);

        emitters: any;
        game: Phaser.Game;
        ID: number;

        add(emitter: Phaser.Particles.Arcade.Emitter): Phaser.Particles.Arcade.Emitter;
        remove(emitter: Phaser.Particles.Arcade.Emitter): void;
        update(): void;

    }

    module Particles {

        module Arcade {

            interface EmitterCount {
                emitted: number;
                failed: number;
                totalEmitted: number;
                totalFailed: number;
            }

            class Emitter extends Phaser.Group {

                constructor(game: Phaser.Game, x?: number, y?: number, maxParticles?: number);

                area: Phaser.Rectangle;
                alphaData: any[];
                autoAlpha: boolean;
                autoScale: boolean;
                angle: number;
                angularDrag: number;
                blendMode: Phaser.blendModes;
                bottom: number;
                bounce: Phaser.Point;
                counts: EmitterCount;
                emitX: number;
                emitY: number;
                exists: boolean;
                frequency: number;
                gravity: Phaser.Point | number;
                group: Phaser.Group;
                height: number;
                left: number;
                lifespan: number;
                lifespanOutput: number;
                maxAngle: number;
                maxParticles: number;
                maxParticleScale: number;
                maxParticleSpeed: Phaser.Point;
                maxRotation: number;
                maxSpeed: number;
                minAngle: number;
                minParticleScale: number;
                minParticleSpeed: Phaser.Point;
                minRotation: number;
                minSpeed: number;
                name: string;
                on: boolean;
                output: number;
                particleAnchor: Phaser.Point;
                particleBringToTop: boolean;
                particleSendToBack: boolean;
                particleClass: any;
                particleDrag: Phaser.Point;
                physicsType: number;
                position: Phaser.Point;
                remainder: number;
                right: number;
                scaleData: any[];
                top: number;
                type: number;
                width: number;
                x: number;
                y: number;

                at(object: any): Phaser.Particles.Arcade.Emitter;
                emitParticle(x?: number, y?: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number): boolean;
                explode(lifespan?: number, quantity?: number): Phaser.Particles.Arcade.Emitter;
                flow(lifespan?: number, frequency?: number, quantity?: number, total?: number, immediate?: boolean): Phaser.Particles.Arcade.Emitter;
                kill(): Phaser.Particles.Arcade.Emitter;
                makeParticles(keys: any, frames?: any, quantity?: number, collide?: boolean, collideWorldBounds?: boolean, particleArguments?: any): Phaser.Particles.Arcade.Emitter;
                reset(x: number, y: number, health?: number): Phaser.Particles;
                setAlpha(min?: number, max?: number, rate?: number, ease?: (k: number) => number, yoyo?: boolean): Phaser.Particles.Arcade.Emitter;
                setAngle(minAngle: number, maxAngle: number, minSpeed?: number, maxSpeed?: number): Phaser.Particles.Arcade.Emitter;
                setGravity(x?: number, y?: number): Phaser.Particles.Arcade.Emitter;
                setRotation(min?: number, max?: number): Phaser.Particles.Arcade.Emitter;
                setScale(minX?: number, maxX?: number, minY?: number, maxY?: number, rate?: number, ease?: (k: number) => number, yoyo?: boolean): Phaser.Particles.Arcade.Emitter;
                setSize(width: number, height: number): Phaser.Particles.Arcade.Emitter;
                setSpeed(minX: number, maxX: number, minY: number, maxY: number): Phaser.Particles.Arcade.Emitter;
                setXSpeed(min: number, max: number): Phaser.Particles.Arcade.Emitter;
                setYSpeed(min: number, max: number): Phaser.Particles.Arcade.Emitter;
                start(explode?: boolean, lifespan?: number, frequency?: number, total?: number, forceQuantity?: boolean): Phaser.Particles.Arcade.Emitter;
                update(): void;
                revive(): Phaser.Particles.Arcade.Emitter;

            }
        }
    }

    class Physics {

        constructor(game: Phaser.Game, config?: any);

        static ARCADE: number;
        static P2JS: number;
        static NINJA: number;
        static BOX2D: number;
        static CHIPMUNK: number;
        static MATTERJS: number;

        arcade: Phaser.Physics.Arcade;
        config: any;
        game: Phaser.Game;
        ninja: Phaser.Physics.Ninja;
        p2: Phaser.Physics.P2;
        box2d: any;

        clear(): void;
        destroy(): void;
        enable(object: any, system?: number, debug?: boolean): void;
        parseConfig(): void;
        preUpdate(): void;
        reset(): void;
        setBoundsToWorld(): void;
        startSystem(system: number): void;
        update(): void;

    }

    export class Video {

        game: Phaser.Game;
        key: string;
        video: HTMLVideoElement;
        baseTexture: PIXI.BaseTexture;
        texture: PIXI.Texture;
        textureFrame: Phaser.Frame;
        type: number;
        disableTextureUpload: boolean;
        dirty: boolean;

        currentTime: number;
        duration: number;
        progress: number;
        mute: boolean;
        paused: boolean;
        volume: number;
        playbackRate: boolean;
        playing: boolean;
        playWhenUnlocked: boolean;
        loop: boolean;
        width: number;
        height: number;
        videoStream: any;
        isStreaming: boolean;
        snapshot: Phaser.BitmapData;
        timeout: number;
        retryLimit: number;
        retry: number;
        retryInterval: number;

        onAccess: Phaser.Signal;
        onError: Phaser.Signal;
        onPlay: Phaser.Signal;
        onComplete: Phaser.Signal;
        onTouchUnlock: Phaser.Signal;
        onUpdate: Phaser.Signal;
        onTimeout: Phaser.Signal;

        touchLocked: boolean;
        complete: () => void;

        constructor(game: Phaser.Game, key?: string, url?: string);

        add(object: Phaser.Sprite | Phaser.Sprite[] | Phaser.Image | Phaser.Image[]): Phaser.Video;
        addToWorld(x?: number, y?: number, anchorX?: number, anchorY?: Number, scaleX?: number, scaleY?: number): Phaser.Image;
        createVideoFromBlob(blob: Blob): Phaser.Video;
        startMediaStream(captureAudio?: boolean | MediaTrackConstraints, width?: number, height?: number, captureVideo?: MediaTrackConstraints): Phaser.Video;
        createVideoFromURL(url: string, autoplay?: boolean, crossOrigin?: string): Phaser.Video;
        changeSource(src: string, autoplay?: boolean): Phaser.Video;
        connectToMediaStram(video: any, stream: any): Phaser.Video;
        destroy(): void;
        play(loop?: boolean, playbackRate?: number): Phaser.Video;
        playHandler(): void;
        render(): void;
        removeVideoElement(): void;
        resizeFrame(parent: any, width: number, height: number): void;
        setTouchLock(): void;
        grab(clear?: boolean, alpha?: number, blendMode?: string): Phaser.BitmapData;
        stop(): void;
        unlock(): boolean;
        updateTexture(event?: any, width?: number, height?: number): void;

    }

    module Physics {

        class Arcade {

            static SORT_NONE: number;
            static LEFT_RIGHT: number;
            static RIGHT_LEFT: number;
            static TOP_BOTTOM: number;
            static BOTTOM_TOP: number;

            constructor(game: Phaser.Game);

            OVERLAP_BIAS: number;
            TILE_BIAS: number;
            bounds: Phaser.Rectangle;
            checkCollision: { up?: boolean; down?: boolean; left?: boolean; right?: boolean; };
            forceX: boolean;
            game: Phaser.Game;
            gravity: Phaser.Point;
            isPaused: boolean;
            quadTree: Phaser.QuadTree;
            maxObjects: number;
            maxLevels: number;
            skipQuadTree: boolean;
            sortDirection: number;

            accelerationFromRotation(rotation: number, speed?: number, point?: Phaser.Point): Phaser.Point;
            accelerateToObject(displayObject: any, destination: any, speed?: number, xSpeedMax?: number, ySpeedMax?: number): number;
            accelerateToPointer(displayObject: any, pointer?: Phaser.Pointer, speed?: number, xSpeedMax?: number, ySpeedMax?: number): number;
            accelerateToXY(displayObject: any, x: number, y: number, speed?: number, xSpeedMax?: number, ySpeedMax?: number): number;
            angleBetween(source: any, target: any, world?: boolean): number;
            angleToPointer(displayObject: any, pointer?: Phaser.Pointer, world?: boolean): number;
            angleToXY(displayObject: any, x: number, y: number, world?: boolean): number;
            closest(source: any, targets: any[], world?: boolean, useCenter?: boolean): any;
            collide(object1: any, object2?: any, collideCallback?: Function, processCallback?: Function, callbackContext?: any): boolean;
            computeVelocity(axis: number, body: Phaser.Physics.Arcade.Body, velocity: number, acceleration: number, drag: number, max?: number): number;
            distanceBetween(source: any, target: any, world?: boolean, useCenter?: boolean): number;
            distanceToPointer(displayObject: any, pointer?: Phaser.Pointer, world?: boolean): number;
            distanceToXY(displayObject: any, x: number, y: number, world?: boolean): number;
            enable(object: any, children?: Boolean): void;
            enableBody(object: any): void;
            farthest(source: any, targets: any[], world?: boolean, useCenter?: boolean): any;
            getObjectsAtLocation(x: number, y: number, group: Phaser.Group, callback?: (callbackArg: any, object: any) => void, callbackContext?: any, callbackArg?: any): Sprite[];
            getOverlapX(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body): number;
            getOverlapY(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body): number;
            intersects(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body): boolean;
            moveToObject(displayObject: any, destination: any, speed?: number, maxTime?: number): number;
            moveToPointer(displayObject: any, speed?: number, pointer?: Phaser.Pointer, maxTime?: number): number;
            moveToXY(displayObject: any, x: number, y: number, speed?: number, maxTime?: number): number;
            overlap(object1: any, object2: any, overlapCallback?: Function, processCallback?: Function, callbackContext?: any): boolean;
            processTileSeparationX(body: Phaser.Physics.Arcade.Body, x: number): boolean;
            processTileSeparationY(body: Phaser.Physics.Arcade.Body, y: number): void;
            setBounds(x: number, y: number, width: number, height: number): void;
            setBoundsToWorld(): void;
            separate(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body, processCallback?: Function, callbackContext?: any, overlapOnly?: boolean): boolean;
            separateX(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body, overlapOnly: boolean): boolean;
            separateY(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body, overlapOnly: boolean): boolean;
            separateTile(i: number, body: Phaser.Physics.Arcade.Body, tile: Phaser.Tile): boolean;
            sort(group: Phaser.Group): void;
            tileCheckX(body: Phaser.Physics.Arcade.Body, tile: Phaser.Tile): number;
            tileCheckY(body: Phaser.Physics.Arcade.Body, tile: Phaser.Tile): number;
            updateMotion(body: Phaser.Physics.Arcade.Body): void;
            velocityFromAngle(angle: number, speed?: number, point?: Phaser.Point): Phaser.Point;
            velocityFromRotation(rotation: number, speed?: number, point?: Phaser.Point): Phaser.Point;

        }

        module Arcade {

            class Body {

                constructor(sprite: Phaser.Sprite);

                acceleration: Phaser.Point;
                allowDrag: boolean;
                allowGravity: boolean;
                allowRotation: boolean;
                angle: number;
                angularAcceleration: number;
                angularDrag: number;
                angularVelocity: number;
                blocked: FaceChoices;
                bottom: number;
                bounce: Phaser.Point;
                center: Phaser.Point;
                checkCollision: FaceChoices;
                collideWorldBounds: boolean;
                customSeparateX: boolean;
                customSeparateY: boolean;
                deltaMax: Phaser.Point;
                dirty: boolean;
                drag: Phaser.Point;
                embedded: boolean;
                enable: boolean;
                facing: number;
                friction: Phaser.Point;
                game: Phaser.Game;
                gravity: Phaser.Point;
                halfWidth: number;
                halfHeight: number;
                height: number;
                immovable: boolean;
                isCircle: boolean;
                isMoving: boolean;
                mass: number;
                maxAngular: number;
                maxVelocity: Phaser.Point;
                moves: boolean;
                movementCallback: any;
                movementCallbackContext: any;
                newVelocity: Phaser.Point;
                offset: Phaser.Point;
                onCollide: Phaser.Signal;
                onMoveComplete: Phaser.Signal;
                onOverlap: Phaser.Signal;
                onWorldBounds: Phaser.Signal;
                overlapX: number;
                overlapY: number;
                phase: number;
                position: Phaser.Point;
                preRotation: number;
                prev: Phaser.Point;
                radius: number;
                right: number;
                rotation: number;
                skipQuadTree: boolean;
                sourceWidth: number;
                sourceHeight: number;
                speed: number;
                sprite: Phaser.Sprite;
                stopVelocityOnCollide: boolean;
                syncBounds: boolean;
                tilePadding: Phaser.Point;
                touching: FaceChoices;
                type: number;
                wasTouching: FaceChoices;
                width: number;
                worldBounce: Phaser.Point;
                velocity: Phaser.Point;
                x: number;
                y: number;

                checkWorldBounds(): void;
                deltaX(): number;
                deltaY(): number;
                deltaZ(): number;
                deltaAbsX(): number;
                deltaAbsY(): number;
                destroy(): void;
                getBounds(obj: any): any;
                hitTest(x: number, y: number): boolean;
                moveFrom(duration: number, speed?: number, direction?: number): boolean;
                moveTo(duration: number, distance: number, direction?: number): boolean;
                onFloor(): boolean;
                onWall(): boolean;
                preUpdate(): void;
                postUpdate(): void;
                render(context: any, body: Phaser.Physics.Arcade.Body, color?: string, filled?: boolean, lineWidth?: number): void;
                renderBodyInfo(debug: Phaser.Utils.Debug, body: Phaser.Physics.Arcade.Body): void;
                reset(x: number, y: number): void;
                setCircle(radius: number, offsetX?: number, offsetY?: number): void;
                setSize(width: number, height: number, offsetX?: number, offsetY?: number): void;
                updateBounds(): boolean;

            }

            class FaceChoices {

                none: boolean;
                up: boolean;
                down: boolean;
                left: boolean;
                right: boolean;

            }
        }

        class Ninja {

            constructor(game: Phaser.Game);

            game: Phaser.Game;
            gravity: number;
            bounds: Phaser.Rectangle;
            maxObjects: number;
            maxLevels: number;
            quadTree: Phaser.QuadTree;
            time: Phaser.Time;

            clearTilemapLayerBodies(map: Phaser.Tilemap, layer: any): void;
            collide(object1: any, object2: any, collideCallback?: Function, processCallback?: Function, callbackContext?: any): boolean;
            convertTilemap(map: Phaser.Tilemap, layer: any, slopeMap: any): Phaser.Physics.Ninja.Tile[];
            enableAABB(object: any, children?: boolean): void;
            enableCircle(object: any, radius: number, children?: boolean): void;
            enableTile(object: any, id: number, children?: boolean): void;
            enable(object: any, type?: number, id?: number, radius?: number, children?: boolean): void;
            enableBody(object: any, type?: number, id?: number, radius?: number): void;
            overlap(object1: any, object2: any, overlapCallback?: Function, processCallback?: Function, callbackContext?: any): boolean;
            separate(body1: Phaser.Physics.Ninja.Body, body2: Phaser.Physics.Ninja.Body, processCallback?: Function, callbackContext?: any, overlapOnly?: boolean): boolean;
            setBounds(x: number, y: number, width: number, height: number): void;
            setBoundsToWorld(): void;
        }

        module Ninja {

            class Body {

                constructor(system: Phaser.Physics.Ninja, sprite: Phaser.Sprite, type?: number, id?: number, radius?: number, x?: number, y?: number, width?: number, height?: number);

                aabb: Phaser.Physics.Ninja.AABB;
                angle: number;
                bottom: number;
                bounce: number;
                checkCollision: Phaser.Physics.Arcade.FaceChoices;
                circle: Phaser.Physics.Ninja.Circle;
                collideWorldBounds: boolean;
                drag: number;
                facing: number;
                friction: number;
                game: Phaser.Game;
                gravityScale: number;
                height: number;
                immovable: boolean;
                maxSpeed: number;
                right: number;
                sprite: Phaser.Sprite;
                system: Phaser.Physics.Ninja;
                tile: Phaser.Physics.Ninja.Tile;
                touching: Phaser.Physics.Arcade.FaceChoices;
                type: number;
                shape: any;
                speed: number;
                velocity: Phaser.Point;
                wasTouching: Phaser.Physics.Arcade.FaceChoices;
                width: number;
                x: number;
                y: number;

                deltaAbsX(): number;
                deltaAbsY(): number;
                deltaX(): number;
                deltaY(): number;
                destroy(): void;
                setZeroVelocity(): void;
                moveTo(speed: number, angle: number): void;
                moveFrom(speed: number, angle: number): void;
                moveLeft(speed: number): void;
                moveRight(speed: number): void;
                moveUp(speed: number): void;
                moveDown(speed: number): void;
                poseUpdate(): void;
                preUpdate(): void;
                render(context: any, body: Phaser.Physics.Ninja.Body, color?: string, filled?: boolean): void;
                reset(): void;

            }

            class AABB {

                constructor(body: Phaser.Physics.Ninja.Body, x: number, y: number, width: number, height: number);

                static COL_NONE: number;
                static COL_AXIS: number;
                static COL_OTHER: number;

                aabbTileProjections: any;
                body: Phaser.Physics.Ninja.Body;
                height: number;
                oldPos: Phaser.Point;
                pos: Phaser.Point;
                system: Phaser.Physics.Ninja;
                width: number;
                velocity: Phaser.Point;
                xw: number;
                yw: number;

                collideWorldBounds(): void;
                collideAABBVsAABB(aabb: Phaser.Physics.Ninja.AABB): boolean;
                collideAABBVsTile(tile: Phaser.Physics.Ninja.Tile): boolean;
                destroy(): void;
                integrate(): void;
                render(context: any, xOffset: number, yOffset: number, color: string, filled: boolean): void;
                reportCollision(px: number, py: number, dx: number, dy: number): void;
                reportCollisionVsWorld(px: number, py: number, dx: number, dy: number, obj: any): void;
                reportCollisionVsBody(px: number, py: number, dx: number, dy: number, obj: any): void;
                resolveTile(x: number, y: number, body: Phaser.Physics.Ninja.AABB, tile: Phaser.Physics.Ninja.Tile): boolean;
                reverse(): void;

            }

            class Circle {

                constructor(body: Phaser.Physics.Ninja.Body, x: number, y: number, radius: number);

                COL_NONE: number;
                COL_AXIS: number;
                COL_OTHER: number;

                body: Phaser.Physics.Ninja.Body;
                circleTileProjections: { [index: number]: ((x: number, y: number, oH: number, oV: number, obj: Phaser.Physics.Ninja.Circle, t: Phaser.Physics.Ninja.Tile) => number); };
                oldPos: Phaser.Point;
                height: number;
                pos: Phaser.Point;
                radius: number;
                system: Phaser.Physics.Ninja;
                type: number;
                velocity: Phaser.Point;
                width: number;
                xw: number;
                yw: number;

                collideCircleVsTile(tile: Phaser.Physics.Ninja.Tile): boolean;
                collideWorldBounds(): void;
                destroy(): void;
                distance(dest: number, round?: boolean): number;
                integrate(): void;
                render(context: any, xOffset: number, yOffset: number, color: string, filled: boolean): void;
                reportCollisionVsWorld(px: number, py: number, dx: number, dy: number, obj: any): void;
                reportCollisionVsBody(px: number, py: number, dx: number, dy: number, obj: any): void;
                resolveCircleTile(x: number, y: number, oH: number, oV: number, obj: Phaser.Physics.Ninja.Circle, t: Phaser.Physics.Ninja.Tile): boolean;

            }

            enum TileType {
                TYPE_EMPTY,
                TYPE_FULL,
                TYPE_45DEG,
                TYPE_CONCAVE,
                TYPE_CONVEX,
                TYPE_22DEGs,
                TYPE_22DEGb,
                TYPE_67DEGs,
                TYPE_67DEGb,
                TYPE_HALF
            }

            class Tile {

                constructor(body: Phaser.Physics.Ninja.Body, x: number, y: number, width: number, height: number, type?: number);

                body: Phaser.Physics.Ninja.Body;
                bottom: number;
                flipped: boolean;
                height: number;
                id: number;
                oldpos: Phaser.Point;
                pos: Phaser.Point;
                right: number;
                rotation: number;
                system: Phaser.Physics.Ninja;
                type: Phaser.Physics.Ninja.TileType;
                velocity: Phaser.Point;
                width: number;
                xw: number;
                yw: number;
                x: number;
                y: number;

                clear(): void;
                collideWorldBounds(): void;
                destroy(): void;
                integrate(): void;
                reportCollisionVsWorld(px: number, py: number, dx: number, dy: number, obj: any): void;
                setType(id: number): number;

            }

        }

        class P2 {

            constructor(game: Phaser.Game, config?: any);

            applyDamping: boolean;
            applyGravity: boolean;
            applySpringForces: boolean;
            boundsCollidesWith: Phaser.Physics.P2.Body[];
            boundsCollisionGroup: Phaser.Physics.P2.CollisionGroup;
            config: any;
            callbackContext: any;
            collisionGroups: Phaser.Physics.P2.CollisionGroup[];
            contactMaterial: Phaser.Physics.P2.ContactMaterial;
            emitImpactEvent: boolean;
            everythingCollisionGroup: Phaser.Physics.P2.CollisionGroup;
            frameRate: number;
            friction: number;
            game: Phaser.Game;
            gravity: Phaser.Physics.P2.InversePointProxy;
            materials: Phaser.Physics.P2.Material[];
            nothingCollisionGroup: Phaser.Physics.P2.CollisionGroup;
            onBodyAdded: Phaser.Signal;
            onBodyRemoved: Phaser.Signal;
            onBeginContact: Phaser.Signal;
            onConstraintAdded: Phaser.Signal;
            onConstraintRemoved: Phaser.Signal;
            onContactMaterialAdded: Phaser.Signal;
            onContactMaterialRemoved: Phaser.Signal;
            onEndContact: Phaser.Signal;
            onSpringAdded: Phaser.Signal;
            onSpringRemoved: Phaser.Signal;
            paused: boolean;
            postBroaddphaseCallback: Function;
            restitution: number;
            solveConstraints: boolean;
            time: any;
            total: number;
            useElapsedTime: boolean;
            walls: {
                left?: Phaser.Physics.P2.Body;
                right?: Phaser.Physics.P2.Body;
                top?: Phaser.Physics.P2.Body;
                bottom?: Phaser.Physics.P2.Body;
            };
            world: p2.World;

            addBody(body: Phaser.Physics.P2.Body): boolean;
            addContactMaterial(material: Phaser.Physics.P2.ContactMaterial): Phaser.Physics.P2.ContactMaterial;
            addConstraint<T>(constraint: T): T;
            addSpring(spring: Phaser.Physics.P2.Spring): Phaser.Physics.P2.Spring;
            beginContactHandler(event: any): void;
            clear(): void;
            clearTilemapLayerBodies(map: Phaser.Tilemap, layer?: any): void;
            convertCollisionObjects(map: Phaser.Tilemap, layer?: any, addToWorld?: boolean): Phaser.Physics.P2.Body[];
            convertTilemap(map: Phaser.Tilemap, layer?: any, addToWorld?: Boolean, optimize?: boolean): Phaser.Physics.P2.Body[];
            createBody(x: number, y: number, mass: number, addToWorld?: boolean, options?: p2.BodyOptions, data?: number[][]): Phaser.Physics.P2.Body;
            createBody(x: number, y: number, mass: number, addToWorld?: boolean, options?: p2.BodyOptions, data?: number[]): Phaser.Physics.P2.Body;
            createCollisionGroup(group?: Phaser.Group): Phaser.Physics.P2.CollisionGroup;
            createCollisionGroup(group?: Phaser.Sprite): Phaser.Physics.P2.CollisionGroup;
            createContactMaterial(materialA: Phaser.Physics.P2.Material, materialB: Phaser.Physics.P2.Material, options?: p2.ContactMaterialOptions): Phaser.Physics.P2.ContactMaterial;
            createDistanceConstraint(bodyA: any, bodyB: any, distance: number, localAnchorA?: number[], localAnchorB?: number[], maxForce?: number): Phaser.Physics.P2.DistanceConstraint;
            createGearConstraint(bodyA: any, bodyB: any, angle?: number, ratio?: number): Phaser.Physics.P2.GearConstraint;
            createLockConstraint(bodyA: any, bodyB: any, offset?: number[], angle?: number, maxForce?: number): Phaser.Physics.P2.LockConstraint;
            createMaterial(name?: string, body?: Phaser.Physics.P2.Body): Phaser.Physics.P2.Material;
            createParticle(x: number, y: number, mass: number, addToWorld?: boolean, options?: p2.BodyOptions, data?: number[][]): Phaser.Physics.P2.Body;
            createParticle(x: number, y: number, mass: number, addToWorld?: boolean, options?: p2.BodyOptions, data?: number[]): Phaser.Physics.P2.Body;
            createPrismaticConstraint(body: any, bodyB: any, lockRotation?: boolean, anchorA?: number[], anchorB?: number[], axis?: Float32Array, maxForce?: number): Phaser.Physics.P2.PrismaticConstraint;
            createRevoluteConstraint(bodyA: any, pivotA: number[], bodyB: any, pivotB: number[], maxForce?: number, worldPivot?: number[]): Phaser.Physics.P2.RevoluteConstraint;
            createRotationalSpring(bodyA: any, bodyB: any, restAngle?: number, stiffness?: number, damping?: number): p2.RotationalSpring;
            createSpring(bodyA: any, bodyB: any, restLength?: number, stiffness?: number, damping?: number, worldA?: number[], worldB?: number[], localA?: number[], localB?: number[]): Phaser.Physics.P2.Spring;
            destroy(): void;
            enable(object: any, debug?: boolean, children?: boolean): void;
            enableBody(object: any, debug: boolean): void;
            endContactHandler(event: any): void;
            getBodies(): Phaser.Physics.P2.Body[];
            getBody(object: any): Phaser.Physics.P2.Body;
            getConstraints(): p2.Constraint[];
            getSprings(): Phaser.Physics.P2.Spring[];
            getContactMaterial(materialA: Phaser.Physics.P2.Material, materialB: Phaser.Physics.P2.Material): Phaser.Physics.P2.ContactMaterial;
            hitTest(worldPoint: Phaser.Point, bodies?: any[], precision?: number, filterStatic?: boolean): Phaser.Physics.P2.Body[];
            mpx(v: number): number;
            mpxi(v: number): number;
            pause(): void;
            preUpdate(): void;
            pxm(v: number): number;
            pxmi(v: number): number;
            removeBody(body: Phaser.Physics.P2.Body): Phaser.Physics.P2.Body;
            removeBodyNextStep(body: Phaser.Physics.P2.Body): void;
            removeConstraint<T>(constraint: T): T;
            removeContactMaterial(material: Phaser.Physics.P2.ContactMaterial): Phaser.Physics.P2.ContactMaterial;
            removeSpring(spring: Phaser.Physics.P2.Spring): Phaser.Physics.P2.Spring;
            reset(): void;
            resume(): void;
            setBounds(x: number, y: number, width: number, height: number, left?: Boolean, right?: boolean, top?: boolean, bottom?: boolean, setCollisionGroup?: boolean): void;
            setBoundsToWorld(left?: boolean, right?: boolean, top?: boolean, bottom?: boolean, setCollisionGroup?: boolean): void;
            setCollisionGroup(object: any, group: Phaser.Physics.P2.CollisionGroup): void;
            setImpactEvents(state: boolean): void;
            setMaterial(material: Phaser.Physics.P2.Material, bodies?: Phaser.Physics.P2.Body[]): void;
            setPostBroadphaseCallback(callback: Function, context: any): void;
            setWorldMaterial(material: Phaser.Physics.P2.Material, left?: boolean, right?: boolean, top?: boolean, bottom?: boolean): void;
            toJSON(): any;
            update(): void;
            updateBoundsCollisionGroup(setCollisionGroup?: boolean): void;

        }

        module P2 {

            class Body {

                static DYNAMIC: number;
                static STATIC: number;
                static KINEMATIC: number;

                constructor(game: Phaser.Game, sprite?: Phaser.Sprite, x?: number, y?: number, mass?: number);

                allowSleep: boolean;
                angle: number;
                angularDamping: number;
                angularForce: number;
                angularVelocity: number;
                collidesWith: Phaser.Physics.P2.CollisionGroup[];
                collideWorldBounds: boolean;
                damping: number;
                data: p2.Body;
                debug: boolean;
                debugBody: Phaser.Physics.P2.BodyDebug;
                dynamic: boolean;
                fixedRotation: boolean;
                force: Phaser.Physics.P2.InversePointProxy;
                kinematic: boolean;
                game: Phaser.Game;
                gravity: Phaser.Point;
                id: number;
                inertia: number;
                mass: number;
                motionState: number;
                offset: Phaser.Point;
                onBeginContact: Phaser.Signal;
                onEndContact: Phaser.Signal;
                rotation: number;
                removeNextStep: boolean;
                sprite: Phaser.Sprite;
                sleepSpeedLimit: number;
                static: boolean;
                type: number;
                velocity: Phaser.Physics.P2.InversePointProxy;
                world: Phaser.Physics.P2;
                x: number;
                y: number;

                addToWorld(): void;
                addCapsule(length: number, radius: number, offsetX?: number, offsetY?: number, rotation?: number): p2.Capsule;
                addCircle(radius: number, offsetX?: number, offsetY?: number, rotation?: number): p2.Circle;
                addFixture(fixtureData: string): p2.Shape[];
                addLine(length: number, offsetX?: number, offsetY?: number, rotation?: number): p2.Line;
                addParticle(offsetX?: number, offsetY?: number, rotation?: number): p2.Particle;
                addPolygon(options: { optimalDecomp?: boolean; skipSimpleCheck?: boolean; removeCollinearPoints?: boolean; remove?: boolean, adjustCenterOfMass?: boolean }, points: number[][]): boolean;
                addPhaserPolygon(key: string, object: string): Phaser.Physics.P2.FixtureList;
                addPlane(offsetX?: number, offsetY?: number, rotation?: number): p2.Plane;
                addRectangle(width: number, height: number, offsetX?: number, offsetY?: number, rotation?: number): p2.Rectangle;
                addShape(shape: p2.Shape, offsetX?: number, offsetY?: number, rotation?: number): p2.Shape;
                adjustCenterOfMass(): void;
                applyDamping(dt: number): void;
                applyForce(force: number[], worldX: number, worldY: number): void;
                applyImpulse(impulse: number[], worldX: number, worldY: number): void;
                applyImpulseLocal(impulse: number[], localX: number, localY: number): void;
                clearCollision(clearGroup?: boolean, cleanMask?: boolean, shape?: p2.Shape): void;
                clearShapes(): void;
                collides(group: any, callback?: Function, callbackContext?: any, shape?: p2.Shape): void;
                createBodyCallback(object: any, callback: Function, callbackContext?: any): void;
                createGroupCallback(group: Phaser.Physics.P2.CollisionGroup, callback: Function, callbackContext?: any): void;
                destroy(): void;
                getCollisionMask(): number;
                getVelocityAtPoint(result: number[], relativePoint: number[]): number[];
                loadPolygon(key: string, object: string, scale?: number): boolean;
                moveBackward(speed: number): void;
                moveDown(speed: number): void;
                moveForward(speed: number): void;
                moveLeft(speed: number): void;
                moveRight(speed: number): void;
                moveUp(speed: number): void;
                preUpdate(): void;
                postUpdate(): void;
                removeCollisionGroup(group: any, clearCallback?: boolean, shape?: p2.Shape): void;
                removeFromWorld(): void;
                removeShape(shape: p2.Shape): boolean;
                reverse(speed: number): void;
                rotateLeft(speed: number): void;
                rotateRight(speed: number): void;
                reset(x: number, y: number, resetDamping?: boolean, resetMass?: boolean): void;
                shapeChanged(): void;
                setCircle(radius: number, offsetX?: number, offsetY?: number, rotation?: number): p2.Circle;
                setCollisionGroup(group: Phaser.Physics.P2.CollisionGroup, shape?: p2.Shape): void;
                setRectangle(width?: number, height?: number, offsetX?: number, offsetY?: number, rotation?: number): p2.Rectangle;
                setRectangleFromSprite(sprite: any): p2.Rectangle;
                setMaterial(material: Phaser.Physics.P2.Material, shape?: p2.Shape): void;
                setZeroDamping(): void;
                setZeroForce(): void;
                setZeroRotation(): void;
                setZeroVelocity(): void;
                toLocalFrame(out: number[], worldPoint: number[]): void;
                thrust(speed: number): void;
                thrustLeft(speed: number): void;
                thrustRight(speed: number): void;
                toWorldFrame(out: number[], localPoint: number[]): void;
                updateCollisionMask(shape?: p2.Shape): void;

            }

            class BodyDebug extends Phaser.Group {

                constructor(game: Phaser.Game, body: Phaser.Physics.P2.Body, settings: { pixelsPerLengthUnit?: number; debugPolygons?: boolean; lineWidth?: number; alpha?: number; });

                body: Phaser.Physics.P2.Body;
                canvas: Phaser.Graphics;
                ppu: number;

                updateSpriteTransform(): void;
                draw(): void;

            }

            class CollisionGroup {

                constructor(bitmask: number);

                mask: number;

            }

            class ContactMaterial extends p2.ContactMaterial {

            }

            class DistanceConstraint extends p2.DistanceConstraint {

                constructor(world: Phaser.Physics.P2, bodyA: Phaser.Physics.P2.Body, bodyB: Phaser.Physics.P2.Body, distance: number, maxForce: number);

                game: Phaser.Game;
                world: Phaser.Physics.P2;

            }

            class FixtureList {

                constructor(list: any[]);

                flatten(array: any[]): any[];
                getFixtures(keys: string): any[];
                getFixtureByKey(key: string): any[];
                getGroup(groupID: number): any[];
                init(): void;
                parse(): void;
                setCategory(bit: number, fictureKey: string): void;
                setMask(bit: number, fixtureKey: string): void;
                setMaterial(material: any, fixtureKey: string): void;
                setSensor(value: boolean, fixtureKey: string): void;

            }

            class GearConstraint extends p2.GearConstraint {

                constructor(world: Phaser.Physics.P2, bodyA: Phaser.Physics.P2.Body, bodyB: Phaser.Physics.P2.Body, angle?: number, ratio?: number);

                game: Phaser.Game;
                world: Phaser.Physics.P2;

            }

            class InversePointProxy {

                constructor(world: Phaser.Physics.P2, destination: any);

                x: number;
                y: number;
                mx: number;
                my: number;

            }

            class LockConstraint extends p2.LockConstraint {

                constructor(world: Phaser.Physics.P2, bodyA: Phaser.Physics.P2.Body, bodyB: Phaser.Physics.P2.Body, offset?: number[], angle?: number, maxForce?: number);

                game: Phaser.Game;
                world: Phaser.Physics.P2;
            }

            class Material extends p2.Material {

                constructor(name: string);

                name: string;

            }

            class PointProxy {

                constructor(world: Phaser.Physics.P2, destination: any);

                x: number;
                y: number;
                mx: number;
                my: number;

            }

            class PrismaticConstraint extends p2.PrismaticConstraint {

                constructor(world: Phaser.Physics.P2, bodyA?: Phaser.Physics.P2.Body, bodyB?: Phaser.Physics.P2.Body, lockRotation?: boolean, anchorA?: number[], anchorB?: number[], axis?: number[], maxForce?: number);

                game: Phaser.Game;
                world: Phaser.Physics.P2;

            }

            class RevoluteConstraint extends p2.RevoluteConstraint {

                constructor(world: Phaser.Physics.P2, bodyA: Phaser.Physics.P2.Body, pivotA: number[], bodyB: Phaser.Physics.P2.Body, pivotB: number[], maxForce?: number);

                game: Phaser.Game;
                world: Phaser.Physics.P2;

            }

            class Spring {

                constructor(world: Phaser.Physics.P2, bodyA: Phaser.Physics.P2.Body, bodyB: Phaser.Physics.P2.Body, restLength?: number, stiffness?: number, damping?: number, worldA?: number[], worldB?: number[], localA?: number[], localB?: number[]);

                data: p2.LinearSpring;
                game: Phaser.Game;
                world: Phaser.Physics.P2;

            }
        }
    }

    class Plugin implements IStateCycle {

        constructor(game: Phaser.Game, parent: Phaser.PluginManager);

        active: boolean;
        game: Phaser.Game;
        hasPostRender: boolean;
        hasPostUpdate: boolean;
        hasPreUpdate: boolean;
        hasRender: boolean;
        hasUpdate: boolean;
        parent: PIXI.DisplayObject;
        visible: boolean;

        destroy(): void;
        postRender(): void;
        preUpdate(): void;
        render(): void;
        update(): void;

    }

    module Plugin {

        class SaveCPU extends Phaser.Plugin {

            renderOnFPS: number;
            renderOnPointerChange: boolean;
            forceRender(): void;
        }

        class AStar extends Phaser.Plugin {

            static VERSION: string;
            static COST_ORTHOGONAL: number;
            static COST_DIAGONAL: number;
            static DISTANCE_MANHATTAN: string;
            static DISTANCE_EUCLIDIAN: string;

            constructor(parent: PIXI.DisplayObject);

            parent: PIXI.DisplayObject;
            version: string;

            findPath(startPoint: Phaser.Point, goalPoint: Phaser.Point): Phaser.Plugin.AStar.AStarPath;
            isWalkable(x: number, y: number): boolean;
            setAStarMap(map: Phaser.Tilemap, layerName: string, tilesetName: string): Phaser.Plugin.AStar;

        }

        module AStar {

            class AStarNode {

                constructor(x: number, y: number, isWalkable: boolean);

                x: number;
                y: number;
                g: number;
                h: number;
                f: number;
                parent: Phaser.Plugin.AStar.AStarNode;
                travelCost: number;
                walkable: boolean;

            }

            interface AStarNodeArray {
                x: number;
                y: number;
            }

            class AStarPath {

                constructor(nodes?: AStarNodeArray[], start?: Phaser.Plugin.AStar.AStarNode, goal?: Phaser.Plugin.AStar.AStarNode);

                nodes: AStarNodeArray[];
                start: Phaser.Plugin.AStar.AStarNode;
                goal: Phaser.Plugin.AStar.AStarNode;
                visited: Phaser.Plugin.AStar.AStarNode[];

            }

        }

        class ColorHarmony extends Phaser.Plugin {

            getAnalogousHarmony(color: number, threshold?: number): any;
            getComplementHarmony(color: number): number;
            getSplitComplementHarmony(color: number, threshold: number): any;
            getTriadicHarmony(color: number): any;

        }

        class CSS3Filters extends Phaser.Plugin {

            constructor(parent: PIXI.DisplayObject);

            blur: number;
            brightness: number;
            contrast: number;
            grayscale: number;
            hueRotate: number;
            invert: number;
            opacity: number;
            saturate: number;
            sepia: number;

        }

        class TilemapWalker extends Phaser.Plugin {

            constructor(game: Phaser.Game, map: Phaser.Tilemap, layer?: any, x?: number, y?: number);

            collides: boolean;
            game: Phaser.Game;
            history: boolean;
            facing: number;
            map: Phaser.Tilemap;
            location: Phaser.Point;
            locationLayer: number;

            checkTile(x: number, y: number): boolean;
            getTileFromLocation(x: number, y: number): Phaser.Tile;
            getTiles(width: number, height: number, center?: boolean): any[];
            getTileBehind(distance?: number): Phaser.Tile;
            getTileBehindLeft(distance?: number): Phaser.Tile;
            getTileBehindRight(distance?: number): Phaser.Tile;
            getTileAhead(distance?: number): Phaser.Tile;
            getTileAheadLeft(distance?: number): Phaser.Tile;
            getTileAheadRight(distance?: number): Phaser.Tile;
            getTileLeft(distance: number): Phaser.Tile;
            getTileRight(distance: number): Phaser.Tile;
            moveForward(): boolean;
            moveBackward(): boolean;
            moveLeft(): boolean;
            moveRight(): boolean;
            putTile(index: number): void;
            setLocation(x: number, y: number, layer?: any): boolean;
            turnLeft(): void;
            turnRight(): void;
            updateLocation(x: number, y: number): boolean;

        }

        class SamplePlugin extends Phaser.Plugin {

            constructor(game: Phaser.Game, parent: PIXI.DisplayObject);

            addSprite(sprite: Phaser.Sprite): void;
            update(): void;

        }

        class VirtualJoystick extends Phaser.Plugin {

            constructor(game: Phaser.Game, parent: any);

            angle: number;
            base: Phaser.Sprite;
            baseBMD: Phaser.BitmapData;
            baseCircle: Phaser.Circle;
            deltaX: number;
            deltaY: number;
            distance: number;
            force: number;
            isDragging: boolean;
            limit: number;
            limitPoint: Phaser.Point;
            location: Phaser.Point;
            nub: Phaser.Sprite;
            nubBMD: Phaser.BitmapData;
            speed: number;
            x: number;
            y: number;

            init(x: number, y: number, diameter?: number, limit?: number): void;
            move(pointer: Phaser.Pointer, x: number, y: number): void;
            render(): void;
            setVelocity(sprite: Phaser.Sprite, minSpeed?: number, maxSpeed?: number): Phaser.Sprite;
            startDrag(): void;
            stopDrag(nub: Phaser.Sprite, pointer: Phaser.Pointer): void;
            update(): void;

        }



        class Webcam extends Phaser.Plugin {

            constructor(game: Phaser.Game, parent: PIXI.DisplayObject);

            active: boolean;
            context: any;
            stream: any;
            video: HTMLVideoElement;

            connectCallback: (stream: any) => void;
            errorCallback: (e: any) => void;
            grab: (context: any, x: number, y: number) => void;
            start(width: number, height: number, context: any): void;
            stop(): void;
            update(): void;
        }

        class Juicy extends Phaser.Plugin {

            constructor(game: Phaser.Game);

            createScreenFlash(color?: string): Phaser.Plugin.Juicy.ScreenFlash;
            createTrail(length?: number, color?: number): Phaser.Plugin.Juicy.Trail;
            overScale(object: Phaser.Sprite, scale?: number, initialScale?: Phaser.Point): void;
            jelly(object: Phaser.Sprite, strength?: number, delay?: number, initialScale?: Phaser.Point): void;
            mouseStretch(object: Phaser.Sprite, strength?: number, initialScale?: Phaser.Point): void;
            update(): void;
            shake(duration?: number, strength?: number): void;
        }

        module Juicy {

            class Trail {

                constructor(game: Phaser.Game, trailLength?: number, color?: number);

                target: Phaser.Sprite;
                trailLength: number;
                trailWidth: number;
                trailScaling: boolean;
                trailColor: number;

                update(): void;
                addSegment(x: number, y: number): void;
                redrawSegments(offsetX: number, offsetY: number): void;

            }

            class ScreenFlash {

                constructor(game: Phaser.Game, color?: string);

                flash(maxAlpha?: number, duration?: number): void;

            }
        }
    }

    interface PluginConstructorOf<T> {
        new(...parameters: any[]): T;
    }

    class PluginManager implements IStateCycle {

        constructor(game: Phaser.Game);

        game: Phaser.Game;
        plugins: Phaser.Plugin[];

        add<T extends Phaser.Plugin>(plugin: PluginConstructorOf<T>, ...parameters: any[]): T;
        destroy(): void;
        postRender(): void;
        postUpdate(): void;
        preUpdate(): void;
        remove(plugin: Phaser.Plugin, destroy?: boolean): void;
        removeAll(): void;
        render(): void;
        update(): void;

    }

    class Point extends PIXI.Point {

        constructor(x?: number, y?: number);

        x: number;
        y: number;
        type: number;

        static add(a: Phaser.Point, b: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static subtract(a: Phaser.Point, b: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static multiply(a: Phaser.Point, b: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static divide(a: Phaser.Point, b: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static equals(a: Phaser.Point, b: Phaser.Point): boolean;
        static equalsXY(a: Phaser.Point, x: number, y: number): boolean;
        static fuzzyEquals(a: Phaser.Point, b: Phaser.Point, epsilon?: number): boolean;
        static fuzzyEqualsXY(a: Phaser.Point, x: number, y: number, epsilon?: number): boolean;
        static angle(a: Phaser.Point, b: Phaser.Point): number;
        static angleSq(a: Phaser.Point, b: Phaser.Point): number;
        static negative(a: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static multiplyAdd(a: Phaser.Point, b: Phaser.Point, scale: number, out?: Phaser.Point): Phaser.Point;
        static interpolate(a: Phaser.Point, b: Phaser.Point, alpha: number, out?: Phaser.Point): Phaser.Point;
        static parse(obj: any, xProp?: string, yProp?: string): Phaser.Point;
        static perp(a: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static rperp(a: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static distance(a: any, b: any, round?: boolean): number;
        static project(a: Phaser.Point, b: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static projectUnit(a: Phaser.Point, b: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static normalRightHand(a: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static normalize(a: Phaser.Point, out?: Phaser.Point): Phaser.Point;
        static rotate(a: Phaser.Point, x: number, y: number, angle: number, asDegrees?: boolean, distance?: number): Phaser.Point;
        static centroid(points: Phaser.Point[], out?: Phaser.Point): Phaser.Point;
        static isPoint(obj: any): boolean;
        static set(obj: any, x: number, y: number): any;
        static sortClockwise(points: any[], center?: Phaser.Point): any[];

        add(x: number, y: number): Phaser.Point;
        angle(a: Phaser.Point, asDegrees?: boolean): number;
        angleSq(a: Phaser.Point): number;
        angleXY(x: number, y: number, asDegrees?: boolean): number;
        atan(asDegrees?: boolean): number;
        ceil(): Phaser.Point;
        clamp(min: number, max: number): Phaser.Point;
        clampX(min: number, max: number): Phaser.Point;
        clampY(min: number, max: number): Phaser.Point;
        clip(rect: any): Phaser.Point;
        clone(output?: Phaser.Point): Phaser.Point;
        copyFrom(source: Phaser.Point): Phaser.Point;
        copyTo<T>(dest: T): T;
        cross(a: Phaser.Point): number;
        distance(dest: Phaser.Point, round?: boolean): number;
        divide(x: number, y: number): Phaser.Point;
        dot(a: Phaser.Point): number;
        equals(a: Phaser.Point): boolean;
        equalsXY(x: number, y: number): boolean;
        expand(min: number): Phaser.Point;
        floor(): Phaser.Point;
        fuzzyEquals(a: Phaser.Point, epsilon?: number): boolean;
        fuzzyEqualsXY(x: number, y: number, epsilon?: number): boolean;
        getMagnitude(): number;
        getMagnitudeSq(): number;
        invert(): Phaser.Point;
        isZero(): boolean;
        limit(max: number): Phaser.Point;
        multiply(x: number, y: number): Phaser.Point;
        normalize(): Phaser.Point;
        normalRightHand(): Phaser.Point;
        perp(): Phaser.Point;
        rotate(x: number, y: number, angle: number, asDegrees?: boolean, distance?: number): Phaser.Point;
        round(): Phaser.Point;
        rperp(): Phaser.Point;
        set(x: number, y?: number): Phaser.Point;
        setMagnitude(magnitude: number): Phaser.Point;
        setTo(x: number, y?: number): Phaser.Point;
        setToPolar(azimuth: number, radius?: number, asDegrees?: boolean): Phaser.Point;
        subtract(x: number, y: number): Phaser.Point;
        toString(): string;

    }

    class Pointer {

        constructor(game: Phaser.Game, id: number, pointerMode?: number);

        static NO_BUTTON: number;
        static LEFT_BUTTON: number;
        static RIGHT_BUTTON: number;
        static MIDDLE_BUTTON: number;
        static BACK_BUTTON: number;
        static FORWARD_BUTTON: number;
        static ERASER_BUTTON: number;

        active: boolean;
        backButton: Phaser.DeviceButton;
        button: any;
        circle: Phaser.Circle;
        clientX: number;
        clientY: number;
        dirty: boolean;
        duration: number;
        eraserButton: Phaser.DeviceButton;
        exists: boolean;
        forceOut: boolean;
        forwardButton: Phaser.DeviceButton;
        game: Phaser.Game;
        justReleasePreventsOver: boolean | number;
        id: number;
        identifier: number;
        interactiveCandidates: Phaser.InputHandler[];
        isDown: boolean;
        isMouse: boolean;
        isUp: boolean;
        leftButton: Phaser.DeviceButton;
        middleButton: Phaser.DeviceButton;
        movementX: number;
        movementY: number;
        msSinceLastClick: number;
        pageX: number;
        pageY: number;
        pointerId: number;
        pointerMode: number;
        position: Phaser.Point;
        positionDown: Phaser.Point;
        positionUp: Phaser.Point;
        previousTapTime: number;
        rawMovementX: number;
        rawMovementY: number;
        rightButton: Phaser.DeviceButton;
        screenX: number;
        screenY: number;
        target: any;
        targetObject: any;
        timeDown: number;
        timeUp: number;
        totalTouches: number;
        type: number;
        withinGame: boolean;
        worldX: number;
        worldY: number;
        x: number;
        y: number;

        addClickTrampoline(name: string, callback: Function, callbackContext?: any, ...callbackArgs: any[]): void;
        justPressed(duration?: number): boolean;
        justReleased(duration?: number): boolean;
        leave(event: any): void;
        move(event: any, fromClick?: boolean): void;
        reset(): void;
        resetButtons(): void;
        resetMovement(): void;
        start(event: any): void;
        stop(event: any): void;
        swapTarget(newTarget: Phaser.InputHandler, silent?: boolean): void;
        update(): void;
        updateButtons(event: MouseEvent): void;

    }

    class PointerLock {

        game: Phaser.Game;
        input: Phaser.Input;
        element: HTMLElement;
        active: boolean;
        locked: boolean;
        onChange: Phaser.Signal;
        onError: Phaser.Signal;

        exit(): void;
        request(): void;
        start(): boolean;
        stop(): void;

    }

    class Polygon {

        constructor(points: Phaser.Point[] | number[]);
        constructor(...points: Phaser.Point[]);
        constructor(...points: number[]);

        area: number;
        flattened: boolean;
        points: number[] | Phaser.Point[];
        type: number;

        clone(output?: Phaser.Polygon): Phaser.Polygon;
        contains(x: number, y: number): boolean;
        flatten(): Phaser.Polygon;
        setTo(points: Phaser.Point[] | number[]): void;
        setTo(...points: Phaser.Point[]): void;
        setTo(...points: number[]): void;
        toNumberArray(output?: number[]): number[];

    }

    class QuadTree {

        constructor(x: number, y: number, width: number, height: number, maxObject?: number, maxLevels?: number, level?: number);

        bounds: {
            x: number;
            y: number;
            width: number;
            height: number;
            subWidth: number;
            subHeight: number;
            right: number;
            bottom: number;
        };
        level: number;
        maxObjects: number;
        maxLevels: number;
        objects: any[];
        nodes: any[];

        clear(): void;
        getIndex(rect: any): number;
        insert(body: any): void;
        populate(group: Phaser.Group): void;
        populateHandler(sprite: Phaser.Sprite): void;
        reset(x: number, y: number, width: number, height: number, maxObject?: number, maxLevels?: number, level?: number): void;
        retrieve(source: any): any[];
        split(): void;

    }

    class RandomDataGenerator {

        constructor(seeds?: any[] | string);

        angle(): number;
        between(min: number, max: number): number;
        frac(): number;
        integer(): number;
        integerInRange(min: number, max: number): number;
        normal(): number;
        pick<T>(ary: T[]): T;
        real(): number;
        realInRange(min: number, max: number): number;
        sign(): number;
        sow(seeds: any[]): void;
        state(state?: string): string;
        timestamp(min: number, max: number): number;
        uuid(): string;
        weightedPick<T>(ary: T[]): T;

    }

    class Rectangle {

        constructor(x?: number, y?: number, width?: number, height?: number);

        bottom: number;
        bottomRight: Phaser.Point;
        bottomLeft: Phaser.Point;
        centerX: number;
        centerY: number;
        empty: boolean;
        halfHeight: number;
        halfWidth: number;
        height: number;
        left: number;
        perimeter: number;
        randomX: number;
        randomY: number;
        right: number;
        top: number;
        topLeft: Phaser.Point;
        topRight: Phaser.Point;
        type: number;
        volume: number;
        width: number;
        x: number;
        y: number;

        static aabb(points: Phaser.Point[], out?: Phaser.Rectangle): Phaser.Rectangle;
        static clone(a: Phaser.Rectangle, output?: Phaser.Rectangle): Phaser.Rectangle;
        static contains(a: Phaser.Rectangle, x: number, y: number): boolean;
        static containsPoint(a: Phaser.Rectangle, point: Phaser.Point): boolean;
        static containsRaw(rx: number, ry: number, rw: number, rh: number, x: number, y: number): boolean;
        static containsRect(a: Phaser.Rectangle, b: Phaser.Rectangle): boolean;
        static createFromBounds(a: any, output?: Phaser.Rectangle): Phaser.Rectangle;
        static equals(a: Phaser.Rectangle, b: Phaser.Rectangle): boolean;
        static inflate(a: Phaser.Rectangle, dx: number, dy: number): Phaser.Rectangle;
        static inflatePoint(a: Phaser.Rectangle, point: Phaser.Point): Phaser.Rectangle;
        static intersection(a: Phaser.Rectangle, b: Phaser.Rectangle, out?: Phaser.Rectangle): Phaser.Rectangle;
        static intersects(a: Phaser.Rectangle, b: Phaser.Rectangle): boolean;
        static intersectsRaw(left: number, right: number, top: number, bottom: number, tolerance: number): boolean;
        static size(a: Phaser.Rectangle, output?: Phaser.Point): Phaser.Point;
        static union(a: Phaser.Rectangle, b: Phaser.Rectangle, out?: Phaser.Rectangle): Phaser.Rectangle;

        ceil(): void;
        ceilAll(): void;
        centerOn(x: number, y: number): Phaser.Rectangle;
        clone(output?: Phaser.Rectangle): Phaser.Rectangle;
        contains(x: number, y: number): boolean;
        containsRect(b: Phaser.Rectangle): boolean;
        copyFrom(source: any): Phaser.Rectangle;
        copyFromBounds(source: any): Phaser.Rectangle;
        copyTo(dest: any): any;
        equals(b: Phaser.Rectangle): boolean;
        floor(): void;
        floorAll(): void;
        getPoint(position: number, out: Phaser.Point): Phaser.Point;
        inflate(dx: number, dy: number): Phaser.Rectangle;
        intersection(b: Phaser.Rectangle, out: Phaser.Rectangle): Phaser.Rectangle;
        intersects(b: Phaser.Rectangle, tolerance: number): boolean;
        intersectsRaw(left: number, right: number, top: number, bottom: number, tolerance: number): boolean;
        offset(dx: number, dy: number): Phaser.Rectangle;
        offsetPoint(point: Phaser.Point): Phaser.Rectangle;
        random(out?: Phaser.Point): Phaser.Point;
        resize(width: number, height: number): Phaser.Rectangle;
        setTo(x: number, y: number, width: number, height: number): Phaser.Rectangle;
        scale(x: number, y?: number): Phaser.Rectangle;
        sides(top?: Phaser.Line, right?: Phaser.Line, bottom?: Phaser.Line, left?: Phaser.Line): Phaser.Line[];
        size(output?: Phaser.Point): Phaser.Point;
        toString(): string;
        union(b: Phaser.Rectangle, out?: Phaser.Rectangle): Phaser.Rectangle;

    }

    class RenderTexture extends PIXI.Texture {

        constructor(game: Phaser.Game, width?: number, height?: number, key?: string, scaleMode?: Phaser.scaleModes, resolution?: number);

        crop: PIXI.Rectangle;
        game: Phaser.Game;
        key: string;
        type: number;

        clear(): void;
        render(displayObject: PIXI.DisplayObject, matrix?: Phaser.Matrix, clear?: boolean): void;
        renderXY(displayObject: PIXI.DisplayObject, x: number, y: number, clear?: boolean): void;
        renderRawXY(displayObject: PIXI.DisplayObject, x: number, y: number, clear?: boolean): void;

    }

    class RequestAnimationFrame {

        constructor(game: Phaser.Game, forceSetTimeOut?: boolean);

        forceSetTimeOut: boolean;
        game: Phaser.Game;
        isRunning: boolean;

        isRAF(): boolean;
        isSetTimeOut(): boolean;
        start(): boolean;
        stop(): void;
        updateRAF(rafTime: number): void;
        updateSetTimeout(time: number): void;

    }

    class RetroFont extends Phaser.RenderTexture {

        constructor(game: Phaser.Game, key: string, characterWidth: number, characterHeight: number, chars: string, charsPerRow?: number, xSpacing?: number, ySpacing?: number, xOffset?: number, yOffset?: number);

        static ALIGN_CENTER: string;
        static ALIGN_LEFT: string;
        static ALIGN_RIGHT: string;
        static TEXT_SET1: string;
        static TEXT_SET2: string;
        static TEXT_SET3: string;
        static TEXT_SET4: string;
        static TEXT_SET5: string;
        static TEXT_SET6: string;
        static TEXT_SET7: string;
        static TEXT_SET8: string;
        static TEXT_SET9: string;
        static TEXT_SET10: string;
        static TEXT_SET11: string;

        align: string;
        autoUpperCase: boolean;
        characterHeight: number;
        characterPerRow: number;
        characterSpacingX: number;
        characterSpacingY: number;
        characterWidth: number;
        customSpacingX: number;
        customSpacingY: number;
        fixedWidth: number;
        fontSet: Image;
        frameData: Phaser.FrameData;
        multiLine: boolean;
        offsetX: number;
        offsetY: number;
        smoothed: boolean;
        stamp: Phaser.Image;
        text: string;

        buildRetroFontText(): void;
        getLongestLine(): number;
        pasteLine(line: string, x: number, y: number, customSpacingX: number): void;
        removeUnsupportedCharacters(stripCR?: boolean): string;
        setFixedWidth(width: number, lineAlignment?: string): void;
        setText(content: string, multiLine?: boolean, characterSpacing?: number, lineSpacing?: number, lineAlignment?: string, allowLowerCase?: boolean): void;
        updateOffset(x?: number, y?: number): void;

    }

    class Rope extends PIXI.Rope {

        constructor(game: Phaser.Game, x: number, y: number, key: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture | Phaser.Video, frame?: string | number, points?: Phaser.Point[]);

        angle: number;
        animations: Phaser.AnimationManager;
        alive: boolean;
        autoCull: boolean;
        body: Phaser.Physics.Arcade.Body | Phaser.Physics.P2.Body | Phaser.Physics.Ninja.Body | any;
        bottom: number;
        cameraOffset: Phaser.Point;
        checkWorldBounds: boolean;
        cropRect: Phaser.Rectangle;
        components: any;
        customRender: boolean;
        debug: boolean;
        deltaX: number;
        deltaY: number;
        deltaZ: number;
        destroyPhase: boolean;
        exists: boolean;
        events: Phaser.Events;
        fixedToCamera: boolean;
        frame: string | number;
        frameName: string;
        fresh: boolean;
        game: Phaser.Game;
        inCamera: boolean;
        input: Phaser.InputHandler;
        inputEnabled: boolean;
        inWorld: boolean;
        left: number;
        lifespan: number;
        key: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture | Phaser.Video;
        name: string;
        offsetX: number;
        offsetY: number;
        outOfBoundsKill: boolean;
        overlap(displayObject: Phaser.Sprite | Phaser.Image | Phaser.TileSprite | Phaser.Button | PIXI.DisplayObject): boolean;
        pendingDestroy: boolean;
        points: Phaser.Point[];
        position: Phaser.Point;
        previousPosition: Phaser.Point;
        previousRotation: number;
        right: number;
        renderOrderID: number;
        segments: Phaser.Rectangle[];
        smoothed: boolean;
        top: number;
        type: number;
        transformCallback: Function;
        transformCallbackContext: any;
        scaleMin: Phaser.Point;
        scaleMax: Phaser.Point;
        updateAnimation: Function;
        world: Phaser.Point;
        x: number;
        y: number;
        z: number;

        bringToTop(): Phaser.Rope;
        checkTransform(wt: Phaser.Matrix): void;
        crop(rect: Phaser.Rectangle, copy?: boolean): void;
        destroy(destroyChildren?: boolean): void;
        kill(): Phaser.Rope;
        loadTexture(key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number, stopAnimation?: boolean): void;
        moveUp(): Phaser.Rope;
        moveDown(): Phaser.Rope;
        play(name: string, frameRate?: number, loop?: boolean, killOnComplete?: boolean): Phaser.Animation;
        preUpdate(): void;
        postUpdate(): void;
        reset(x: number, y: number, health?: number): Phaser.Rope;
        resizeFrame(parent: any, width: number, height: number): void;
        resetFrame(): void;
        revive(health?: number): Phaser.Rope;
        sendToBack(): Phaser.Rope;
        setFrame(frame: Phaser.Frame): void;
        setScaleMinMax(minX?: number, minY?: number, maxX?: number, maxY?: number): void; // minX: null | number
        updateCrop(): void;
        update(): void;

    }

    class RoundedRectangle {

        x: number;
        y: number;
        width: number;
        height: number;
        radius: number;
        type: number;

        clone(): RoundedRectangle;
        contains(x: number, y: number): boolean;

    }

    class Signal {

        active: boolean;
        boundDispatch: Function;
        memorize: boolean;

        add(listener: Function, listenerContext?: any, priority?: number, ...args: any[]): Phaser.SignalBinding;
        addOnce(listener: Function, listenerContext?: any, priority?: number, ...args: any[]): Phaser.SignalBinding;
        dispatch(...params: any[]): void;
        dispose(): void;
        forget(): void;
        getNumListeners(): number;
        halt(): void;
        has(listener: Function, context?: any): boolean;
        remove(listener: Function, context?: any): Function;
        removeAll(context?: any): void;
        toString(): string;
        validateListener(listener: Function, fnName: string): void;

    }

    class SignalBinding {

        constructor(signal: Phaser.Signal, listener: Function, isOnce: boolean, listenerContext?: any, priority?: number, ...args: any[]);

        active: boolean;
        callCount: number;
        context: any;
        params: any[];

        execute(paramsArr?: any[]): void;
        detach(): Function;
        isBound(): boolean;
        isOnce(): boolean;
        getListener(): Function;
        getSignal(): Phaser.Signal;
        toString(): string;

    }

    class SinglePad {

        constructor(game: Phaser.Game, padParent: any);

        callbackContext: any;
        connected: boolean;
        deadZone: number;
        game: Phaser.Game;
        index: number;
        onAxisCallback: Function;
        onConnectCallback: Function;
        onDisconnectCallback: Function;
        onDownCallback: Function;
        onFloatCallback: Function;
        onUpCallback: Function;

        axis(axisCode: number): number;
        addCallbacks(context: any, callbacks: any): void;
        buttonValue(buttonCode: number): number;
        connect(rawPad: any): void;
        destroy(): void;
        disconnect(): void;
        getButton(buttonCode: number): Phaser.DeviceButton;
        isDown(buttonCode: number): boolean;
        isUp(buttonCode: number): boolean;
        justPressed(buttonCode: number, duration?: number): boolean;
        justReleased(buttonCode: number, duration?: number): boolean;
        pollStatus(): void;
        processAxisChange(axisState: any): void;
        processButtonDown(buttonCode: number, value: any): void;
        processButtonFloat(buttonCode: number, value: any): void;
        processButtonUp(buttonCode: number, value: any): void;
        reset(): void;

    }

    class Sound {

        constructor(game: Phaser.Game, key: string, volume?: number, loop?: boolean, connect?: boolean);

        autoplay: boolean;
        allowMultiple: boolean;
        context: any;
        currentMarker: string;
        currentTime: number;
        destroy(remove?: boolean): void;
        duration: number;
        durationMS: number;
        externalNode: any;
        fadeTween: Phaser.Tween;
        game: Phaser.Game;
        gainNode: any;
        isDecoded: boolean;
        isDecoding: boolean;
        isPlaying: boolean;
        key: string;
        loop: boolean;
        markers: any;
        masterGainNode: any;
        mute: boolean;
        name: string;
        onDecoded: Phaser.Signal;
        onEndedHandler: () => void;
        onFadeComplete: Phaser.Signal;
        onLoop: Phaser.Signal;
        onMarkerComplete: Phaser.Signal;
        onMute: Phaser.Signal;
        onPause: Phaser.Signal;
        onPlay: Phaser.Signal;
        onResume: Phaser.Signal;
        onStop: Phaser.Signal;
        override: boolean;
        paused: boolean;
        pausedPosition: number;
        pausedTime: number;
        pendingPlayback: boolean;
        playOnce: boolean;
        position: number;
        startTime: number;
        stopTime: number;
        totalDuration: number;
        usingAudioTag: boolean;
        usingWebAudio: boolean;
        volume: number;

        addMarker(name: string, start: number, duration: number, volume?: number, loop?: boolean): void;
        destroy(): void;
        fadeIn(duration?: number, loop?: boolean, marker?: string): void;
        fadeOut(duration?: number): void;
        fadeTo(duration?: number, volume?: number): void;
        loopFull(volume?: number): Phaser.Sound;
        pause(): void;
        play(marker?: string, position?: number, volume?: number, loop?: boolean, forceRestart?: boolean): Phaser.Sound;
        removeMarker(name: string): void;
        restart(marker: string, position: number, volume?: number, loop?: boolean): void;
        resume(): void;
        soundHasUnlocked(key: string): void;
        stop(): void;
        update(): void;

    }

    class SoundManager {

        constructor(game: Phaser.Game);

        channels: number;
        connectToMaster: boolean;
        context: any;
        game: Phaser.Game;
        mute: boolean;
        muteOnPause: boolean;
        noAudio: boolean;
        onSoundDecode: Phaser.Signal;
        onVolumeChange: Phaser.Signal;
        onMute: Phaser.Signal;
        onUnMute: Phaser.Signal;
        touchLocked: boolean;
        usingAudioTag: boolean;
        usingWebAudio: boolean;
        volume: number;

        add(key: string, volume?: number, loop?: boolean, connect?: boolean): Phaser.Sound;
        addSprite(key: string): Phaser.AudioSprite;
        boot(): void;
        decode(key: string, sound?: Phaser.Sound): void;
        destroy(): void;
        pauseAll(): void;
        play(key: string, volume?: number, loop?: boolean): Phaser.Sound;
        remove(sound: Phaser.Sound): boolean;
        removeAll(): void;
        removeByKey(key: string): number;
        resumeAll(): void;
        setDecodedCallback(files: string[] | Phaser.Sound[], callback: Function, callbackContext?: any): void;
        setTouchLock(): void;
        stopAll(): void;
        unlock(): boolean;
        update(): void;

    }

    class Sprite extends PIXI.Sprite {

        constructor(game: Phaser.Game, x: number, y: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture, frame?: string | number);

        alive: boolean;
        anchor: Phaser.Point;
        angle: number;
        animations: Phaser.AnimationManager;
        autoCull: boolean;
        body: Phaser.Physics.Arcade.Body | Phaser.Physics.P2.Body | Phaser.Physics.Ninja.Body | any;
        bottom: number;
        cameraOffset: Phaser.Point;
        centerX: number;
        centerY: number;
        checkWorldBounds: boolean;
        components: any;
        cropRect: Phaser.Rectangle;
        customRender: boolean;
        base_collision_layer: number;
        disableRoundPx: boolean;
        roundPx: boolean;
        is_npc: boolean;
        is_interactable_object: boolean;
        data: any;
        debug: boolean;
        deltaX: number;
        deltaY: number;
        deltaZ: number;
        destroyPhase: boolean;
        events: Phaser.Events;
        exists: boolean;
        fixedToCamera: boolean;
        frame: string | number;
        frameName: string;
        fresh: boolean;
        game: Phaser.Game;
        health: number;
        inCamera: boolean;
        input: Phaser.InputHandler;
        inputEnabled: boolean;
        inWorld: boolean;
        key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture;
        left: number;
        lifespan: number;
        maxHealth: number;
        name: string;
        offsetX: number;
        offsetY: number;
        onEmit: () => void;
        outOfBoundsKill: boolean;
        outOfCameraBoundsKill: boolean;
        pendingDestroy: boolean;
        previousPosition: Phaser.Point;
        previousRotation: number;
        position: Phaser.Point;
        physicsEnabled: boolean;
        physicsType: number;
        renderOrderID: number;
        right: number;
        scale: Phaser.Point;
        scaleMin: Phaser.Point;
        scaleMax: Phaser.Point;
        smoothed: boolean;
        top: number;
        type: number;
        tintedTexture: HTMLCanvasElement;
        transformCallback: Function;
        transformCallbackContext: any;
        world: Phaser.Point;
        x: number;
        y: number;
        z: number;

        alignIn(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        alignTo(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        bringToTop(): Phaser.Sprite;
        crop(rect: Phaser.Rectangle, copy: boolean): void;
        checkTransform(wt: Phaser.Matrix): void;
        damage(amount: number): Phaser.Sprite;
        destroy(destroyChildren?: boolean): void;
        drawPolygon(): void;
        heal(amount: number): Phaser.Sprite;
        kill(): Phaser.Sprite;
        loadTexture(key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number, stopAnimation?: boolean): void;
        moveUp(): Phaser.Sprite;
        moveDown(): Phaser.Sprite;
        overlap(displayObject: Phaser.Sprite | Phaser.Image | Phaser.TileSprite | Phaser.Button | PIXI.DisplayObject): boolean;
        play(name: string, frameRate?: number, loop?: boolean, killOnComplete?: boolean): Phaser.Animation;
        postUpdate(): void;
        preUpdate(): void;
        reset(x: number, y: number, health?: number): Phaser.Sprite;
        resetFrame(): void;
        resizeFrame(parent: any, width: number, height: number): void;
        revive(health?: number): Phaser.Sprite;
        sendToBack(): Phaser.Sprite;
        setFrame(frame: Phaser.Frame): void;
        setScaleMinMax(minX?: number, minY?: number, maxX?: number, maxY?: number): void; // minX: null | number
        update(): void;
        updateCrop(): void;

    }

    class SpriteBatch extends Phaser.Group {

        constructor(game: Phaser.Game, parent: PIXI.DisplayObjectContainer, name?: string, addedToStage?: boolean);

        type: number;

    }

    class Stage extends PIXI.DisplayObjectContainer {

        constructor(game: Phaser.Game);

        game: Phaser.Game;
        name: string;
        disableVisibilityChange: boolean;
        exists: boolean;
        currentRenderOrderID: number;
        backgroundColor: any;
        smoothed: boolean;

        add(child: any, silent?: boolean, index?: number): any;
        parseConfig(config: any): void;
        preUpdate(): void;
        update(): void;
        postUpdate(): void;
        updateTransform(): void;
        checkVisibility(): void;
        visibilityChange(event: Event): void;
        setBackgroundColor(backgroundColor: number | string): void;
        destroy(): void;

    }

    interface ResizeCallback {
        (scale: ScaleManager, parentBounds: Rectangle): any;
    }

    class ScaleManager {

        constructor(game: Phaser.Game, width: number | string, height: number | string);

        static EXACT_FIT: number;
        static NO_SCALE: number;
        static SHOW_ALL: number;
        static RESIZE: number;
        static USER_SCALE: number;
        static MODES: string[];

        aspectRatio: number;
        bounds: Rectangle;
        boundingParent: HTMLElement;
        compatibility: {
            canExpandParent: boolean;
            clickTrampoline: string;
            forceMinimumDocumentHeight: boolean;
            noMargins: boolean;
            orientationFallback: boolean;
            scrollTo: Point;
            supportsFullScreen: boolean;
        };
        currentScaleMode: number;
        dom: Phaser.DOM;
        enterIncorrectOrientation: Signal;
        event: any;
        forceLandscape: boolean;
        forcePortrait: boolean;
        fullScreenScaleMode: number;
        fullScreenTarget: HTMLElement;
        game: Phaser.Game;
        grid: Phaser.FlexGrid;
        hasPhaserSetFullScreen: boolean;
        height: number;
        incorrectOrientation: boolean;
        isFullScreen: boolean;
        isGameLandscape: boolean;
        isGamePortrait: boolean;
        isPortrait: boolean;
        isLandscape: boolean;
        leaveIncorrectOrientation: Signal;
        margin: { left: number; top: number; right: number; bottom: number; x: number; y: number; };
        maxHeight: number;
        maxWidth: number;
        minHeight: number;
        minWidth: number;
        offset: Point;
        onFullScreenInit: Phaser.Signal;
        onFullScreenChange: Phaser.Signal;
        onFullScreenError: Phaser.Signal;
        onOrientationChange: Phaser.Signal;
        onSizeChange: Signal;
        pageAlignHorizontally: boolean;
        pageAlignVertically: boolean;
        parentNode: HTMLElement;
        parentIsWindow: boolean;
        parentScaleFactor: Point;
        scaleFactor: Point;
        scaleFactorInversed: Point;
        scaleMode: number;
        screenOrientation: string;
        sourceAspectRatio: number;
        trackParentInterval: number;
        width: number;
        windowConstraints: {
            bottom: string;
            right: string;
        };

        align(horizontal?: boolean, vertical?: boolean): void;
        boot(): void;
        createFullScreenTarget(): HTMLDivElement;
        destroy(): void;
        forceOrientation(forceLandscape: boolean, forcePortrait?: boolean): void;
        getParentBounds(target?: Rectangle, parent?: HTMLElement): Rectangle;
        parseConfig(config: any): void;
        preUpdate(): void;
        pauseUpdate(): void;
        refresh(): void;
        setGameSize(width: number, height: number): void;
        setResizeCallback(callback: ResizeCallback, context: any): void;
        setUserScale(hScale: number, vScale: number, hTrim?: number, vTrim?: number, queueUpdate?: boolean, force?: boolean): void;
        setMinMax(minWidth: number, minHeight: number, maxWidth?: number, maxHeight?: number): void;
        setupScale(width: number, height: number): void;
        setupScale(width: string, height: string): void;
        scaleSprite(sprite: Sprite, width?: number, height?: number, letterBox?: boolean): Sprite;
        scaleSprite(sprite: Image, width?: number, height?: number, letterBox?: boolean): Sprite;
        startFullScreen(antialias?: boolean, allowTrampoline?: boolean): boolean;
        stopFullScreen(): boolean;

    }

    class DOM {

        static visualBounds: Phaser.Rectangle;
        static layoutBounds: Phaser.Rectangle;
        static documentBounds: Phaser.Rectangle;

        static calibrate(coords: any, cushion?: number): any;
        static getAspectRatio(object: any): number;
        static getScreenOrientation(primaryFallback?: string): string;
        static getBounds(element: any, cushion?: number): any;
        static getOffset(element: any, point?: Point): Point;
        static inLayoutViewport(element: any, cushion?: number): boolean;
    }

    class State {

        add: Phaser.GameObjectFactory;
        cache: Phaser.Cache;
        camera: Phaser.Camera;
        game: Phaser.Game;
        input: Phaser.Input;
        key: string;
        load: Phaser.Loader;
        make: Phaser.GameObjectCreator;
        particles: Phaser.Particles;
        physics: Phaser.Physics;
        rnd: Phaser.RandomDataGenerator;
        scale: Phaser.ScaleManager;
        sound: Phaser.SoundManager;
        stage: Phaser.Stage;
        state: Phaser.StateManager;
        time: Phaser.Time;
        tweens: Phaser.TweenManager;
        world: Phaser.World;

        create(game: Phaser.Game): void;
        init(...args: any[]): void;
        loadRender(game: Phaser.Game): void;
        loadUpdate(game: Phaser.Game): void;
        paused(game: Phaser.Game): void;
        pauseUpdate(game: Phaser.Game): void;
        preload(game: Phaser.Game): void;
        preRender(game: Phaser.Game): void;
        render(game: Phaser.Game): void;
        resize(width: number, height: number): void;
        resumed(game: Phaser.Game): void;
        shutdown(game: Phaser.Game): void;
        update(game: Phaser.Game): void;

    }

    interface IStateCycle {

        preUpdate(): void;
        update(): void;
        render(): void;
        postRender(): void;
        destroy(): void;
    }

    class StateManager {

        constructor(game: Phaser.Game, pendingState?: Phaser.State);

        created: boolean;
        current: string;
        game: Phaser.Game;
        onCreateCallback: Function;
        onInitCallback: Function;
        onLoadRenderCallback: Function;
        onLoadUpdateCallback: Function;
        onPausedCallback: Function;
        onPauseUpdateCallback: Function;
        onPreloadCallback: Function;
        onPreRenderCallback: Function;
        onRenderCallback: Function;
        onResumedCallback: Function;
        onResizeCallback: Function;
        onShutDownCallback: Function;
        onUpdateCallback: Function;
        states: any;

        onStateChange: Phaser.Signal;
        add(key: string, state: any, autoStart?: boolean): void;
        checkState(key: string): boolean;
        clearCurrentState(): void;
        destroy(): void;
        getCurrentState(): Phaser.State;
        link(key: string): void;
        loadComplete(): void;
        preRender(): void;
        preUpdate(): void;
        render(): void;
        remove(key: string): void;
        resume(): void;
        restart(clearWorld?: boolean, clearCache?: boolean, ...args: any[]): void;
        resize(width: number, height: number): void;
        start(key: string, clearWorld?: boolean, clearCache?: boolean, ...args: any[]): void;
        update(): void;
        unlink(key: string): void;

    }

    interface PhaserTextStyle {

        font?: string;
        fill?: any;
        align?: string;
        stroke?: string;
        strokeThickness?: number;
        wordWrap?: boolean;
        wordWrapWidth?: number;
        maxLines?: number;
        shadowOffsetX?: number;
        shadowOffsetY?: number;
        shadowColor?: string;
        shadowBlur?: number;
        valign?: string;
        tab?: number;
        tabs?: number;

        fontSize?: number;
        fontStyle?: string;
        fontVariant?: string;
        fontWeight?: string | number;
        backgroundColor?: string;
        boundsAlignH?: string;
        boundsAlignV?: string;
        fontProperties?: {
            ascent: number;
            descent: number;
            fontSize: number;
        };
        testString?: string;

    }

    class Text extends Phaser.Sprite {

        constructor(game: Phaser.Game, x: number, y: number, text: string, style?: PhaserTextStyle);

        static fontPropertiesCanvas: any;
        static fontPropertiesContext: any;
        static fontPropertiesCache: any;

        align: string;
        angle: number;
        autoRound: boolean;
        boundsAlignH: string;
        boundsAlignV: string;
        cameraOffset: Phaser.Point;
        canvas: HTMLCanvasElement;
        colors: string[];
        context: CanvasRenderingContext2D;
        cssFont: string;
        destroyPhase: boolean;
        events: Phaser.Events;
        exists: boolean;
        fill: any;
        fixedToCamera: boolean;
        font: string;
        fontSize: number | string;
        fontStyle: string;
        fontStyles: string[];
        fontVariant: string;
        fontWeight: string | number;
        fontWeights: (string | number)[];
        game: Phaser.Game;
        input: Phaser.InputHandler;
        inputEnabled: boolean;
        lineSpacing: number;
        name: string;
        padding: Phaser.Point;
        pendingDestroy: boolean;
        physicsType: number;
        position: Phaser.Point;
        previousPosition: Phaser.Point;
        previousRotation: number;
        renderOrderID: number;
        resolution: number;
        shadowBlur: number;
        shadowColor: string;
        shadowFill: boolean;
        shadowOffsetX: number;
        shadowOffsetY: number;
        shadowStroke: boolean;
        splitRegExp: any;
        stroke: string;
        strokeColors: string[];
        strokeThickness: number;
        scale: Phaser.Point;
        tab: number;
        tabs: number | number[];
        testString: string;
        text: string;
        textBounds: Phaser.Rectangle;
        type: number;
        useAdvancedWrap: boolean;
        world: Phaser.Point;
        wordWrap: boolean;
        wordWrapWidth: number;
        z: number;

        addColor(color: string, position: number): Phaser.Text;
        addFontStyle(style: string, position: number): Phaser.Text;
        addFontWeight(weight: string, position: number): Phaser.Text;
        addStrokeColor(color: string, position: number): Phaser.Text;
        alignIn(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        alignTo(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        clearColors(): Phaser.Text;
        clearFontValues(): Phaser.Text;
        componentsToFont(components: any): string;
        destroy(destroyChildren?: boolean): void;
        fontToComponents(font: string): any;
        postUpdate(): void;
        parseList(list: any[]): Phaser.Text;
        precalculateWordWrap(text: string): string[];
        preUpdate(): void;
        renderTabLine(line: string, x: number, y: number, fill?: boolean): void;
        setShadow(x?: number, y?: number, color?: any, blur?: number, shadowStroke?: boolean, shadowFill?: boolean): Phaser.Text;
        setStyle(style?: PhaserTextStyle, update?: boolean): Phaser.Text;
        setText(text: string, immediate?: boolean): Phaser.Text;
        setTextBounds(x?: number, y?: number, width?: number, height?: number): Phaser.Text;
        update(): void;
        updateFont(components: any): void;
        updateLine(text: string, x?: number, y?: number): void;
        updateShadow(state?: boolean): void;
        updateTexture(): void;

    }

    class Tile {

        constructor(layer: any, index: number, x: number, y: Number, width: number, height: number);

        alpha: number;
        bottom: number;
        callback: Function;
        callbackContext: any;
        centerX: number;
        centerY: number;
        canCollide: boolean;
        collideDown: boolean;
        collideLeft: boolean;
        collideNone: boolean;
        collideRight: boolean;
        collisionCallback: Function;
        collisionCallbackContext: any;
        collides: boolean;
        collideUp: boolean;
        debug: boolean;
        faceBottom: boolean;
        faceLeft: boolean;
        faceRight: boolean;
        faceTop: boolean;
        game: Phaser.Game;
        height: number;
        index: number;
        layer: any;
        left: number;
        properties: any;
        right: number;
        scanned: boolean;
        top: number;
        width: number;
        worldX: number;
        worldY: number;
        x: number;
        y: number;

        copy(tile: Phaser.Tile): Phaser.Tile;
        containsPoint(x: number, y: number): boolean;
        destroy(): void;
        intersects(x: number, y: number, right: number, bottom: number): boolean;
        isInterested(collides: boolean, faces: boolean): boolean;
        resetCollision(): void;
        setCollision(left: boolean, right: boolean, up: boolean, down: boolean): void;
        setCollisionCallback(callback: Function, context: any): void;

    }

    class Tilemap {

        constructor(game: Phaser.Game, key?: string, tileWidth?: number, tileHeight?: number, width?: number, height?: number);

        static CSV: number;
        static TILED_JSON: number;
        static NORTH: number;
        static EAST: number;
        static SOUTH: number;
        static WEST: number;

        collision: any[];
        collideIndexes: any[];
        currentLayer: number;
        debugMap: any[];
        enableDebug: boolean;
        format: number;
        game: Phaser.Game;
        height: number;
        heightInPixels: number;
        images: any[];
        imagecollections: ImageCollection[];
        key: string;
        layer: Phaser.TilemapLayer[];
        layers: any[];
        objects: any[] | { [index: string]: Phaser.TilemapObject[] };
        objectsMap: any | { [index: number]: Phaser.TilemapObject };
        orientation: string;
        pauseAnimation: boolean;
        properties: any;
        rayStepRate: number;
        tileHeight: number;
        tiles: Phaser.Tile[];
        tilesets: Phaser.Tileset[];
        tileWidth: number;
        version: number;
        width: number;
        widthInPixels: number;

        addTilesetImage(tileset: string, key?: string | Phaser.BitmapData, tileWidth?: number, tileHeight?: number, tileMargin?: number, tileSpacing?: number, gid?: number): Phaser.Tileset;
        calculateFaces(layer: number): void;
        copy(x: number, y: number, width: number, height: number, layer?: any): Phaser.Tile[];
        create(name: string, width: number, height: number, tileWidth: number, tileHeight: number, group?: Phaser.Group): Phaser.TilemapLayer;
        createBlankLayer(name: string, width: number, height: number, tileWidth: number, tileHeight: number, group?: Phaser.Group): Phaser.TilemapLayer;
        createFromObjects(name: string, search: number | string | number[], key: string, frame?: any, exists?: boolean, autoCull?: boolean, group?: Phaser.Group, CustomClass?: any, adjustY?: boolean, adjustSize?: boolean): Phaser.Sprite[];
        createFromTiles(tiles: any, replacements: any, key: string, layer?: any, group?: Phaser.Group, properties?: any): number;
        createLayer(layer: any, width?: number, height?: number, group?: Phaser.Group): Phaser.TilemapLayer;
        destroy(): void;
        dump(): void;
        fill(index: number, x: number, y: number, width: number, height: number, layer?: any): void;
        forEach(callback: Function, context: any, x: number, y: Number, width: number, height: number, layer?: any): void;
        getImageIndex(name: string): number;
        getIndex(location: any[], name: string): number;
        getLayer(layer: any): number;
        getLayerIndex(name: string): number;
        getObject(id: number): Phaser.TilemapObject;
        getObjectIndex(name: string): number;
        getObjects(layer: string, propName: string, propValue: any, output?: Phaser.TilemapObject[]): Phaser.TilemapObject[];
        getTile(x: number, y: number, layer?: any, nonNull?: boolean): Phaser.Tile;
        getTileAbove(layer: number, x: number, y: number): Phaser.Tile;
        getTileBelow(layer: number, x: number, y: number): Phaser.Tile;
        getTileLeft(layer: number, x: number, y: number): Phaser.Tile;
        getTileRight(layer: number, x: number, y: number): Phaser.Tile;
        getTilesetIndex(name: string): number;
        getTileWorldXY(x: number, y: number, tileWidth?: number, tileHeight?: number, layer?: number | string | Phaser.TilemapLayer, nonNull?: boolean): Phaser.Tile;
        hasTile(x: number, y: number, layer: Phaser.TilemapLayer): boolean;
        paste(x: number, y: number, tileblock: Phaser.Tile[], layer?: any): void;
        putTile(tile: any, x: number, y: number, layer?: any): Phaser.Tile;
        putTileWorldXY(tile: any, x: number, y: number, tileWidth: number, tileHeight: number, layer?: any): void;
        random(x: number, y: number, width: number, height: number, layer?: any): void;
        removeAllLayers(): void;
        removeTile(x: number, y: number, layer?: any): Phaser.Tile;
        removeTileWorldXY(x: number, y: number, tileWidth: number, tileHeight: number, layer?: any): Phaser.Tile;
        replace(source: number, dest: number, x: number, y: number, width: number, height: number, layer?: any): void;
        searchTileIndex(index: number, skip?: number, reverse?: boolean, layer?: any): Phaser.Tile;
        setCollision(indexes: any, collides?: boolean, layer?: any, recalculate?: boolean): void;
        setCollisionBetween(start: number, stop: number, collides?: boolean, layer?: any, recalculate?: boolean): void;
        setCollisionByExclusion(indexes: any[], collides?: boolean, layer?: any, recalculate?: boolean): void;
        setCollisionByIndex(index: number, collides?: boolean, layer?: number, recalculate?: boolean): void;
        setLayer(layer: any): void;
        setPreventRecalculate(value: boolean): void;
        setTileIndexCallback(indexes: any, callback: Function, callbackContext?: any, layer?: any): void;
        setTileLocationCallback(x: number, y: number, width: number, height: number, callback: Function, callbackContext?: any, layer?: any): void;
        setTileSize(tileWidth: number, tileHeight: number): void;
        shuffle(x: number, y: number, width: number, height: number, layer: any): void;
        swap(tileA: number, tileB: number, x: number, y: number, width: number, height: number, layer?: any): void;

    }

    class TilemapLayer extends Phaser.Sprite {

        constructor(game: Phaser.Game, tilemap: Phaser.Tilemap, index: number, width?: number, height?: number);

        cameraOffset: Phaser.Point;
        canvas: HTMLCanvasElement;
        collisionHeight: number;
        collisionWidth: number;
        context: CanvasRenderingContext2D;
        data: any;
        debug: boolean;
        debugAlpha: number;
        debugCallbackColor: string;
        debugColor: string;
        debugSettings: { missingImageFill: string; debuggedTileOverfill: string; forceFullRedraw: boolean; debugAlpha: number; facingEdgeStroke: string; collidingTileOverfill: string; };
        dirty: boolean;
        exists: boolean;
        fixedToCamera: boolean;
        game: Phaser.Game;
        index: number;
        layer: Phaser.TilemapLayer;
        layer_z: number;
        map: Phaser.Tilemap;
        name: string;
        physicsType: number;
        properties: any;
        renderSettings: { enableScrollDelta: boolean; overdrawRatio: number; copyCanvas: any; };
        scrollFactorX: number;
        scrollFactorY: number;
        scrollX: number;
        scrollY: number;
        type: number;
        wrap: boolean;

        destroy(): void;
        getRayCastTiles(line: Phaser.Line, stepRate?: number, collides?: boolean, interestingFace?: boolean): Phaser.Tile[];
        getTiles(x: number, y: number, width: number, height: number, collides?: boolean, interestingFace?: boolean): Phaser.Tile[];
        getTileX(x: number): number;
        getTileXY(x: number, y: number, point: Phaser.Point): Phaser.Point;
        getTileY(y: number): number;
        postUpdate(): void;
        render(): void;
        resize(width: number, height: number): void;
        resizeWorld(): void;
        resetTilesetCache(): void;
        setScale(xScale?: number, yScale?: number): void;
        updateMax(): void;
        getTileOffsetX(): number;
        getTileOffsetY(): number;

    }

    class TilemapLayerGL {

        constructor(game: Phaser.Game, tilemap: Phaser.Tilemap, index: number, width?: number, height?: number, tileset?: Phaser.Tileset);

        collisionHeight: number;
        collisionWidth: number;
        data: any;
        dirty: boolean;
        exists: boolean;
        fixedToCamera: boolean;
        game: Phaser.Game;
        index: number;
        layer: Phaser.TilemapLayer;
        map: Phaser.Tilemap;
        name: string;
        physicsType: number;
        scrollFactorX: number;
        scrollFactorY: number;
        scrollX: number;
        scrollY: number;
        type: number;
        wrap: boolean;
        x: number;
        y: number;
        width: number;
        height: number;

        destroy(): void;
        postUpdate(): void;
        render(): void;
        resize(width: number, height: number): void;
        resizeWorld(): void;
        resetTilesetCache(): void;
        setScale(xScale?: number, yScale?: number): void;
        updateMax(): void;

    }

    interface TilemapObject {
        ellipse: boolean;
        gid: number;
        height: number;
        id: number;
        name: string;
        point: boolean;
        polygon: number[][];
        polyline: number[][];
        properties: any;
        rectangle: boolean;
        rotation: number;
        template: string;
        text: any;
        type: string;
        visible: boolean;
        width: number;
        x: number;
        y: number;
    }

    class TilemapParser {

        static INSERT_NULL: boolean;

        static getEmptyData(tileWidth?: number, tileHeight?: number, width?: number, height?: number): any;
        static parse(game: Phaser.Game, key: string, tileWidth?: number, tileHeight?: number, width?: number, height?: number): any;
        static parseCSV(key: string, data: string, tileWidth?: number, tileHeight?: number): any;
        static parseJSON(json: any): any;

    }

    class Tileset {

        constructor(name: string, firstgid: number, width?: number, height?: number, margin?: number, spacing?: number, properties?: any);

        columns: number;
        firstgid: number;
        image: any;
        lastgid: number;
        name: string;
        properties: any;
        rows: number;
        tileHeight: number;
        tileMargin: number;
        tileSpacing: number;
        tileWidth: number;
        tileProperties: any;
        total: number;

        containsTileIndex(tileIndex: number): boolean;
        draw(context: CanvasRenderingContext2D, x: number, y: number, index: number): void;
        drawGl(glBatch: any[], x: number, y: number, index: number, alpha: number, flippedVal: number): void;
        setImage(image: any): void;
        setSpacing(margin?: number, spacing?: number): void;

    }

    class TileSprite extends PIXI.TilingSprite {

        constructor(game: Phaser.Game, x: number, y: number, width: number, height: number, key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture, frame?: string | number);

        alive: boolean;
        angle: number;
        animations: Phaser.AnimationManager;
        autoCull: boolean;
        body: Phaser.Physics.Arcade.Body | Phaser.Physics.P2.Body | Phaser.Physics.Ninja.Body | any;
        bottom: number;
        cameraOffset: Phaser.Point;
        checkWorldBounds: boolean;
        components: any;
        customRender: boolean;
        data: any;
        debug: boolean;
        destroyPhase: boolean;
        events: Phaser.Events;
        exists: boolean;
        fixedToCamera: boolean;
        frame: string | number;
        frameName: string;
        fresh: boolean;
        game: Phaser.Game;
        inCamera: boolean;
        input: Phaser.InputHandler;
        inputEnabled: boolean;
        inWorld: boolean;
        key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture;
        left: number;
        name: string;
        offsetX: number;
        offsetY: number;
        outOfBoundsKill: boolean;
        pendingDestroy: boolean;
        physicsType: number;
        position: Phaser.Point;
        smoothed: boolean;
        previousPosition: Phaser.Point;
        previousRoation: number;
        right: number;
        top: number;
        renderOrderID: number;
        type: number;
        world: Phaser.Point;
        z: number;

        alignIn(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        alignTo(container: Phaser.Rectangle | Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.TileSprite, position?: number, offsetX?: number, offsetY?: number): any;
        autoScroll(x: number, y: number): void;
        destroy(destroyChildren?: boolean): void;
        loadTexture(key: string | Phaser.RenderTexture | Phaser.BitmapData | Phaser.Video | PIXI.Texture, frame?: string | number, stopAnimation?: boolean): void;
        play(name: string, frameRate?: number, loop?: boolean, killOnComplete?: boolean): Phaser.Animation;
        postUpdate(): void;
        preUpdate(): void;
        overlap(displayObject: Phaser.Sprite | Phaser.Image | Phaser.TileSprite | Phaser.Button | PIXI.DisplayObject): boolean;
        reset(x: number, y: number, health?: number): Phaser.TileSprite;
        resizeFrame(parent: any, width: number, height: number): void;
        resetFrame(): void;
        setFrame(frame: Phaser.Frame): void;
        stopScroll(): void;
        update(): void;

    }

    class Time {

        constructor(game: Phaser.Game);

        advancedTiming: boolean;
        delta: number;
        deltaMax: number;
        deltaTotal: number;
        desiredFps: number;
        desiredFpsMult: number;
        desiredMinFps: number;
        elapsed: number;
        events: Phaser.Timer;
        elapsedMS: number;
        fps: number;
        fpsMax: number;
        fpsMin: number;
        frames: number;
        game: Phaser.Game;
        lastTime: number;
        msMax: number;
        msMin: number;
        now: number;
        pausedTime: number;
        pauseDuration: number;
        renders: number;
        rps: number;
        slowMotion: number;
        suggestedFps: number;
        time: number;
        timeExpected: number;
        timeToCall: number;
        updates: number;
        ups: number;

        add(timer: Phaser.Timer): Phaser.Timer;
        boot(): void;
        create(autoDestroy?: boolean): Phaser.Timer;
        elapsedSecondsSince(since: number): number;
        elapsedSince(since: number): number;
        removeAll(): void;
        reset(): void;
        totalElapsedSeconds(): number;
        update(time: number): void;

    }

    class Timer {

        constructor(game: Phaser.Game, autoDestroy?: boolean);

        static HALF: number;
        static MINUTE: number;
        static QUARTER: number;
        static SECOND: number;

        autoDestroy: boolean;
        duration: number;
        events: Phaser.TimerEvent[];
        expired: boolean;
        game: Phaser.Game;
        length: number;
        ms: number;
        next: number;
        nextTick: number;
        onComplete: Phaser.Signal;
        running: boolean;
        paused: boolean;
        seconds: number;

        add(delay: number, callback: Function, callbackContext?: any, ...args: any[]): Phaser.TimerEvent;
        clearPendingEvents(): void;
        destroy(): void;
        loop(delay: number, callback: Function, callbackContext?: any, ...args: any[]): Phaser.TimerEvent;
        order(): void;
        pause(): void;
        remove(event: Phaser.TimerEvent): boolean;
        removeAll(): void;
        repeat(delay: number, repeatCount: number, callback: Function, callbackContext?: any, ...args: any[]): Phaser.TimerEvent;
        resume(): void;
        sortHandler(a: any, b: any): number;
        start(startDelay?: number): void;
        stop(clearEvents?: boolean): void;
        update(time: number): boolean;

    }

    class TimerEvent {

        constructor(timer: Phaser.Timer, delay: number, tick: number, repeatCount: number, loop: boolean, callback: Function, callbackContext?: any, ...args: any[]);

        args: any[];
        callback: Function;
        callbackContext: any;
        delay: number;
        loop: boolean;
        pendingDelete: boolean;
        repeatCount: number;
        tick: number;
        timer: Phaser.Timer;

    }

    class Touch {

        constructor(game: Phaser.Game);

        callbackContext: any;
        active: boolean;
        enabled: boolean;
        event: any;
        game: Phaser.Game;
        preventDefault: boolean;
        touchCancelCallback: Function;
        touchEndCallback: Function;
        touchEnterCallback: Function;
        touchLeaveCallback: Function;
        touchMoveCallback: Function;
        touchStartCallback: Function;
        touchLockCallbacks: Function[];

        addTouchLockCallback(callback: Function, context?: any, onEnd?: boolean): void;
        removeTouchLockCallback(callback: Function, context?: any): boolean;
        consumeTouchMove(): void;
        onTouchCancel(event: any): void;
        onTouchEnd(event: any): void;
        onTouchEnter(event: any): void;
        onTouchLeave(event: any): void;
        onTouchMove(event: any): void;
        onTouchStart(event: any): void;
        start(): boolean;
        stop(): void;

    }

    class Tween {

        static updateColor(tween: Tween): void;

        constructor(target: any, game: Phaser.Game, manager: Phaser.TweenManager);

        chainedTween: Phaser.Tween;
        current: number;
        game: Phaser.Game;
        isRunning: boolean;
        isPaused: boolean;
        manager: Phaser.TweenManager;
        onChildComplete: Phaser.Signal;
        onComplete: Phaser.Signal;
        onLoop: Phaser.Signal;
        onRepeat: Phaser.Signal;
        onStart: Phaser.Signal;
        pendingDelete: boolean;
        properties: any;
        repeatCounter: number;
        reverse: boolean;
        target: any;
        timeline: Phaser.TweenData[];
        timeScale: number;
        totalDuration: number;

        chain(...args: any[]): Phaser.Tween;
        delay(duration: number, index?: number): Phaser.Tween;
        easing(ease: Function, index?: number): Phaser.Tween;
        easing(ease: string, index?: number): Phaser.Tween;
        from(properties: any, duration?: number, ease?: Function, autoStart?: boolean, delay?: number, repeat?: number, yoyo?: boolean): Phaser.Tween;
        from(properties: any, duration?: number, ease?: string, autoStart?: boolean, delay?: number, repeat?: number, yoyo?: boolean): Phaser.Tween;
        generateData(frameRate?: number, data?: any): any[];
        interpolation(interpolation: Function, context?: any, index?: number): Phaser.Tween;
        loop(value?: boolean): Phaser.Tween;
        onUpdateCallback(callback: Function, callbackContext?: any): Phaser.Tween;
        pause(): void;
        repeat(total: number, repeatDelay?: number, index?: number): Phaser.Tween;
        repeatDelay(duration: number, index?: number): Phaser.Tween;
        repeatAll(total?: number): Phaser.Tween;
        resume(): void;
        start(index?: number): Phaser.Tween;
        stop(complete?: boolean): Phaser.Tween;
        to(properties: any, duration?: number, ease?: Function, autoStart?: boolean, delay?: number, repeat?: number, yoyo?: boolean, lazyValuesSet?: boolean): Phaser.Tween;
        to(properties: any, duration?: number, ease?: string, autoStart?: boolean, delay?: number, repeat?: number, yoyo?: boolean): Phaser.Tween;
        update(time: number): boolean;
        updateTweenData(property: string, value: number | Function, index?: number): Phaser.Tween;
        yoyo(enable: boolean, yoyoDelay?: number, index?: number): Phaser.Tween;
        yoyoDelay(duration: number, index?: number): Phaser.Tween;

    }

    class TweenData {

        constructor(parent: Phaser.Tween);

        static COMPLETE: number;
        static LOOPED: number;
        static PENDING: number;
        static RUNNING: number;

        delay: number;
        dt: number;
        duration: number;
        easingFunction: Function;
        game: Phaser.Game;
        inReverse: boolean;
        interpolate: boolean;
        interpolateFunctionContext: Phaser.Math;
        interpolationContext: Phaser.Math;
        interpolationFunction: Function;
        isRunning: boolean;
        isFrom: boolean;
        parent: Phaser.Tween;
        percent: number;
        repeatCounter: number;
        startTime: number;
        value: number;
        yoyo: boolean;
        yoyoDelay: number;

        from(properties: any, duration?: number, ease?: Function, delay?: number, repeat?: number, yoyo?: boolean): Phaser.TweenData;
        generateData(frameRate?: number): any[];
        repeat(): number;
        start(): Phaser.TweenData;
        to(properties: any, duration?: number, ease?: Function, delay?: number, repeat?: number, yoyo?: boolean): Phaser.TweenData;
        update(time: number): number;

    }

    class TweenManager {

        constructor(game: Phaser.Game);

        game: Phaser.Game;

        add(tween: Phaser.Tween): Phaser.Tween;
        create(object: any): Phaser.Tween;
        getAll(): Phaser.Tween[];
        isTweening(object: any, checkIsRunning?: boolean): boolean;
        remove(tween: Phaser.Tween): Phaser.Tween;
        removeAll(): void;
        removeFrom(obj: any, children?: boolean): void;
        resumeAll(): void;
        update(): boolean;
        pauseAll(): void;

    }

    class Utils {

        static getProperty(obj: any, prop: string): any;
        static setProperty(obj: any, prop: string, value: any): any;
        static setProperties(obj: any, props: any): any;
        static chanceRoll(chance: number): boolean;
        static randomChoice(choice1: string | number, choice2: any): any;
        static reverseString(string: string): string;
        static parseDimension(size: any, dimension: number): number;
        static pad(str: string, len?: number, pad?: string, dir?: number): string;
        static isPlainObject(object: any): boolean;
        static extend(deep: boolean, target: any, ...args: any[]): any;
        static mixinPrototype(target: any, mixin: any, replace?: boolean): void;
        static mixin<T>(from: T, to: any): T;

    }

    module Utils {

        class Debug {

            static GEOM_AUTO: number;
            static GEOM_RECTANGLE: number;
            static GEOM_CIRCLE: number;
            static GEOM_POINT: number;
            static GEOM_ELLIPSE: number;

            constructor(game: Phaser.Game);

            bmd: Phaser.BitmapData;
            canvas: HTMLCanvasElement;
            columnWidth: number;
            context: CanvasRenderingContext2D;
            currentAlpha: number;
            currentX: number;
            currentY: number;
            dirty: boolean;
            font: string;
            game: Phaser.Game;
            lineHeight: number;
            lineWidth: number;
            renderShadow: boolean;
            sprite: Phaser.Image;

            AStar(astar: Phaser.Plugin.AStar, x: number, y: number, showVisited: boolean): void;
            boot(): void;
            body(sprite: Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.Sprite | Phaser.Text | Phaser.TileSprite, color?: string, filled?: boolean): void;
            bodyInfo(sprite: Phaser.BitmapText | Phaser.Button | Phaser.Graphics | Phaser.Sprite | Phaser.Text | Phaser.TileSprite, x: number, y: Number, color?: string): void;
            box2dBody(body: any /* Phaser.Physics.Box2D.Body */, color?: string): void;
            box2dWorld(): void;
            camera(camera: Phaser.Camera, color?: string, filled?: boolean): void;
            cameraInfo(camera: Phaser.Camera, x: number, y: number, color?: string): void;
            device(x: number, y: number, color?: string): void;
            destroy(): void;
            geom(object: any, color?: string, fiiled?: boolean, forceType?: number): void;
            inputInfo(x: number, y: number, color?: string, showDetails?: boolean): void;
            lineInfo(line: Phaser.Line, x: number, y: number, color?: string): void;
            key(key: Phaser.Key, x?: number, y?: number, color?: string): void;
            line(...args: string[]): void;
            loader(loader: Phaser.Loader, x: number, y: number, color?: string): void;
            phaser(x: number, y: number, color?: string): void;
            preUpdate(): void;
            physicsGroup(group: Phaser.Group, color?: string, filled?: boolean, checkExists?: boolean): void;
            pixel(x: number, y: number, color?: string, size?: number): void;
            pointer(pointer: Phaser.Pointer, hideIfUp?: boolean, downColor?: string, upColor?: string, color?: string, inactiveColor?: string): void;
            quadTree(quadtree: Phaser.QuadTree, color?: string): void;
            rectangle(object: Phaser.Rectangle, color?: string, filled?: boolean): void;
            renderer(x?: number, y?: number, color?: string): void;
            reset(): void;
            ropeSegments(rope: Phaser.Rope, color?: number, filled?: boolean): void;
            sound(x: number, y: number, color?: string): void;
            scale(x: number, y: number, color?: string): void;
            soundInfo(sound: Phaser.Sound, x: number, y: number, color?: string): void;
            spriteBounds(sprite: any, color?: string, filled?: boolean): void;
            spriteCoords(sprite: any, x: number, y: number, color?: string): void;
            spriteInfo(sprite: Phaser.Sprite, x: number, y: number, color?: string): void;
            spriteInputInfo(sprite: Phaser.Sprite, x: number, y: number, color?: string): void;
            start(x?: number, y?: number, color?: string, columnWidth?: number): void;
            stop(): void;
            text(text: string, x: number, y: number, color?: string, font?: string): void;
            timer(timer: Phaser.Timer, x: number, y: number, color?: string): void;

        }

    }

    class Weapon extends Phaser.Plugin {

        constructor(game: Phaser.Game, parent: Phaser.PluginManager);

        static KILL_NEVER: number;
        static KILL_LIFESPAN: number;
        static KILL_DISTANCE: number;
        static KILL_WEAPON_BOUNDS: number;
        static KILL_CAMERA_BOUNDS: number;
        static KILL_WORLD_BOUNDS: number;
        static KILL_STATIC_BOUNDS: number;

        autoExpandBulletsGroup: boolean;
        autofire: boolean;
        bounds: Phaser.Rectangle;
        bulletAngleOffset: number;
        bulletAngleVariance: number;
        bulletAnimation: string;
        bulletClass: any;
        bulletCollideWorldBounds: boolean;
        bulletFrame: string;
        bulletFrameCycle: boolean;
        bulletFrameRandom: boolean;
        bulletFrames: any[];
        bulletGravity: Phaser.Point;
        bulletInheritSpriteSpeed: boolean;
        bulletKey: string;
        bulletKillDistance: number;
        bulletKillType: number;
        bulletLifespan: number;
        bulletRotateToVelocity: boolean;
        bullets: Phaser.Group;
        bulletSpeed: number;
        bulletSpeedVariance: number;
        bulletWorldWrap: boolean;
        bulletWorldWrapPadding: number;
        fireAngle: number;
        fireFrom: Phaser.Rectangle;
        fireLimit: number;
        fireRate: number;
        fireRateVariance: number;
        multiFire: boolean;
        onFire: Phaser.Signal;
        onFireLimit: Phaser.Signal;
        onKill: Phaser.Signal;
        shots: number;
        trackedPointer: Phaser.Pointer;
        trackedSprite: any;
        trackOffset: Phaser.Point;
        trackRotation: boolean;
        x: number;
        y: number;

        addBulletAnimation(name: string, frames?: number[] | string[], frameRate?: number, loop?: boolean, useNumericIndex?: boolean): Phaser.Weapon;
        createBullets(quantity?: number, key?: any, frame?: any, group?: Phaser.Group): Phaser.Weapon;
        debug(x?: number, y?: number, debugBodies?: boolean): void;
        destroy(): void;
        fire(from?: any, x?: number, y?: number, offsetX?: number, offsetY?: number): Phaser.Bullet;
        fireAtPointer(pointer: Phaser.Pointer): Phaser.Bullet;
        fireAtSprite(sprite: Phaser.Sprite): Phaser.Bullet;
        fireAtXY(x: number, y: number): Phaser.Bullet;
        fireMany(positions: any[], from?: any): Phaser.Bullet[];
        fireOffset(offsetX?: number, offsetY?: number): Phaser.Bullet;
        forEach(callback: any, callbackContext?: any): Phaser.Weapon;
        killAll(): Phaser.Weapon;
        pauseAll(): Phaser.Weapon;
        resetShots(newLimit?: number): Phaser.Weapon;
        resumeAll(): Phaser.Weapon;
        setBulletBodyOffset(width: number, height: number, offsetX?: number, offsetY?: number): Phaser.Weapon;
        setBulletFrames(min: number, max: number, cycle?: boolean, random?: boolean): Phaser.Weapon;
        trackPointer(pointer: Phaser.Pointer, offsetX?: number, offsetY?: number): Phaser.Weapon;
        trackSprite(sprite: Phaser.Sprite, offsetX?: number, offsetY?: number, trackRotation?: boolean): Phaser.Weapon;

    }

    class World extends Phaser.Group {

        constructor(game: Phaser.Game);

        bounds: Phaser.Rectangle;
        camera: Phaser.Camera;
        centerX: number;
        centerY: number;
        game: Phaser.Game;
        height: number;
        isPaused: boolean;
        randomX: number;
        randomY: number;
        stats: {
            skipped: number;
            ignored: number;
            checked: number;
        };
        width: number;

        boot(): void;
        getObjectsUnderPointer(pointer: Phaser.Pointer, group: Phaser.Group, callback?: Function, callbackContext?: any): Phaser.Sprite;
        resize(width: number, height: number): void;
        setBounds(x: number, y: number, width: number, height: number): void;
        sortLeftRight(a: Phaser.Sprite, b: Phaser.Sprite): number;
        sortRightLeft(a: Phaser.Sprite, b: Phaser.Sprite): number;
        sortTopBottom(a: Phaser.Sprite, b: Phaser.Sprite): number;
        sortBottomTop(a: Phaser.Sprite, b: Phaser.Sprite): number;
        sort(group: Phaser.Group, sortDirection?: number): void;
        sort(key?: string, order?: number): void;
        shutdown(): void;
        wrap(sprite: any, padding?: number, useBounds?: boolean, horizontal?: boolean, vertical?: boolean): void;
        wrapAll(group: Phaser.Group, checkExists?: boolean, padding?: number, useBounds?: boolean, horizontal?: boolean, vertical?: boolean): void;

    }

}
