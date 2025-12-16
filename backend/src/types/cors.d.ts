declare module 'cors' {
  import { RequestHandler } from 'express';
  type CorsOptions = any;
  function cors(options?: CorsOptions): RequestHandler;
  namespace cors {}
  export = cors;
}
