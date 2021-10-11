export type PromiseResolve<T> = (value: T | PromiseLike<T>) => void
export type PromiseReject = (reason?: any) => void

export default class Deferred<T> {
    promise: Promise<T>
    resolve: PromiseResolve<T> = () => {}
    reject: PromiseReject = () => {}

    constructor() {
      this.promise = new Promise<T>((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    }
  }