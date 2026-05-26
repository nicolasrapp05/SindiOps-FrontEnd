import { useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@/components/ui/sonner"
import { useAuthStore } from "@/store/auth-store"
import { queryClient } from "@/lib/queryClient"
import { router } from "@/routes"

export default function App() {
  useEffect(() => {
    useAuthStore.getState().initSession()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
