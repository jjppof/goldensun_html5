export type ShopItem = {
    key_name: string;
    quantity: number;
};

export class Shop {
    public key_name: string;
    public dialog_key: string;
    public avatar_key: string;
    public item_list: ShopItem[];
    constructor(key_name: string, dialog_key: string, avatar_key: string, item_list: ShopItem[]) {
        this.key_name = key_name;
        this.dialog_key = dialog_key;
        this.avatar_key = avatar_key;
        this.item_list = item_list;
    }
}
