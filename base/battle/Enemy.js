import { SpriteBase } from "../SpriteBase.js";

export class Enemy extends SpriteBase {
    constructor(
        key_name,
        name,
        level,
        turns,
        max_hp,
        max_pp,
        hp_recovery,
        pp_recovery,
        atk,
        def,
        agi,
        luk,
        battle_scale,
        items,
        abilities,
        coins_reward,
        item_reward,
        item_reward_chance,
        exp_reward,
        venus_level,
        mercury_level,
        mars_level,
        jupiter_level,
        venus_power,
        mercury_power,
        mars_power,
        jupiter_power,
        venus_resist,
        mercury_resist,
        mars_resist,
        jupiter_resist
    ) {
        super(key_name, ["battle"]);
        this.key_name = key_name;
        this.name = name;
        this.level = level;
        this.turns = turns;
        this.max_hp = max_hp;
        this.current_hp = max_hp;
        this.max_pp = max_pp;
        this.current_pp = max_pp;
        this.hp_recovery = hp_recovery;
        this.current_hp_recovery = hp_recovery;
        this.pp_recovery = pp_recovery;
        this.current_pp_recovery = pp_recovery;
        this.atk = atk;
        this.current_atk = atk;
        this.def = def;
        this.current_def = def;
        this.agi = agi;
        this.current_agi = agi;
        this.luk = luk;
        this.current_luk = luk;
        this.battle_scale = battle_scale;
        this.items = items;
        this.abilities = abilities;
        this.coins_reward = coins_reward;
        this.item_reward = item_reward;
        this.item_reward_chance = item_reward_chance;
        this.exp_reward = exp_reward;
        this.venus_level = venus_level;
        this.venus_level_current = venus_level;
        this.mercury_level = mercury_level;
        this.mercury_level_current = mercury_level;
        this.mars_level = mars_level;
        this.mars_level_current = mars_level;
        this.jupiter_level = jupiter_level;
        this.jupiter_level_current = jupiter_level;
        this.venus_power = venus_power;
        this.venus_power_current = venus_power;
        this.mercury_power = mercury_power;
        this.mercury_power_current = mercury_power;
        this.mars_power = mars_power;
        this.mars_power_current = mars_power;
        this.jupiter_power = jupiter_power;
        this.jupiter_power_current = jupiter_power;
        this.venus_resist = venus_resist;
        this.venus_resist_current = venus_resist;
        this.mercury_resist = mercury_resist;
        this.mercury_resist_current = mercury_resist;
        this.mars_resist = mars_resist;
        this.mars_resist_current = mars_resist;
        this.jupiter_resist = jupiter_resist;
        this.jupiter_resist_current = jupiter_resist;
    }
}