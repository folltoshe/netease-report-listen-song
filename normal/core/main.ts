import { fromBuffer } from 'yauzl'
import { ZipFile } from 'yazl'

export interface ZipEntryFile {
  name: string
  buffer: Buffer
}

/**
 * Pack one or more entries into a ZIP buffer.
 */
export const encode = (files: ZipEntryFile[]): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const zip = new ZipFile()
    const chunks: Buffer[] = []
    for (const file of files) zip.addBuffer(file.buffer, file.name)
    zip.end()
    zip.outputStream.on('data', (c: Buffer) => chunks.push(c))
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)))
    zip.outputStream.on('error', reject)
  })

/**
 * Read all file entries out of a ZIP buffer.
 */
export const decode = (buffer: Buffer): Promise<ZipEntryFile[]> =>
  new Promise((resolve, reject) => {
    const files: ZipEntryFile[] = []
    fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err)
      zipfile.readEntry()
      zipfile.on('entry', entry => {
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
          return
        }
        zipfile.openReadStream(entry, (err, stream) => {
          if (err) return reject(err)
          const chunks: Buffer[] = []
          stream.on('data', c => chunks.push(c))
          stream.on('end', () => {
            files.push({ name: entry.fileName, buffer: Buffer.concat(chunks) })
            zipfile.readEntry()
          })
        })
      })
      zipfile.on('end', () => resolve(files))
    })
  })
