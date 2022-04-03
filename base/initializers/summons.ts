import {SnapshotData} from "../Snapshot";
import {Summon} from "../Summon";

export function initialize_summons(summons_db, snapshot: SnapshotData) {
    const summons_list = {};
    const snapshot_summons_availability = snapshot?.summons_availability ?? {};
    for (let i = 0; i < summons_db.length; ++i) {
        const summon_data = summons_db[i];
        summons_list[summon_data.key_name] = new Summon(
            summon_data.key_name,
            i,
            summon_data.requirements,
            snapshot_summons_availability[summon_data.key_name] ?? summon_data.available
        );
    }
    return summons_list;
}
