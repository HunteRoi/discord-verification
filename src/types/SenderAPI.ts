export interface ISenderAPIData {
	code: string;
	name: string;
}

export interface ISenderAPI<T extends ISenderAPIData> {
	send: (data: any) => Promise<void>;
}
