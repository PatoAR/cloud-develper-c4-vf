import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'

import { createLogger } from '../../../utils/logger'
const logger = createLogger('deleteTodo')

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

