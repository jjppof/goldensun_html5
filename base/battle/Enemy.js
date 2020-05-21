export class Enemy {
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
        items,
        abilities,
        coins_reward,
        item_reward,
        item_reward_change,
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
        this.items = items;
        this.abilities = abilities;
        this.coins_reward = coins_reward;
        this.item_reward = item_reward;
        this.item_reward_change = item_reward_change;
        this.exp_reward = exp_reward;
        this.venus_level = venus_level;
        this.current_venus_level = venus_level;
        this.mercury_level = mercury_level;
        this.current_mercury_level = mercury_level;
        this.mars_level = mars_level;
        this.current_mars_level = mars_level;
        this.jupiter_level = jupiter_level;
        this.current_jupiter_level = jupiter_level;
        this.venus_power = venus_power;
        this.current_venus_power = venus_power;
        this.mercury_power = mercury_power;
        this.current_mercury_power = mercury_power;
        this.mars_power = mars_power;
        this.current_mars_power = mars_power;
        this.jupiter_power = jupiter_power;
        this.current_jupiter_power = jupiter_power;
        this.venus_resist = venus_resist;
        this.current_venus_resist = venus_resist;
        this.mercury_resist = mercury_resist;
        this.current_mercury_resist = mercury_resist;
        this.mars_resist = mars_resist;
        this.current_mars_resist = mars_resist;
        this.jupiter_resist = jupiter_resist;
        this.current_jupiter_resist = jupiter_resist;
    }
}