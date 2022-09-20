import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

import { createLogger } from '../../utils/logger'
const logger = createLogger('dataLayer')
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

function createDynamoDBClient() {
  //if (process.env.IS_OFFLINE) {
  //  console.log('Creating a local DynamoDB instance')
  //  return new XAWS.DynamoDB.DocumentClient({
  //    region: 'localhost',
  //    endpoint: 'http://localhost:8000'
  //  })
  //}
  return new XAWS.DynamoDB.DocumentClient()
}

export class TodoData {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly S3 = new XAWS.S3({signatureVersion: 'v4'}),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucket = process.env.ATTACHMENT_S3_BUCKET
  ) {
  }

  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()
  
    return result.Items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    logger.info('New todo created: ', todo)

    return todo
  }

  async updateTodo(userId: string, todoId: string, todo: UpdateTodoRequest): Promise<Boolean> {
    let updated = false
    try {
      await this.docClient.update({
        TableName: this.todosTable,
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
  
  async deleteTodo(userId: string, todoId: string): Promise<Boolean> {
    let deleted = false
    try {
      await this.docClient.delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
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

  async createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string> {
    
    const uploadUrl = this.S3.getSignedUrl("putObject", {
      Bucket: this.bucket,
      Key: todoId,
      Expires: 300
    })

    await this.docClient.update({
      TableName: this.todosTable,
      Key: { userId, todoId },
      UpdateExpression: "set attachmentUrl=:url",
      ExpressionAttributeValues: {
        ":url": uploadUrl.split("?")[0]
      },
      ReturnValues: "UPDATED_NEW"
    }).promise()

    return uploadUrl
  }
}