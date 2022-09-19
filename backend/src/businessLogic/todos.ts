import { TodoData } from '../dataLayer/todosAccess'
const todoData = new TodoData()

export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string>{
  return await todoData.createAttachmentPresignedUrl(todoId, userId)
}