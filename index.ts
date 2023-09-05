// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// import JSEncrypt from 'npm:jsencrypt@^3.3.2'
// import CryptoJS from 'npm:crypto-js@^4.1.1'
import { window } from './mgssdk.min.js'

import { JSEncrypt } from './Encrypt.min.js'

console.log('230901-小翼管家-手机充值')
console.log(Deno.cwd()) //当前目录

function getClientKey() {
  const t = new JSEncrypt()
  const n = { clientRsaPrivateKey: t.getPrivateKeyB64(), clientRsaPublicKey: t.getPublicKeyB64() }
  return n
}

const u = '0123456789abcdefghijklmnopqrstuvwxyz',
  s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  f = '='

function i(t: number) {
  return u.charAt(t)
}

function encodeDecode(t: string) {
  let n,
    e = '',
    r = 0,
    o = 0
  for (n = 0; n < t.length && t.charAt(n) !== f; ++n) {
    const a = s.indexOf(t.charAt(n))
    a < 0 ||
      (0 === r
        ? ((e += i(a >> 2)), (o = 3 & a), (r = 1))
        : 1 === r
        ? ((e += i((o << 2) | (a >> 4))), (o = 15 & a), (r = 2))
        : 2 === r
        ? ((e += i(o)), (e += i(a >> 2)), (o = 3 & a), (r = 3))
        : ((e += i((o << 2) | (a >> 4))), (e += i(15 & a)), (r = 0)))
  }
  return 1 === r && (e += i(o << 2)), e
}

JSEncrypt.prototype.decryptLong = function (t: string) {
  const n = this.getKey(),
    e = (n.n.bitLength() + 7) >> 3
  try {
    const r = encodeDecode(t)
    let i = ''
    if (r.length > e) {
      return (
        r.match(/.{1,256}/g)!.forEach(function (t: string) {
          const e = n.decrypt(t)
          i += e
        }),
        i
      )
    }
    return n.decrypt(encodeDecode(t))
  } catch (_t) {
    return !1
  }
}

function rpc_call(rpcData: object, operationType: string) {
  const l = {
    baseURL: 'https://spanner.bestpay.com.cn:10081',
    appid: 'FC1902C211615',
    workspaceid: 'PRD',
    signType: 'md5',
    secretKey: '63cb711f852f6ab6f1ecc9ade8f518c7',
    encryptType: 2,
    publicKey:
      '\n-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAEhYXsxs453JtwhnUbksd1oNu0ujvM\n+gRo1+HiRg4ZSr0GMjDf5cMToOyNQPALyhs9Hc+OIt0SirlE/efpl3NhfQ==\n-----END PUBLIC KEY-----\n',
    extraHttpConfig: {},
    extraHeaderInfos: {
      'event-context': '{"env":"PRD","tntId":"0108"}'
    }
  }
  const response = window.MP.MGS.call('rpc', {
    ...l,
    method: 'post',
    operationType: operationType,
    data: rpcData
  })
  return response
}

serve(async req => {
  // 获取url参数
  const url = new URL(req.url, `http://${req.headers.get('host')}`)
  const searchParams = new URLSearchParams(url.search)
  const type = searchParams.get('type')

  if (req.method == 'GET') {
    const html = await Deno.readTextFile('wapPay.html')
    return new Response(html, { headers: { 'Content-Type': 'text/html' } })
  }

  // 获取json请求数据
  const data = await req.json()
  // console.log(data)

  let response = {}
  console.log(`XiaoYiGuanJia: ${type}`)

  switch (type) {
    case 'getClientKey':
      response = getClientKey()
      break
    case 'aeskey_en': {
      const r = {
        openId: data.openId,
        clientRsaPublicKey: data.clientRsaPublicKey
      }
      const i = new JSEncrypt()
      i.setPublicKey(data.serverRsaPublicKey)
      let encData
      for (encData = i.encrypt(JSON.stringify(r)); /==$/.test(encData); ) encData = i.encrypt(JSON.stringify(r))
      response = {
        encData: encData,
        agreeId: data.agreeId
      }
      break
    }
    case 'aeskey_en1': {
      const jsEncrypt = new JSEncrypt()
      jsEncrypt.setPrivateKey(data.clientRsaPrivateKey)
      response = JSON.parse(jsEncrypt.decryptLong(data.result))
      break
    }
    case 'aeskey_en2': {
      const jsEncrypt = new JSEncrypt()
      console.log(data.PublicKey)
      console.log(data.key)
      jsEncrypt.setPublicKey(data.PublicKey)
      response = jsEncrypt.encrypt(data.key)
      console.log(response)
      break
    }
    case 'rpc_query': {
      // 查询手机号码归属地
      try {
        response = await rpc_call(
          data,
          'com.bestpay.handyservice.communication.product.service.api.basic.IBasicService.queryPhoneAttribution'
        )
        console.log('rpc_order success: ', response)
      } catch (error) {
        response = error
        console.log('rpc_order error: ', error)
      }
      break
    }
    case 'rpc_order': {
      // 下单
      try {
        response = await rpc_call(
          data,
          'com.bestpay.handyservice.communication.product.service.api.h5.IH5Service.aggregationRechargeOrder'
        )
        console.log('rpc_order success: ', response)
      } catch (error) {
        response = error
        console.log('rpc_order error: ', error)
      }
      break
    }
    case 'rpc_record': {
      // 记录
      try {
        response = await rpc_call(
          data,
          'com.bestpay.handyservice.communication.product.service.api.basic.IBasicService.paymentRecordQuery'
        )
        console.log('rpc_order success: ', response)
      } catch (error) {
        response = error
        console.log('rpc_order error: ', error)
      }
      break
    }
    default:
      break
  }
  return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } })
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
/*
// 本地调试
curl --request POST \
  --url 'http://localhost:8000/functions?type=aeskey_en2' \
  --header 'content-type: application/json' \
  --data '{"PublicKey":"MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCs/2FK9LHT2jx5+SrzKG8QpHHifgQ2Szqx+ApFjuQNIymtuByI0kh/d41J74l6sdpcXY+QOfiVqg2hzbG++A9SsTIIzqCOhcURmyfOM026ieBWTOyT98mNtju2ne2YzxJ+tu0J6NyBN7SIVG284TlFikNmA1CPpZ+zIc1de/nrwQIDAQAB","key":"DD8HThMTaA7TGLia"}'
*/
// docker部署 - docker run -it --init --name XiaoYiGuanJia -p 8000:8000 -v /www/wwwroot/XiaoYiGuanJia:/app -w /app denoland/deno:latest run --allow-all index.ts
// 本地运行 - deno run --allow-all index.ts
