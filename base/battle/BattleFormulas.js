//please check http://forum.goldensunhacking.net/index.php?topic=2460

export class BattleFormulas {
    static player_turn_speed(agility, priority_move = false, multi_turn = false) {
        return (agility + ((agility * _.random(0, 65535)) >> 20)) * (multi_turn ? 0.5 : 1) + (priority_move ? 1e4 : 0);
    }

    static enemy_turn_speed(agility, turn_number, turn_quantity, priority_move = false) {
        const priority = priority_move ? 1e4 : 0;
        if (turn_number === 1) {
            return agility + priority;
        }
        if (turn_quantity === 2) {
            return (agility >> 1) + priority;
        }
        if (turn_quantity === 3) {
            switch (turn_number) {
                case 2: return agility * 3/4 + priority;
                case 3: return (agility >> 1) + priority;
            }
        }
        if (turn_quantity === 4) {
            switch (turn_number) {
                case 2: agility * 5/6 + priority;
                case 3: agility * 4/6 + priority;
                case 4: (agility >> 1) + priority;
            }
        }
        return (agility >> 1) + priority;
    }
}