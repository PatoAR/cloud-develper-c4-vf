import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import { JwtPayload } from '../../auth/JwtPayload'
import { createLogger } from '../../../utils/logger'
import Axios from 'axios'
const logger = createLogger('auth')

const jwksUrl = 'https://dev-iufc1m2w.us.auth0.com/.well-known/jwks.json'

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Requesting User authorization', {
    key: event.authorizationToken
  })
  
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User authorized',
    jwtToken
    )
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.info('User not authorized',
    { error: e.message }
    )
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const cert = await getCertificate(jwksUrl)

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

// getting token
function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('Missing authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

// getting certificate
async function getCertificate(url: string): Promise<string> {
  let cert: string
  try {
    const response = await Axios.get(url)
    const pem = response.data['keys'][0]['x5c'][0]
    cert = `-----BEGIN CERTIFICATE-----\n${pem}\n-----END CERTIFICATE-----`;
  } catch (err) {
    logger.error('Certificate error: ', { error: err.message })
  }
  return cert
}