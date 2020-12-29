import {Inn} from "../Inn";

export function initialize_inn(inn_db) {
    let inn_list = {};
    for (let i = 0; i < inn_db.length; i++) {
        const inn_data = inn_db[i];
        inn_list[inn_data.inn_id] = new Inn(inn_data.inn_id, inn_data.avatar_key, inn_data.cost, inn_data.messages);
    }

    return inn_list;
}
