import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { createLogger } from '../../../utils/logger'
const logger = createLogger('createTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event @ createTodo: ', event)
    const userId = getUserId(event)
    const todoId = uuid.v4()
    const parsedBody = JSON.parse(event.body)

    const newItem = {
      userId: userId,
      todoId: todoId,
      ...parsedBody
    }

    await docClient.put({
      TableName: todosTable,
      Item: newItem
    }).promise()
    
    logger.info('New todo created: ', newItem)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newItem
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)