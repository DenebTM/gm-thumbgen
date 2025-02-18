import path from 'node:path'
import { promises as fs, existsSync as exists } from 'node:fs'
import { isIPv6 } from 'node:net'
import os from 'os'
import express, { type Request } from 'express'
import morgan from 'morgan'
import sockaddr from 'sockaddr'

import { args } from './args'
import {
  getSourceFilename,
  getThumbFilename,
  createThumb,
  getThumbUrl,
} from './util'

if (args.help) {
  console.log(args)
  process.exit()
}

const app = express()
app.use(morgan('combined'))

app.get('/{*path}', async (req: Request<{ path?: string[] }>, res) => {
  const urlPath =
    typeof req.params.path != 'undefined' && path.join(...req.params.path)

  try {
    if (!urlPath) {
      throw ['Missing file name', 400]
    }

    const targetPath = path.join(args.outputBase, urlPath)

    // serve existing file if it happens to exist in `outputBase`
    if (exists(targetPath)) {
      res.sendFile(path.resolve(targetPath))
      return
    }

    const sourceFilename = getSourceFilename(urlPath)

    const thumbFilename = getThumbFilename(urlPath)
    if (!exists(path.dirname(thumbFilename))) {
      await fs.mkdir(path.dirname(thumbFilename), { recursive: true })
    }

    // generate new thumbnail if one does not already exist
    if (!exists(thumbFilename)) {
      try {
        await createThumb(sourceFilename, thumbFilename)
      } catch (err) {
        throw [String(err), 500]
      }
    }

    // redirect to new or existing thumbnail
    res.redirect(308, getThumbUrl(thumbFilename))
  } catch (err) {
    let [message, status] = ['', 500]
    if (err instanceof Array) {
      const [] = ([message, status] = err)
    } else {
      message = err
    }

    res.status(status)
    res.send('Error: ' + message)
  }
})

const addr = sockaddr(args.bind, { defaultPort: 3000 })
const addrString =
  'host' in addr
    ? `${isIPv6(addr.host) ? `[${addr.host}]` : addr.host}:${addr.port}`
    : addr.path

const server = app.listen(addr, () => {
  console.log(`Listening on ${addrString}`)

  const sigh = (signal: NodeJS.Signals) =>
    server.close(() => {
      console.log('Shutting down')
      process.exit(signal == 'SIGTERM' ? 0 : 128 + os.constants.signals[signal])
    })

  process.on('SIGINT', sigh)
  process.on('SIGTERM', sigh)
})
