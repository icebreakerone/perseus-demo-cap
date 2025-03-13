export interface ITokenRequest {
  client_id?: string | null
  client_secret?: string | null
  grant_type?: string | null
  password: string
  scope?: string | null
  username: string
}

export interface IToken {
  access_token: number
  token_type: string
}

export interface IValidationError {
  loc: [string | number]
  msg: string
  type: string
}
