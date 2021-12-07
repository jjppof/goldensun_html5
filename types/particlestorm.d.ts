declare module Phaser {

    class ParticleStorm extends Phaser.Plugin {

        constructor(game: Phaser.Game, parent: Phaser.PluginManager);

        static SPRITE: string;
        static PIXEL: string;
        static RENDERTEXTURE: string;
        static SPRITE_BATCH: string;
        static BITMAP_DATA: string;

        static BASE: any;
        static BASE_1: any;
        static BASE_255: any;
        static BASE_359: any;
        static BASE_NULL: any;
        static BASE_EMIT: any;
        static CONTROLS: any;
        static ZONES: any;

        emitters: ParticleStorm.Emitter[];
        dataList: any;
        blendModeMap: any;
        hsv: any[];

        createEmitter(renderType?: string, force?: Phaser.Point, scrollSpeed?: Phaser.Point, render_white_core?: boolean): ParticleStorm.Emitter;
        removeEmitter(emitter: ParticleStorm.Emitter): void;
        addData(key: string | string[], obj?: any): ParticleStorm;
        getData(key: string): any;
        clearData(key?: string | string[]): ParticleStorm;
        cloneData(key: string | string[], obj?: any): ParticleStorm;
        createPointZone(x?: number, y?: number): ParticleStorm.Zones.Point;
        createLineZone(x1?: number, y1?: number, x2?: number, y2?: number): ParticleStorm.Zones.Line;
        createRectangleZone(width?: number, height?: number): ParticleStorm.Zones.Rectangle;
        createCircleZone(radius?: number): ParticleStorm.Zones.Circle;
        createEllipseZone(width?: number, height?: number): ParticleStorm.Zones.Ellipse;

        createLinearSplineZone(resolution?: number, closed?: boolean, points?: Phaser.Point[] | number[]): ParticleStorm.Zones.Spline;
        createLinearSplineZone(resolution?: number, closed?: boolean, ...points: Phaser.Point[]): ParticleStorm.Zones.Spline;
        createLinearSplineZone(resolution?: number, closed?: boolean, ...points: number[]): ParticleStorm.Zones.Spline;

        createBezierSplineZone(resolution?: number, closed?: boolean, points?: Phaser.Point[] | number[]): ParticleStorm.Zones.Spline;
        createBezierSplineZone(resolution?: number, closed?: boolean, ...points: Phaser.Point[]): ParticleStorm.Zones.Spline;
        createBezierSplineZone(resolution?: number, closed?: boolean, ...points: number[]): ParticleStorm.Zones.Spline;

        createCatmullSplineZone(resolution?: number, closed?: boolean, points?: Phaser.Point[] | number[]): ParticleStorm.Zones.Spline;
        createCatmullSplineZone(resolution?: number, closed?: boolean, ...points: Phaser.Point[]): ParticleStorm.Zones.Spline;
        createCatmullSplineZone(resolution?: number, closed?: boolean, ...points: number[]): ParticleStorm.Zones.Spline;

        createSplineZone(mode?: number, resolution?: number, closed?: boolean, points?: Phaser.Point[] | number[]): ParticleStorm.Zones.Spline;
        createSplineZone(mode?: number, resolution?: number, closed?: boolean, ...points: Phaser.Point[]): ParticleStorm.Zones.Spline;
        createSplineZone(mode?: number, resolution?: number, closed?: boolean, ...points: number[]): ParticleStorm.Zones.Spline;

        createTextZone(text: Phaser.Text): ParticleStorm.Zones.Text;
        createImageZone(key: Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapData | Image | HTMLCanvasElement | string): ParticleStorm.Zones.Image;

        update(): void;

    }

    module ParticleStorm {

        class Particle {

            constructor(emitter: Phaser.ParticleStorm.Emitter);

            emitter: Phaser.ParticleStorm.Emitter;
            renderer: Phaser.ParticleStorm.Renderer.Base;
            graph: Phaser.ParticleStorm.Graph;
            transform: Phaser.ParticleStorm.Controls.Transform;
            color: Phaser.ParticleStorm.Controls.Color;
            texture: Phaser.ParticleStorm.Controls.Texture;
            parent: Phaser.ParticleStorm.Particle;
            lifespan: number;
            keepAlive: boolean;
            delay: number;
            delayVisible: boolean;
            life: number;
            sprite: Phaser.Sprite;
            visible: boolean;
            isComplete: boolean;
            ignoreForce: boolean;
            ignoreScrollSpeed: boolean;
            emit: any;
            lifePercent: number;
            frequency: number;

            reset(renderer: Phaser.ParticleStorm.Renderer.Base, x: number, y: number, data?: any): Phaser.ParticleStorm.Particle;
            create(x: number, y: number, data: any): Phaser.ParticleStorm.Particle;
            step(elapsedTime: number, force?: Phaser.Point): boolean;
            emitChild(): void;
            applyOverwrite(object: any, particle: Phaser.ParticleStorm.Particle): Phaser.ParticleStorm.Particle;
            getChildKey(param: any): string;
            radiate(velocity: any, from?: number, to?: number): Phaser.ParticleStorm.Particle;
            radiateFrom(x: number, y: number, velocity: any): Phaser.ParticleStorm.Particle;
            target(data: { x?: number; y?: number; zone?: Phaser.ParticleStorm.Zones.Base; speed?: string }): Phaser.ParticleStorm.Particle;
            setLife(lifespan: number | any, keepAlive?: boolean): Phaser.ParticleStorm.Particle;
            kill(): void;
            onEmit(particle: Phaser.ParticleStorm.Particle): void;
            onUpdate(): void;
            onInherit(particle: Phaser.ParticleStorm.Particle): boolean;
            onKill(): void;

        }

        class GravityWell {

            constructor(emitter: Phaser.ParticleStorm.Emitter, x?: number, y?: number, power?: number, epsilon?: number, gravity?: number);

            emitter: Phaser.ParticleStorm.Emitter;
            time: Phaser.Time;
            position: Phaser.Point;
            active: boolean;
            epsilon: number;
            power: number;
            gravity: number;

            step(particle: Phaser.ParticleStorm.Particle): void;

        }

        interface Point {
            x: number;
            y: number;
        }

        class Graph {

            static CONTROL_LINEAR: Point[];
            static CONTROL_REVERSE: Point[];
            static CONTROL_YOYO: Point[];

            static getControlValue(control: any, percent: number): number;
            static getControlValues(control: any, previousPercent: number, nowPercent: number): Point[];
            static getParamArea(param: any, previousPercent: number, nowPercent: number): number;
            static getControlArea(control: any, previousPercent: number, nowPercent: number): number;
            static getMinMaxInitial(object: any): number;
            static isNumeric(n: number): boolean;
            static getMinMax(value: number | any): number;
            static clone(src: any, dest: any): any;
            static fromControl(data: number | any, obj: any): void;
            static fromData(data: number | any, obj: any): boolean;
            static getValue(obj: number | any, percent: number): number;
            static getClampedValue(obj: number | any, percent: number): number;

        }

        interface EmitterConfig {

            total?: number;
            repeat?: number;
            frequency?: number;
            xStep?: number;
            yStep?: number;
            delay?: number | {
                start?: number;
                step?: number;
                visible?: boolean;
            };
            zone?: Phaser.ParticleStorm.Zones.Base;
            random?: boolean;
            full?: boolean;
            setAlpha?: boolean;
            setColor?: boolean;
            step?: number;
            spacing?: number | number[];
            radiate?: {
                velocity?: number;
                from?: number;
                to?: number;
            }
            radiateFrom?: {
                x?: number;
                y?: number;
                velocity?: number;
            }
        }

        class Emitter {

            constructor(parent: Phaser.ParticleStorm, renderType?: string, force?: Phaser.Point, scrollSpeed?: Phaser.Point, render_white_core?: boolean);

            game: Phaser.Game;
            parent: Phaser.ParticleStorm;
            renderer: Phaser.ParticleStorm.Renderer.Base;
            renderType: string;
            graph: Phaser.ParticleStorm.Graph;
            enabled: boolean;
            manualUpdate: boolean;
            scrollSpeed: Phaser.Point;
            force: Phaser.Point;
            onEmit: Phaser.Signal;
            onComplete: Phaser.Signal;
            onKill: Phaser.Signal;
            particleClass: Phaser.ParticleStorm.Particle;
            timer: Phaser.Timer;
            timerEvent: Phaser.TimerEvent;
            list: Phaser.ParticleStorm.Particle[];
            pool: Phaser.ParticleStorm.Particle[];
            batch: Phaser.ParticleStorm.Particle[];
            wells: Phaser.ParticleStorm.GravityWell[];
            paused: boolean;
            total: number;
            alive: number;
            dead: number;

            init(renderType?: string, force?: Phaser.Point, scrollSpeed?: Phaser.Point, render_white_core?: boolean): void;
            addToWorld(group?: Phaser.Group): (Phaser.Image | Phaser.Sprite | Phaser.Group)[];
            createGravityWell(x?: number, y?: number, power?: number, epsilon?: number, gravity?: number): Phaser.ParticleStorm.GravityWell;
            seed(qty: number): Phaser.ParticleStorm.Emitter;
            emitDelayed(delay: number, key: string, x?: number | number[], y?: number | number[], config?: EmitterConfig): Phaser.TimerEvent;
            emit(key: string, x: number | number[] | (() => number), y: number | number[] | (() => number), config?: EmitterConfig): Phaser.ParticleStorm.Particle | Phaser.ParticleStorm.Particle[];
            emitParticle(key: string, x?: number | number[], y?: number | number[], parent?: Phaser.ParticleStorm.Particle): Phaser.ParticleStorm.Particle;
            update(): number;
            updateFrequency(emit: any, elapsedTime: number, lastPercent: number, lifePercent: number): number;
            forEach(callback: Function, callbackContext: any, ...parameter: any[]): void;
            forEachNew(callback: Function, callbackContext: any, ...parameter: any[]): void;
            getParticle(index: number): Phaser.ParticleStorm.Particle;
            debug(x: number, y: number): void;
            destroy(): void;

        }

        module Renderer {

            class Base {

                constructor(emitter: Phaser.ParticleStorm.Emitter);

                game: Phaser.Game;
                emitter: Phaser.ParticleStorm.Emitter;
                parent: Phaser.ParticleStorm;
                pixelSize: number;
                useRect: boolean;

                addToWorld(group?: Phaser.Group): (Phaser.Image | Phaser.Sprite | Phaser.Group)[];
                preUpdate(): void;
                add(particle: Phaser.ParticleStorm.Particle): void;
                update(particle: Phaser.ParticleStorm.Particle): Phaser.ParticleStorm.Particle;
                postUpdate(): void;
                kill(particle: Phaser.ParticleStorm.Particle): void;
                destroy(): void;

            }

            class BitmapData extends Base {

                constructor(emitter: Phaser.ParticleStorm.Emitter, width: number, height: number);

                bmd: Phaser.BitmapData;
                display: Phaser.Image;
                roundPx: boolean;
                autoClear: boolean;

                resize(width: number, height: number): Phaser.ParticleStorm.Renderer.BitmapData;
                clear(alpha?: number): Phaser.ParticleStorm.Renderer.BitmapData;

            }

            class Pixel extends Base {

                constructor(emitter: Phaser.ParticleStorm.Emitter, width: number, height: number, render_white_core?: boolean);

                bmd: Phaser.BitmapData;
                display: Phaser.Image;
                autoClear: boolean;

                resize(width: number, height: number): Phaser.ParticleStorm.Renderer.Pixel;
                clear(alpha?: number): Phaser.ParticleStorm.Renderer.Pixel;

            }

            class RenderTexture extends Base {

                constructor(emitter: Phaser.ParticleStorm.Emitter, width: number, height: number);

                renderTexture: Phaser.RenderTexture;
                display: Phaser.Image;
                stamp: Phaser.Image;
                autoClear: boolean;

                clear(): Phaser.ParticleStorm.Renderer.RenderTexture;

            }

            class Sprite extends Base {

                display: Phaser.Group;

                add(particle: Phaser.ParticleStorm.Particle): Phaser.Sprite;

            }

            class SpriteBatch extends Base {

                display: Phaser.SpriteBatch;

                add(particle: Phaser.ParticleStorm.Particle): Phaser.Sprite;

            }

        }

        module Controls {

            class Color {

                constructor(particle: Phaser.ParticleStorm.Particle);

                particle: Phaser.ParticleStorm.Particle;
                graph: Phaser.ParticleStorm.Graph;
                red: any;
                green: any;
                blue: any;
                alpha: any;
                hsv: any;
                hsvData: any[];
                tint: number;
                isTinted: boolean;
                rgba: string;
                blendMode: any[];

                reset(): void;
                init(data: any): void;
                step(): void;
                setColor(r: number, g: number, b: number, a: number): void;

            }

            class Texture {

                constructor(particle: Phaser.ParticleStorm.Particle);

                particle: Phaser.ParticleStorm.Particle;
                rnd: Phaser.RandomDataGenerator;
                graph: Phaser.ParticleStorm.Graph;
                sendToBack: boolean;
                bringToTop: boolean;
                key: string;
                frame: number;
                frameName: string;
                scaleMode: number;

                reset(): void;
                init(data: any): void;
                step(data: any, sprite?: Phaser.Sprite): void;

            }

            class Transform {

                constructor(particle: Phaser.ParticleStorm.Particle);

                particle: Phaser.ParticleStorm.Particle;
                time: Phaser.Time;
                graph: Phaser.ParticleStorm.Graph;
                x: number;
                y: number;
                velocity: { x: any, y: any, facing: any };
                acceleration: { x: any, y: any, facing: any };
                scale: { x: any, y: any };
                rotation: any;
                anchor: Phaser.Point;

                reset(): void;
                init(x: number, y: number, data: any): void;
                inherit(parent: Phaser.ParticleStorm.Particle): void;
                step(): void;

            }

        }

        module Zones {

            class Base {

                constructor(game: Phaser.Game);

                game: Phaser.Game;
                active: boolean;
                scale: Phaser.Point;
                alphaThreshold: number;
                _rnd: Phaser.Point;

                getRandom(): Phaser.Point;
                emit(emitter: Phaser.ParticleStorm.Emitter, key: string, x: number, y: number, qty: number): Phaser.ParticleStorm.Particle;

            }

            class Circle extends Base {

                constructor(game: Phaser.Game, radius?: number);

                shape: Phaser.Circle;

            }

            class Ellipse extends Base {

                constructor(game: Phaser.Game, width: number, height: number);

                shape: Phaser.Ellipse;

            }

            class Image extends Base {

                constructor(game: Phaser.Game, key: Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapData | Image | HTMLCanvasElement | string);

                bmd: Phaser.BitmapData;
                key: Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapData | Image | HTMLCanvasElement | string;
                points: any[];

                update(key: Phaser.Sprite | Phaser.Image | Phaser.Text | Phaser.BitmapData | Image | HTMLCanvasElement | string): Phaser.ParticleStorm.Zones.Image;
                addPixel(color: any, x: number, y: number): boolean;
                getRandom(): any;
                emit(emitter: Phaser.ParticleStorm.Emitter, key: string, x: number, y: number, qty: number, setAlpha?: boolean, setColor?: boolean): Phaser.ParticleStorm.Particle;
                emitFull(emitter: Phaser.ParticleStorm.Emitter, key: string, x: number, y: number, step: number, spacing: number | number[], setAlpha: boolean, setColor: boolean): Phaser.ParticleStorm.Particle;

            }

            class Line extends Base {

                constructor(game: Phaser.Game, x1?: number, y1?: number, x2?: number, y2?: number);

                shape: Phaser.Line;

            }

            class Point extends Base {

                constructor(game: Phaser.Game, x?: number, y?: number);

                shape: Phaser.Point;

            }

            class Rectangle extends Base {

                constructor(game: Phaser.Game, width?: number, height?: number);

                shape: Phaser.Rectangle;

            }

            class Spline extends Base {

                constructor(game: Phaser.Game, mode?: number, resolution?: number, closed?: boolean, points?: Phaser.Point[] | number[]);
                constructor(game: Phaser.Game, mode?: number, resolution?: number, closed?: boolean, ...points: Phaser.Point[]);
                constructor(game: Phaser.Game, mode?: number, resolution?: number, closed?: boolean, ...points: number[]);

                math: Phaser.Math;
                points: { x: any[]; y: any[]; };
                path: any[];
                resolution: number;
                mode: number;
                closed: boolean;
                mult: number;

                update(points: Phaser.Point[] | number[]): Phaser.ParticleStorm.Zones.Spline;
                update(...points: Phaser.Point[]): Phaser.ParticleStorm.Zones.Spline;
                update(...points: number[]): Phaser.ParticleStorm.Zones.Spline;

                getRandom(): any;
                emitPercent(emitter: Phaser.ParticleStorm.EmitterConfig, key: string, x: number, y: number, qty: number, percent: number): Phaser.ParticleStorm.Particle;

            }

            class Text extends Base {

                constructor(game: Phaser.Game, text: Phaser.Text);

                bmd: Phaser.BitmapData;
                text: Phaser.Text;
                points: any[];

                update(text?: Phaser.Text): Phaser.ParticleStorm.Zones.Text;
                addPixel(color: any, x: number, y: number): boolean;
                getRandom(): any;
                emit(emitter: Phaser.ParticleStorm.Emitter, key: string, x: number, y: number, qty: number, setAlpha?: boolean, setColor?: boolean): Phaser.ParticleStorm.Particle;
                emitFull(emitter: Phaser.ParticleStorm.Emitter, key: string, x: number, y: number, step: number, spacing: number | number[], setAlpha?: boolean, setColor?: boolean): Phaser.ParticleStorm.Particle;

            }

        }

    }

}