import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

import { createLogger } from '../../utils/logger'
const logger = createLogger('dataLayer')

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
    private readonly dynamoDBClient: DocumentClient = createDynamoDBClient(),
    private readonly S3 = new XAWS.S3({signatureVersion: 'v4'}),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucket = process.env.ATTACHMENT_S3_BUCKET
  ) {
  }
 
  async createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string> {
    logger.info('Creating pre-signed URL for todoId: ', todoId)    
    const uploadUrl = this.S3.getSignedUrl("putObject", {
      Bucket: this.bucket,
      Key: todoId,
      Expires: 300
    })
    logger.info('pre-signed URL: ', uploadUrl)    
    
    await this.dynamoDBClient.update({
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