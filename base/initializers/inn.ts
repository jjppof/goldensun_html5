import {GoldenSun} from "GoldenSun";

export function initialize_inn(data: GoldenSun, inn_db: any) {
    const inn_list = {};
    for (let i = 0; i < inn_db.length; i++) {
        const inn_data = inn_db[i];
        if (inn_data.inn_id) {
            inn_list[inn_data.inn_id] = inn_data;
        } else {
            data.logger.log_message("Inn data registered without an id. Please double-check.");
        }
    }

    return inn_list;
}
