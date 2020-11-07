import { Summon } from "../Summon";

export function initialize_summons(summons_db) {
    let summons_list = {};
    for (let i = 0; i < summons_db.length; ++i) {
        const summon_data = summons_db[i];
        summons_list[summon_data.key_name] = new Summon(
            summon_data.key_name,
            i,
            summon_data.requirements,
            summon_data.available
        );
    }
    return summons_list;
}