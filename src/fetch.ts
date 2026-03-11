import { merge } from 'lodash-es'

import Axios, { type Method as AxiosMethod, type AxiosRequestConfig } from 'axios'

namespace Fetch {
  export type Method = AxiosMethod

  export type BodyView = Buffer | object | string | null
  export type ResponseType = 'BUFFER' | 'BLOB' | 'JSON' | 'TEXT'

  export interface Response<Body = any> {
    statusCode: number
    statusText: string
    url: string
    headers: Record<string, any>
    body: Body
  }

  export type OriginRequestConfig = AxiosRequestConfig

  export interface RequestOptions {
    method?: Method
    body?: {
      data: BodyView
      type?: 'TEXT' | 'JSON' | 'FORM' | 'FORM_DATA' | 'STREAM'
    }
    redirect?: {
      maxCount?: number
    }
    response?: {
      type?: ResponseType
    }
    events?: {
      onResponse?: (response: Response) => void
    }
    headers?: Record<string, any>
    timeout?: number
    params?: Record<string, any>
    cookies?: Record<string, string>
    config?: Omit<OriginRequestConfig, 'data' | 'headers' | 'method'>
  }

  export interface RequestObject<R = Response> {
    contoller: {
      aborted: boolean
      abort: () => void
    }
    request: Promise<R>
    response: R | null
  }
}

export const CONSTANTS = {
  DEFAULT_HEADERS: {},
  DEFAULT_TIMEOUT: 15000,
  HTTPS_RXP: /^https:/,
}

const buildRequestConfig = (url: string, options: Fetch.RequestOptions): Fetch.OriginRequestConfig => {
  const result: Fetch.OriginRequestConfig = {
    url,
    method: options.method ?? 'GET',
    headers: options.headers,
    validateStatus: () => true,
    maxRedirects: options.redirect?.maxCount || 3,
    ...options.config,
  }

  result.timeout = isNaN(Number(options.timeout)) ? CONSTANTS.DEFAULT_TIMEOUT : Number(options.timeout)
  result.headers = merge({ Accept: 'application/json' }, { ...CONSTANTS.DEFAULT_HEADERS }, options.headers)

  if (result.method!.toUpperCase() === 'POST' && options.body) {
    if (!options.body.type) options.body.type = typeof options.body.data === 'object' ? 'JSON' : 'TEXT'
    if (result.headers['Content-Type'] || result.headers['content-type']) {
      result.data = options.body.data
    } else {
      switch (options.body.type) {
        case 'TEXT':
          result.headers['Content-Type'] = 'text/plain'
          result.data = String(options.body.data ?? '')
          break
        case 'JSON':
          result.headers['Content-Type'] = 'application/json'
          result.data = typeof options.body.data === 'object' ? JSON.stringify(options.body.data ?? {}) : options.body.data
          break
        case 'FORM':
          result.headers['Content-Type'] = 'application/x-www-form-urlencoded'
          const form = []
          for (const [key, value] of Object.entries(options.body.data ?? {})) {
            let encodedKey = encodeURIComponent(key)
            let encodedValue = encodeURIComponent(value)
            form.push(`${encodedKey}=${encodedValue}`)
          }
          result.data = form.join('&')
          break
        case 'FORM_DATA':
          result.headers['Content-Type'] = 'multipart/form-data'
          result.data = options.body.data
          break
        case 'STREAM':
          result.headers['Content-Type'] = 'application/octet-stream'
          result.data = options.body.data
          break
        default:
          result.data = options.body.data
      }
    }
  }
  if (options.params) {
    const params = new URLSearchParams()
    for (const key in options.params) {
      const data = options.params[key]
      const param = typeof data === 'object' ? JSON.stringify(data) : data
      params.append(key, param)
    }
    result.url = `${result.url}${result.url!.includes('?') ? '&' : '?'}${params.toString()}`
  }
  if (options.response?.type) {
    switch (options.response.type) {
      case 'TEXT':
        result.responseType = 'text'
        break
      case 'BLOB':
        result.responseType = 'blob'
        break
      case 'BUFFER':
        result.responseType = 'arraybuffer'
        break
      case 'JSON':
      default:
        result.responseType = 'json'
        break
    }
  }
  if (options.cookies) {
    result.headers['Cookie'] = Object.entries(options.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
  }

  return result
}

/**
 * 创建一个基本请求
 * @param url 链接
 * @param options 配置
 * @returns
 */
export const createBaseFetch = (url: string, config: Fetch.RequestOptions = {}) => {
  const options = buildRequestConfig(url, config)

  const contoller = new AbortController()
  options.signal = contoller.signal

  const client: Fetch.RequestObject = Object.create({})
  console.debug(`Fetch [${options.method!.toUpperCase()}] --> ${url}`)

  client.request = Axios.request(options).then(resp => {
    const response: Fetch.Response = {
      url: resp.request?.responseURL ?? options.url,
      statusCode: resp.status ?? 0,
      statusText: resp.statusText ?? '',
      headers: resp.headers,
      body: resp.data,
    }

    if (config.events) {
      if (typeof config.events.onResponse === 'function') void config.events.onResponse(response)
    }

    client.response = response
    return response
  })
  client.response = null
  client.contoller = {
    aborted: false,
    abort: () => {
      if (client.response || client.contoller.aborted) return

      client.response = null
      client.contoller.aborted = true
      contoller.abort()

      console.debug(`Aborted Request ${options.url}`)
    },
  }

  return client
}
