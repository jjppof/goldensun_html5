export function initialize_inn(inn_db) {
    const inn_list = {};
    for (let i = 0; i < inn_db.length; i++) {
        const inn_data = inn_db[i];
        inn_list[inn_data.inn_id] = inn_data;
    }

    return inn_list;
}
