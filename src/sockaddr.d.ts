declare module 'sockaddr' {
  function sockaddr(
    string: any,
    options?: {
      defaultPort?: number
    }
  ):
    | {
        port: number
        host: string
      }
    | {
        path: string
      }

  export = sockaddr
}
