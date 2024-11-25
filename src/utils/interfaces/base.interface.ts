import { YesOrNo } from "../enums/base.enum";

export interface BackDaterResponse extends Object {
	format: string;
	array: backDaterArray[];
}

export interface backDaterArray extends Object {
	start: Date;
	end: Date;
	day?: string;
	month?: string;
	raw_date?: Date;
}

export interface FacetStage {
	[key: string]: any;
}

export interface MatchStage$and {
	$and: any[];
}

export interface ProductMgtDto {
	name?: string;
	description?: string;
	images?: string[];
	quantity_sold?: number;
	quantity?: number;
	price?: number;
	discounted_price?: number;
	is_discounted?: boolean;
}

export interface ReadWriteDto {
	read: YesOrNo;
	write: YesOrNo;
}
