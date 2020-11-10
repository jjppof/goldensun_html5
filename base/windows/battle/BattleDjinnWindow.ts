import { TextObj, Window } from "../../Window";
import { djinn_status, djinn_font_colors } from "../../Djinn";
import { DjinnStatsWindow } from "./DjinnStatsWindow";
import { GoldenSun } from "../../GoldenSun";
import { MainChar } from "../../MainChar";
import { BattlePsynergyWindow } from "./BattlePsynergyWindow";
import { CursorManager, PointVariants } from "../../utils/CursorManager";

const BASE_WINDOW_X = 160;
const BASE_WINDOW_Y = 72;
const BASE_WINDOW_WIDTH = 76;
const BASE_WINDOW_HEIGHT = 84;

const ELEM_PER_PAGE = 5;
const TOP_PADDING = 8;
const SPACE_BETWEEN_ITEMS = 8;

const HIGHLIGHT_BAR_WIDTH = 64;
const HIGHLIGHT_BAR_HEIGHT = 8;
const HIGHLIGHT_BAR_X = 8;

const BUTTON_X = 140;
const BUTTON_Y = 136;

const STAR_X = 9;
const DJINN_NAME_X = 17;

const CURSOR_X = 154;
const CURSOR_Y = 84;
const CURSOR_SHIFT = 16;

const RECOVERY_NUMBER_X = 67;

export class BattleDjinnWindow {
  public game: Phaser.Game;
  public data: GoldenSun;

  public base_window: Window;
  public stats_window: DjinnStatsWindow;
  public group: Phaser.Group;

  public button: Phaser.Sprite;
  public highlight_bar: Phaser.Graphics;

  public djinn_names: TextObj[];
  public stars_sprites: Phaser.Sprite[];
  public open_psy_key: number;

  public window_open: boolean;
  public window_active: boolean;
  public psynergy_window_open: boolean;

  public char: MainChar;
  public close_callback: Function;
  public set_description: Function;
  public psynergy_window: BattlePsynergyWindow;
  public choosen_ability: string;

  public djinni: string[];
  public all_djinni: string[];

  public djinn_index: number;
  public page_index: number;
  public page_number: number;

  constructor(game, data) {
    this.game = game;
    this.data = data;

    this.base_window = new Window(
      this.game,
      BASE_WINDOW_X,
      BASE_WINDOW_Y,
      BASE_WINDOW_WIDTH,
      BASE_WINDOW_HEIGHT
    );
    this.stats_window = new DjinnStatsWindow(this.game, this.data);
    this.group = this.game.add.group();
    this.group.alpha = 0;

    this.button = this.group.create(BUTTON_X, BUTTON_Y, "buttons", "djinni");
    this.highlight_bar = this.game.add.graphics(0, 0);
    this.highlight_bar.blendMode = PIXI.blendModes.SCREEN;
    this.highlight_bar.alpha = 0;

    this.base_window.add_sprite_to_group(this.highlight_bar);
    this.highlight_bar.beginFill(this.base_window.color, 1);
    this.highlight_bar.drawRect(
      HIGHLIGHT_BAR_X,
      0,
      HIGHLIGHT_BAR_WIDTH,
      HIGHLIGHT_BAR_HEIGHT
    );
    this.highlight_bar.endFill();

    this.djinn_names = [];
    this.stars_sprites = [];
    this.open_psy_key = null;
  }

  select_djinn(index: number) {
    this.djinn_index = index;

    let cursor_x = CURSOR_X;
    let cursor_y = CURSOR_Y + this.djinn_index * CURSOR_SHIFT;

    let tween_config = {
      type: CursorManager.CursorTweens.POINT,
      variant: PointVariants.NORMAL,
    };
    this.data.cursor_manager.move_to(
      { x: cursor_x, y: cursor_y },
      { animate: false, tween_config: tween_config }
    );
    this.change_djinn();

    if (this.psynergy_window_open)
      this.psynergy_window.change_djinni(
        this.data.info.djinni_list[this.djinni[this.djinn_index]]
      );
  }

  next_djinn() {
    if (this.djinni.length === 1) return;
    this.select_djinn((this.djinn_index + 1) % this.djinni.length);
  }

  previous_djinn() {
    if (this.djinni.length === 1) return;
    this.select_djinn(
      (this.djinn_index + this.djinni.length - 1) % this.djinni.length
    );
  }

  next_page() {
    if (this.page_number === 1) return;

    this.page_index = (this.page_index + 1) % this.page_number;
    this.change_page();
  }

  previous_page() {
    if (this.page_number === 1) return;

    this.page_index =
      (this.page_index + this.page_number - 1) % this.page_number;
    this.change_page();
  }

  update_position() {
    this.group.x = this.game.camera.x;
    this.group.y = this.game.camera.y;
  }

  call_set_description() {
    const this_djinn = this.data.info.djinni_list[
      this.djinni[this.djinn_index]
    ];
    if (this.set_description) {
      switch (this_djinn.status) {
        case djinn_status.SET:
          this.set_description(this_djinn.description);
          break;
        case djinn_status.STANDBY:
          this.set_description("Ready to summon. Choose to set it again.");
          break;
        case djinn_status.RECOVERY:
          this.set_description("This Djinn is still recovering.");
          break;
      }
    }
  }

  change_page() {
    this.config_page();
    if (this.djinn_index >= this.djinni.length) {
      this.djinn_index = this.djinni.length - 1;
      this.select_djinn(this.djinn_index);
    }
    this.call_set_description();
    this.set_highlight_bar();
    this.base_window.page_indicator.set_highlight(this.page_index);
    this.update_stats();
  }

  change_djinn() {
    this.call_set_description();
    this.set_highlight_bar();
    this.update_stats();
  }

  set_highlight_bar() {
    this.highlight_bar.y =
      TOP_PADDING +
      this.djinn_index * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
  }

  config_page() {
    this.clear_sprites();
    this.djinni = this.all_djinni.slice(
      this.page_index * ELEM_PER_PAGE,
      (this.page_index + 1) * ELEM_PER_PAGE
    );

    for (let i = 0; i < this.djinni.length; ++i) {
      const djinn = this.data.info.djinni_list[this.djinni[i]];
      const base_y =
        TOP_PADDING + i * (SPACE_BETWEEN_ITEMS + HIGHLIGHT_BAR_HEIGHT);
      const star = this.base_window.create_at_group(
        STAR_X,
        base_y + 1,
        djinn.element + "_star"
      );

      this.stars_sprites.push(star);
      let color;

      switch (djinn.status) {
        case djinn_status.SET:
          color = djinn_font_colors[djinn_status.SET];
          break;
        case djinn_status.STANDBY:
          color = djinn_font_colors[djinn_status.STANDBY];
          break;
        case djinn_status.RECOVERY:
          color = djinn_font_colors[djinn_status.RECOVERY];
          break;
      }

      const name = this.base_window.set_text_in_position(
        djinn.name,
        DJINN_NAME_X,
        base_y,
        false,
        false,
        color
      );
      this.djinn_names.push(name);

      if (djinn.status === djinn_status.RECOVERY) {
        const rec_number = this.base_window.set_text_in_position(
          (djinn.recovery_turn + 1).toString(),
          RECOVERY_NUMBER_X,
          base_y,
          true,
          false,
          djinn_font_colors[djinn_status.RECOVERY]
        );
        this.djinn_names.push(rec_number);
      }
    }
  }

  set_page_number() {
    const list_length = this.all_djinni.length;
    this.page_number = (((list_length - 1) / ELEM_PER_PAGE) | 0) + 1;

    if (this.page_index >= this.page_number) {
      this.page_index = this.page_number - 1;
    }
    this.base_window.page_indicator.initialize(this.page_number);
  }

  get_next_status() {
    const this_djinn = this.data.info.djinni_list[
      this.djinni[this.djinn_index]
    ];
    let next_status: string;

    switch (this_djinn.status) {
      case djinn_status.SET:
        next_status = djinn_status.STANDBY;
        break;
      case djinn_status.STANDBY:
        next_status = djinn_status.SET;
        break;
      case djinn_status.RECOVERY:
        next_status = djinn_status.RECOVERY;
        break;
    }

    return next_status;
  }

  update_stats() {
    const this_djinn = this.data.info.djinni_list[
      this.djinni[this.djinn_index]
    ];
    this.stats_window.set_djinn(this_djinn, this.get_next_status());
  }

  mount_window() {
    this.all_djinni = this.char.djinni;
    this.set_page_number();
    this.base_window.page_indicator.set_page(this.page_index);

    this.config_page();
    this.update_stats();
  }

  clear_sprites() {
    this.stars_sprites.forEach((sprite) => {
      this.base_window.remove_from_group(sprite, true);
    });
    this.djinn_names.forEach((text) => {
      this.base_window.remove_text(text);
    });
  }

  show_psynergy() {
    if (this.psynergy_window_open) return;

    this.psynergy_window.open(
      this.char,
      undefined,
      undefined,
      true,
      this.data.info.djinni_list[this.djinni[this.djinn_index]],
      this.get_next_status()
    );
    this.psynergy_window_open = true;

    let controls = [
      {
        key: this.data.gamepad.LEFT,
        on_down: this.psynergy_window.previous_page.bind(this.psynergy_window),
      },
      {
        key: this.data.gamepad.RIGHT,
        on_down: this.psynergy_window.next_page.bind(this.psynergy_window),
      },
      { key: this.data.gamepad.UP, on_down: this.previous_djinn.bind(this) },
      { key: this.data.gamepad.DOWN, on_down: this.next_djinn.bind(this) },
    ];

    this.data.control_manager.set_control(controls, {
      loop_configs: { vertical: true, horizontal: true },
    });
  }

  hide_psynergy() {
    if (!this.psynergy_window_open) return;

    this.psynergy_window.close();
    this.psynergy_window_open = false;

    this.select_djinn(this.djinn_index);
    this.djinn_choose();
  }

  djinn_choose() {
    let controls = [
      { key: this.data.gamepad.LEFT, on_down: this.previous_page.bind(this) },
      { key: this.data.gamepad.RIGHT, on_down: this.next_page.bind(this) },
      { key: this.data.gamepad.UP, on_down: this.previous_djinn.bind(this) },
      { key: this.data.gamepad.DOWN, on_down: this.next_djinn.bind(this) },
      {
        key: this.data.gamepad.A,
        on_down: () => {
          const this_djinn = this.data.info.djinni_list[
            this.djinni[this.djinn_index]
          ];
          if (this_djinn.status !== djinn_status.RECOVERY) {
            this.choosen_ability = this_djinn.ability_key_name;
            this.hide(this.close_callback);
          }
        },
      },
      {
        key: this.data.gamepad.B,
        on_down: () => {
          this.choosen_ability = null;
          this.close(this.close_callback);
        },
      },
    ];

    this.data.control_manager.set_control(controls, {
      loop_configs: { vertical: true, horizontal: true },
    });

    if (!this.open_psy_key) {
      let control = [
        {
          key: this.data.gamepad.R,
          on_down: this.show_psynergy.bind(this),
          on_up: this.hide_psynergy.bind(this),
        },
      ];
      this.open_psy_key = this.data.control_manager.set_control(control, {
        persist: true,
        no_reset: true,
      });
    }
  }

  open(
    char: MainChar,
    close_callback: Function,
    set_description: Function,
    psynergy_window?: BattlePsynergyWindow
  ) {
    this.char = char;
    this.close_callback = close_callback;
    this.set_description = set_description;
    this.psynergy_window = psynergy_window;

    this.psynergy_window_open = false;
    this.group.alpha = 1;

    this.djinn_index = 0;
    this.page_index = 0;
    this.choosen_ability = null;
    this.highlight_bar.alpha = 1;

    this.stats_window.open(this.char);
    this.update_position();
    this.set_highlight_bar();
    this.mount_window();

    this.select_djinn(0);
    this.djinn_choose();

    this.base_window.show(() => {
      this.window_open = true;
      this.window_active = true;
    }, false);
  }

  show() {
    this.group.alpha = 1;
    this.highlight_bar.alpha = 1;

    this.select_djinn(this.djinn_index);
    this.stats_window.open(this.char);
    this.update_stats();
    this.djinn_choose();

    this.base_window.show(() => {
      this.window_active = true;
    }, false);
  }

  hide(callback?: Function) {
    this.group.alpha = 0;
    this.highlight_bar.alpha = 0;

    this.stats_window.close();
    this.data.cursor_manager.hide();

    this.data.control_manager.detach_bindings(this.open_psy_key);
    this.open_psy_key = null;

    this.base_window.close(() => {
      this.window_active = false;
      if (callback !== undefined) {
        callback(this.choosen_ability);
      }
    }, false);
  }

  close(callback?: Function) {
    this.clear_sprites();
    this.base_window.page_indicator.terminante();

    this.group.alpha = 0;
    this.highlight_bar.alpha = 0;

    this.data.cursor_manager.hide();
    this.data.control_manager.reset();

    this.data.control_manager.detach_bindings(this.open_psy_key);
    this.open_psy_key = null;

    this.stats_window.close();
    this.base_window.close(() => {
      this.window_open = false;
      this.window_active = false;
      if (callback !== undefined) {
        callback(this.choosen_ability);
      }
    }, false);
  }

  destroy() {
    this.base_window.destroy(false);
    this.stats_window.destroy();
    this.group.destroy();

    this.data.cursor_manager.hide();
    this.data.control_manager.reset();
  }
}
