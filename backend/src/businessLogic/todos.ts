import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoData } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const todoData = new TodoData()

export async function getUserTodos(userId: string): Promise<TodoItem[]> {
  return await todoData.getTodosForUser(userId)
}

export async function getTodo(userId: string, todoId: string): Promise<TodoItem> {
  return todoData.getTodo(userId, todoId)
}

export async function deleteTodo(userId: string, todoId: string): Promise<Boolean> {
  return todoData.deleteTodo(userId, todoId)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<Boolean> {
  return todoData.updateTodo(userId, todoId, updatedTodo)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {

  return await todoData.createTodo({
    userId: userId,
    todoId: uuid.v4(),
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  })
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<string>{
  return await todoData.createAttachmentPresignedUrl(todoId, userId)
}