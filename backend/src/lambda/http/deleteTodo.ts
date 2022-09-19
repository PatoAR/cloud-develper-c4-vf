import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
//import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'

import { createLogger } from '../../../utils/logger'
const logger = createLogger('deleteTodo')

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    logger.info('Deleting todo for userId: ', userId)
    const deleted = await deleteTodo(userId, todoId)

    if (!deleted) {
      return {
        statusCode: 500,
        body: `Error deleting Todo with id: ${todoId}`
      }
    }
    
    logger.info('Succesfully deleted todo ', todoId)
    return {
      statusCode: 200,
      body: `Todo id: ${todoId} has been deleted`
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )

async function deleteTodo(userId: string, todoId: string) {
  let deleted = false
  try {
    await docClient.delete({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      },
    }).promise()
    deleted = true
  } catch (e) {
    logger.error('Error while deleting todo item: ', {
      error: e,
      data: {
        userId,
        todoId,
      }
    })
  }
  return deleted
}