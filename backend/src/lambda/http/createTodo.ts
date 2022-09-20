import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as uuid from 'uuid'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { TodoItem } from '../../models/TodoItem'
import { CreateTodoRequest } from '../../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLogic/todos'
import { createLogger } from '../../../utils/logger'
const logger = createLogger('createTodo')


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event @ createTodo: ', event)
    const userId = getUserId(event)
    const todoId = uuid.v4()
    const parsedBody: CreateTodoRequest = JSON.parse(event.body)

    let newItem: TodoItem
    newItem = await createTodo(parsedBody, userId, todoId)
    
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