import { sample } from 'lodash-es'
import { fromBuffer } from 'yauzl'
import { ZipFile } from 'yazl'

export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time))

export const createRandomString = (length: number, source?: string) => {
  const char = source ? String(source) : '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return new Array(length)
    .fill('')
    .map(() => sample(char))
    .join('')
}

export const crerateRandomNumber = (max: number = Number.MAX_SAFE_INTEGER, min: number = 0) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface ZipEntryFile {
  name: string
  buffer: Buffer
}

export const readZip = (buffer: Buffer): Promise<Array<ZipEntryFile>> => {
  return new Promise((resolve, reject) => {
    const files: Array<ZipEntryFile> = []

    fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err)

      zipfile.readEntry()

      zipfile.on('entry', entry => {
        // 忽略目录
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
          return
        }

        zipfile.openReadStream(entry, (err, stream) => {
          if (err) return reject(err)

          const chunks: Buffer[] = []

          stream.on('data', c => chunks.push(c))

          stream.on('end', () => {
            files.push({
              name: entry.fileName,
              buffer: Buffer.concat(chunks),
            })

            zipfile.readEntry()
          })
        })
      })

      zipfile.on('end', () => {
        resolve(files)
      })
    })
  })
}

export const createZip = (files: ZipEntryFile[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const zip = new ZipFile()
    const chunks: Buffer[] = []

    for (const file of files) {
      zip.addBuffer(file.buffer, file.name)
    }

    zip.end()

    zip.outputStream.on('data', (c: Buffer) => chunks.push(c))

    zip.outputStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    zip.outputStream.on('error', reject)
  })
}
