import {GoldenSun} from "../GoldenSun";
import {SnapshotData} from "../Snapshot";
import {Summon} from "../Summon";

export function initialize_summons(data: GoldenSun, summons_db: any, snapshot: SnapshotData) {
    const summons_list = {};
    const snapshot_summons_availability = snapshot?.summons_availability ?? {};
    for (let i = 0; i < summons_db.length; ++i) {
        const summon_data = summons_db[i];
        if (summon_data.key_name) {
            summons_list[summon_data.key_name] = new Summon(
                summon_data.key_name,
                i,
                summon_data.requirements,
                snapshot_summons_availability[summon_data.key_name] ?? summon_data.available
            );
        } else {
            data.logger.log_message("Summon registered without a key name. Please double-check.");
        }
    }
    return summons_list;
}
