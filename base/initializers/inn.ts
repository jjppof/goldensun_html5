export function initialize_inn(inn_db) {
    const inn_list = {};
    for (let i = 0; i < inn_db.length; i++) {
        const inn_data = inn_db[i];
        if (inn_data.inn_id) {
            inn_list[inn_data.inn_id] = inn_data;
        } else {
            console.warn("Inn data registered without an id. Please double-check.");
        }
    }

    return inn_list;
}
