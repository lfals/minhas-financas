import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <SignUp
      path="/sign-up"
      signInUrl="/sign-in"
      forceRedirectUrl="/dashboard"
      fallbackRedirectUrl="/dashboard"
    />
  )
}
