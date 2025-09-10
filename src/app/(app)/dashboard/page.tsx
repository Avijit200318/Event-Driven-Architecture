"use client"
import { Pagination } from '@/components/Pagination'
import { TodoForm } from '@/components/TodoForm'
import { TodoItem } from '@/components/TodoItem'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUser } from '@clerk/nextjs'
import { Todo } from '@prisma/client'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import { useDebounceValue } from 'usehooks-ts'

export default function page() {
  // get user in frontend using clerk
  const {user} = useUser();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  const [debounceSearchTerm] = useDebounceValue(searchTerm, 300);

  const fetchTodos = useCallback(async (page: number) => {
    try {
      const response = await fetch(`/api/todos?page=${page}&search=${debounceSearchTerm}`);

      if(!response.ok){
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      setTodos(data.todos);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.log("Error while fetching todos: ", error);
    } finally{
      setLoading(false);
    }
  }, [debounceSearchTerm]);

  useEffect(() => {
    fetchTodos(1);
    // when the pages loaded we want to run this. and for the first time the number of page is 1.
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    const response = await fetch("/api/subscription");
    if(!response.ok){
      throw new Error("Error while fetching the user subscription details");
    }
    const data = await response.json();
    setIsSubscribed(data.isSubscribed)
  };

  const handleAddTodo = async (title: string) => {
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({title})
      });

      if(!response.ok){
        throw new Error("Failed to add todos");
      }

      await fetchTodos(currentPage);
    } catch (error) {
      console.log("Some Error occur: ", error);
    }
  }

  const handleUpdateTodo = async(id: string, complete: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({complete})
      })

      if(!response.ok){
        throw new Error("Error while updating the todos");
      }

      await fetchTodos(currentPage);
    } catch (error) {
      console.log("Error in update function: ", error);
    }
  }

  const deleteTodo = async(id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      })

      if(!response.ok){
        throw new Error("Error while deleteing the todos");
      }

      await fetchTodos(currentPage);
    } catch (error) {
      console.log("Error in delete function: ", error);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl mb-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Welcome, {user?.emailAddresses[0].emailAddress}!
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Todo</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoForm onSubmit={(title) => handleAddTodo(title)} />
        </CardContent>
      </Card>
      {!isSubscribed && todos.length >= 3 && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You&apos;ve reached the maximum number of free todos.{" "}
            <Link href="/subscribe" className="font-medium underline">
              Subscribe now
            </Link>{" "}
            to add more.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Your Todos</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          {loading ? (
            <p className="text-center text-muted-foreground">
              Loading your todos...
            </p>
          ) : todos.length === 0 ? (
            <p className="text-center text-muted-foreground">
              You don&apos;t have any todos yet. Add one above!
            </p>
          ) : (
            <>
              <ul className="space-y-4">
                {todos.map((todo: Todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onUpdate={handleUpdateTodo}
                    onDelete={deleteTodo}
                  />
                ))}
              </ul>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchTodos(page)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
