import { sample } from 'lodash-es'

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

export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time))
