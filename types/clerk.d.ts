declare module "@clerk/nextjs" {
  import type { ComponentType, ReactNode } from "react"

  export const ClerkProvider: ComponentType<{ children?: ReactNode } & Record<string, unknown>>
  export const SignIn: ComponentType<Record<string, unknown>>
  export const SignUp: ComponentType<Record<string, unknown>>
  export const UserButton: ComponentType<Record<string, unknown>>
}

declare module "@clerk/nextjs/server" {
  export function auth(): Promise<{
    userId: string | null
  }>

  export function currentUser(): Promise<{
    firstName?: string | null
    fullName?: string | null
    lastName?: string | null
  } | null>

  export function createRouteMatcher(patterns: string[]): (request: unknown) => boolean

  export function clerkMiddleware(
    handler: (
      auth: {
        protect(): Promise<void>
      },
      request: unknown
    ) => Promise<unknown> | unknown
  ): unknown
}
