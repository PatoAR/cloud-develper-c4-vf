import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { updateTodo } from '../../businessLogic/todos'
import { createLogger } from '../../../utils/logger'
const logger = createLogger('updateTodo')

import { UpdateTodoRequest } from '../../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)

    const updated = await updateTodo(userId, todoId, updatedTodo)

    if (!updated) {
      return {
        statusCode: 500,
          body: `Error updating Todo with id: ${todoId}`
      }
    }
    logger.info('Succesfully updated todo ', todoId)
    return {
      statusCode: 200,
      body: `Todo id: ${todoId} has been updated`
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