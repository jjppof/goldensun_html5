function load_buttons(game) {
    game.load.atlasJSONHash("buttons", "assets/images/buttons/buttons.png", "assets/images/buttons/buttons.json");
    game.load.atlasJSONHash(
        "keyboard_buttons",
        "assets/images/keyboard/keyboard_buttons.png",
        "assets/images/keyboard/keyboard_buttons.json"
    );
}

function load_db_files(game) {
    game.load.json("init_db", "assets/init.json");
    game.load.json("classes_db", "assets/dbs/classes_db.json");
    game.load.json("abilities_db", "assets/dbs/abilities_db.json");
    game.load.json("items_db", "assets/dbs/items_db.json");
    game.load.json("npc_db", "assets/dbs/npc_db.json");
    game.load.json("interactable_objects_db", "assets/dbs/interactable_objects_db.json");
    game.load.json("djinni_db", "assets/dbs/djinni_db.json");
    game.load.json("enemies_db", "assets/dbs/enemies_db.json");
    game.load.json("enemies_parties_db", "assets/dbs/enemies_parties_db.json");
    game.load.json("maps_db", "assets/dbs/maps_db.json");
    game.load.json("main_chars_db", "assets/dbs/main_chars_db.json");
    game.load.json("summons_db", "assets/dbs/summons_db.json");
    game.load.json("misc_animations_db", "assets/dbs/misc_animations_db.json");
    game.load.json("shopkeep_dialog_db", "assets/dbs/shopkeep_dialog_db.json");
    game.load.json("shops_db", "assets/dbs/shops_db.json");
    game.load.json("inn_db", "assets/dbs/inn_db.json");
    game.load.json("storage_db", "assets/dbs/storage_db.json");
    game.load.json("abilities_cast_db", "assets/dbs/common_abilities_animations/abilities_cast_db.json");
    game.load.json("misc_battle_animations_db", "assets/dbs/common_abilities_animations/misc_battle_animations_db.json");
}

function load_misc(game) {
    game.load.image("start_screen", "assets/images/misc/start_screen.png");
    game.load.image("shadow", "assets/images/misc/shadow.jpg");
    game.load.image("psynergy_aura", "assets/images/psynergies/psynergy_aura.png");
    game.load.atlasJSONHash("menu", "assets/images/misc/menu.png", "assets/images/misc/menu.json");
    game.load.image("frost_snowflake", "assets/images/interactable_objects/snowflake.png");
    game.load.image("djinn_ball", "assets/images/misc/djinn_ball.png");
    game.load.image("water_drop", "assets/images/misc/water_drop.png");
    game.load.image("star", "assets/images/interactable_objects/star.png");
    game.load.image("mind_read_arrow", "assets/images/psynergies/mind_read_arrow.png");
    game.load.atlasJSONHash(
        "battle_effect_icons",
        "assets/images/icons/battle_effects/battle_effect_icons.png",
        "assets/images/icons/battle_effects/battle_effect_icons.json"
    );
    game.load.atlasJSONHash(
        "battle_cursor",
        "assets/images/misc/battle_cursor.png",
        "assets/images/misc/battle_cursor.json"
    );
    game.load.atlasJSONHash("ranges", "assets/images/misc/ranges.png", "assets/images/misc/ranges.json");
    game.load.atlasJSONHash("stars", "assets/images/misc/stars.png", "assets/images/misc/stars.json");
    game.load.atlasJSONHash("emoticons", "assets/images/misc/emoticons.png", "assets/images/misc/emoticons.json");
    game.load.atlasJSONHash(
        "psynergy_ball",
        "assets/images/interactable_objects/psynergy_ball.png",
        "assets/images/interactable_objects/psynergy_ball.json"
    );
    game.load.atlasJSONHash("bush", "assets/images/misc/bush.png", "assets/images/misc/bush.json");
}

function load_assets(game) {
    game.load.atlasJSONHash(
        "battle_backgrounds",
        "assets/images/battle_backgrounds/battle_backgrounds.png",
        "assets/images/battle_backgrounds/battle_backgrounds.json"
    );
    game.load.atlasJSONHash("avatars", "assets/images/avatars/avatars.png", "assets/images/avatars/avatars.json");
    game.load.atlasJSONHash(
        "battle_shadows",
        "assets/images/spritesheets/battle/battle_shadows.png",
        "assets/images/spritesheets/battle/battle_shadows.json"
    );
}

function load_fonts(game) {
    game.load.bitmapFont("gs-bmp-font", "assets/font/golden-sun.png", "assets/font/golden-sun.fnt");
    game.load.bitmapFont(
        "gs-italic-bmp-font",
        "assets/font/golden-sun-italic.png",
        "assets/font/golden-sun-italic.fnt"
    );
    game.load.bitmapFont("gs-item-bmp-font", "assets/font/gs-item-font.png", "assets/font/gs-item-font.fnt");
    game.load.bitmapFont("gs-shop-bmp-font", "assets/font/gs-shop-font.png", "assets/font/gs-shop-font.fnt");
}

function load_filters(game) {
    game.load.script("colorize", "assets/filters/colorize.js");
    game.load.script("levels", "assets/filters/levels.js");
    game.load.script("color_blend", "assets/filters/color_blend.js");
    game.load.script("hue", "assets/filters/hue.js");
    game.load.script("tint", "assets/filters/tint.js");
    game.load.script("gray", "assets/filters/gray.js");
    game.load.script("flame", "assets/filters/flame.js");
    game.load.script("outline", "assets/filters/outline.js");
    game.load.script("mode7", "assets/filters/mode7.js");
    game.load.script("reveal", "assets/filters/reveal.js");
}

function load_plugins(game) {
    game.load.script("particlestorm", "assets/plugins/particle-storm.js");
}

function load_se(game) {
    game.load.json("se_data", "assets/sounds/se/se.json");
}

export function load_all(game) {
    load_db_files(game);
    load_misc(game);
    load_assets(game);
    load_buttons(game);
    load_fonts(game);
    load_filters(game);
    load_plugins(game);
    load_se(game);
}
