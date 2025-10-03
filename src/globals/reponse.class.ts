export class ResponseGeneric {

    success: boolean;
    message: string;
    data: any[] | any;
    exception: any[];

    constructor() {
        this.success = false;
        this.message = '';
        this.data = [];
        this.exception = [];
    }

}