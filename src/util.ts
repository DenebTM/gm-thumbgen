import path from 'node:path'
import { promises as fs, existsSync as exists } from 'node:fs'
import gm from 'gm'
import { promisify } from 'node:util'

import { validExtensions } from './filetypes'
import { args } from './args'

export function getSourceFilename(urlPath: string): string {
  const { inputBase } = args

  const sourceFilename = path.join(inputBase, urlPath)
  if (!exists(sourceFilename)) {
    throw ['Source file does not exist', 404]
  }
  if (!validExtensions.includes(path.extname(urlPath).toLowerCase())) {
    throw ['Source file is not an image', 400]
  }

  return sourceFilename
}

export function getThumbFilename(urlPath: string): string {
  const { outputBase } = args

  const thumbExtname = path.extname(urlPath) === '.gif' ? '' : '.webp'
  const thumbFilename = path.join(outputBase, urlPath + thumbExtname)

  return thumbFilename
}

export function getThumbUrl(thumbFilename: string): string {
  return (
    args.urlPrefix + path.sep + path.relative(args.outputBase, thumbFilename)
  )
}

export async function createThumb(
  sourceFilename: string,
  thumbFilename: string
): Promise<void> {
  switch (path.extname(sourceFilename)) {
    // copy GIFs instead of generating a thumbnail
    case '.gif':
      await fs.copyFile(sourceFilename, thumbFilename)
      break

    default:
      console.log(`Generating thumbnail for '${sourceFilename}'`)

      try {
        await promisify<void>(callback =>
          gm(sourceFilename)
            .resize(512, 512, '^')
            .gravity('Center')
            .extent(512, 512)
            .write(thumbFilename, err => err !== null && callback(err))
        )()
      } catch (err) {
        console.error(err)
        throw ['Thumbnail generation failed', 500]
      }
  }
}
