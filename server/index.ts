import express, { Request, Response } from 'express'
import next from 'next'
import { NextServer } from 'next/dist/server/next'
import debug from 'debug'
import { start as wsStart } from './wsProxy'
import { port, prod, domain } from '../utils/config'

const log = debug('app:index')
const logerr = debug('app:index:error')

const dev: boolean = !prod
const nextApp: NextServer = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare()
  .then(() => {
    const expressApp = express()

    expressApp.get('*', (req: Request, res: Response) => {
      handle(req, res)
    })

    const httpServer = expressApp.listen(port, () => {
      log(`Server listening on http://${domain}:${port} as ${dev ? 'development' : 'production'}`)
    })

    // wsStart(httpServer) // [DEPRECATED]

  })
  .catch(error => {
    logerr('[nextApp] Server error>', error)
  })