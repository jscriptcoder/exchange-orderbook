type PromiseResolve<T> = (value: T | PromiseLike<T>) => void
type PromiseReject = (reason?: any) => void

// Why is this not a built-in feature? anti-pattern? :-/
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