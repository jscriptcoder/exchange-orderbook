import express, { Request, Response } from 'express'
import next from 'next'
import { NextServer } from 'next/dist/server/next'
import debug from 'debug'
import { start as wsStart } from './wsProxy'

const log = debug('app:index')
const logerr = debug('app:index:error')

const port: number = parseInt(process.env.PORT || '3000', 10)
const dev: boolean = process.env.NODE_ENV !== 'production'
const nextApp: NextServer = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare()
  .then(() => {
    const expressApp = express()

    expressApp.get('*', (req: Request, res: Response) => {
      handle(req, res)
    })

    const httpServer = expressApp.listen(port, () => {
      log(`Server listening on http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`)
    })

    wsStart(httpServer)

  })
  .catch(err => {
    logerr(err)
  })