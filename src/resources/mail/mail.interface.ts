

export interface requestProp {
  url: string;
  method: string;
  params?: any;
  body?: any;
  headers?: any;
}

export interface sendEmailPayload {
  email?: string,
  subject?: string,
  cc?: string,
  html?: any,
  attachments?: [Express.Multer.File],
}