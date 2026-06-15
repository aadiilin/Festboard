"use client"
import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <Card className="glass-card max-w-md w-full border-destructive/50">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mb-2">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Please try refreshing the page.
              </p>
              <Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}>
                <RefreshCw className="mr-2 h-4 w-4" />Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
