export class TableFiltersDto {

    limit?: number;
    page?: number;
    searchtxt?: string;
    start?: Date;
    end?: Date;
    showInactives?: boolean;

    constructor() {
        this.limit = 25,
        this.page = 1,
        this.searchtxt = ''
        //this.start=new Date()
        //this.end= Date.now()
        this.showInactives=false
    }
}