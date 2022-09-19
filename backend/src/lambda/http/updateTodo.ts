import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import * as AWS from 'aws-sdk'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../../utils/logger'
const logger = createLogger('updateTodo')

import { UpdateTodoRequest } from '../../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

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

async function updateTodo(userId: string, todoId: string, todo: UpdateTodoRequest) {
    let updated = false
    try {
      await docClient.update({
        TableName: todosTable,
          Key: {
            userId,
            todoId
          },
          UpdateExpression:
            'set #name = :name, #dueDate = :duedate, #done = :done',
          ExpressionAttributeValues: {
            ':name': todo.name,
            ':duedate': todo.dueDate,
            ':done': todo.done
          },
          ExpressionAttributeNames: {
            '#name': 'name',
            '#dueDate': 'dueDate',
            '#done': 'done'
          }
        }).promise()
        updated = true
    } catch (e) {
      logger.error('Error updating Todo', {
        error: e,
        data: {
          userId,
          todoId,
          todo
        }
      })
    }

    return updated
}