export class Inn {
    public inn_id: string;
    public avatar_key: string;
    public cost: number;
    public messages: any;

    constructor(
        inn_id: string,
        avatar_key: string,
        cost: number,
        message: {
            welcome_message: string;
            price_message: string;
            cancel_message: string;
            stay_message: string;
            goodbye_message: string;
            not_enough_coins: string;
        }
    ) {
        this.inn_id = inn_id;
        this.avatar_key = avatar_key;
        this.cost = cost;
        this.messages = {
            welcome_message: message.welcome_message,
            price_message: message.price_message,
            cancel_message: message.cancel_message,
            stay_message: message.stay_message,
            goodbye_message: message.goodbye_message,
            not_enough_coins: message.not_enough_coins,
        };
    }
}
