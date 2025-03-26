// Type definitions for missing modules
declare module 'passport-google-oauth20' {
  import { Request } from 'express';
  import OAuth2Strategy from 'passport-oauth2';
  
  interface Profile extends OAuth2Strategy.Profile {
    id: string;
    displayName: string;
    emails?: Array<{ value: string; type?: string }>;
    photos?: Array<{ value: string }>;
  }
  
  interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
  }
  
  interface StrategyOptionsWithRequest extends StrategyOptions {
    passReqToCallback: true;
  }
  
  type VerifyCallback = (err?: Error | null, user?: any, info?: any) => void;
  
  type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void | Promise<any>;
  
  type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void | Promise<any>;
  
  class Strategy extends OAuth2Strategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyFunction
    );
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithRequest
    );
    
    name: string;
    authenticate(req: Request, options?: any): void;
  }
}

declare module 'draft-js' {
  export const Editor: any;
  export const EditorState: any;
  export const RichUtils: any;
  export const ContentState: any;
  export const convertToRaw: any;
  export const convertFromRaw: any;
}