function load_buttons(game) {
    game.load.atlasJSONHash('buttons', 'assets/images/buttons/buttons.png', 'assets/images/buttons/buttons.json');
    game.load.image('shift_keyboard', 'assets/images/keyboard/shift.png');
    game.load.image('tab_keyboard', 'assets/images/keyboard/tab.png');
    game.load.image('spacebar_keyboard', 'assets/images/keyboard/spacebar.png');
}

function load_db_files(game) {
    game.load.json('init_db', 'init.json');
    game.load.json('classes_db', 'assets/dbs/classes_db.json');
    game.load.json('abilities_db', 'assets/dbs/abilities_db.json');
    game.load.json('items_db', 'assets/dbs/items_db.json');
    game.load.json('npc_db', 'assets/dbs/npc_db.json');
    game.load.json('interactable_objects_db', 'assets/dbs/interactable_objects_db.json');
    game.load.json('djinni_db', 'assets/dbs/djinni_db.json');
    game.load.json('enemies_db', 'assets/dbs/enemies_db.json');
    game.load.json('enemies_parties_db', 'assets/dbs/enemies_parties_db.json');
    game.load.json('maps_db', 'assets/dbs/maps_db.json');
    game.load.json('main_chars_db', 'assets/dbs/main_chars_db.json');
    game.load.json('summons_db', 'assets/dbs/summons_db.json');
    game.load.json('misc_animations_db', 'assets/dbs/misc_animations_db.json');
}

function load_misc(game) {
    game.load.image('shadow', 'assets/images/misc/shadow.jpg');
    game.load.image('cursor', 'assets/images/misc/cursor.gif');
    game.load.image('green_arrow', 'assets/images/misc/green_arrow.gif');
    game.load.image('up_arrow', 'assets/images/misc/up_arrow.gif');
    game.load.image('down_arrow', 'assets/images/misc/down_arrow.gif');
    game.load.image('page_arrow', 'assets/images/misc/page_arrow.png');
    game.load.image('psynergy_aura', 'assets/images/misc/psynergy_aura.png');
    game.load.image('equipped', 'assets/images/misc/equipped.gif');
    game.load.image('venus_star', 'assets/images/misc/venus_star.gif');
    game.load.image('mercury_star', 'assets/images/misc/mercury_star.gif');
    game.load.image('mars_star', 'assets/images/misc/mars_star.gif');
    game.load.image('jupiter_star', 'assets/images/misc/jupiter_star.gif');
    game.load.image('stat_up', 'assets/images/misc/stat_up.gif');
    game.load.image('stat_down', 'assets/images/misc/stat_down.gif');
    game.load.image('arrow_change', 'assets/images/misc/arrow_change.png');
    game.load.image('frost_snowflake', 'assets/images/interactable_objects/snowflake.png');
    game.load.atlasJSONHash('dust', 'assets/images/misc/dust.png', 'assets/images/misc/dust.json');
    game.load.atlasJSONHash('battle_cursor', 'assets/images/misc/battle_cursor.png', 'assets/images/misc/battle_cursor.json');
    game.load.atlasJSONHash('ranges', 'assets/images/misc/ranges.png', 'assets/images/misc/ranges.json');
    game.load.atlasJSONHash('psynergy_particle', 'assets/images/interactable_objects/psynergy_particle.png', 'assets/images/interactable_objects/psynergy_particle.json');
    game.load.atlasJSONHash('psynergy_ball', 'assets/images/interactable_objects/psynergy_ball.png', 'assets/images/interactable_objects/psynergy_ball.json');
}

function load_assets(game) {
    game.load.atlasJSONHash('battle_backgrounds', 'assets/images/battle_backgrounds/battle_backgrounds.png', 'assets/images/battle_backgrounds/battle_backgrounds.json');
    game.load.atlasJSONHash('avatars', 'assets/images/avatars/avatars.png', 'assets/images/avatars/avatars.json');
}

function load_fonts(game) {
    game.load.bitmapFont('gs-bmp-font', 'assets/font/golden-sun.png', 'assets/font/golden-sun.fnt');
    game.load.bitmapFont('gs-item-bmp-font', 'assets/font/gs-item-font.png', 'assets/font/gs-item-font.fnt');
    game.load.bitmapFont('gs-shop-bmp-font', 'assets/font/gs-shop-font.png', 'assets/font/gs-shop-font.fnt');
}

export function load_all(game) {
    load_db_files(game);
    load_misc(game);
    load_assets(game);
    load_buttons(game);
    load_fonts(game);
    game.load.script('color_filters', 'plugins/color_filters.js');
}