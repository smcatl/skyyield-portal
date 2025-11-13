import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { JWT } from "@auth/core/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      email?: string | null
      name?: string | null
      userType?: string
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string
    userType?: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string
        
        if (email === "test@skyyield.com" && password === "test123") {
          return {
            id: "test-user-1",
            email: "test@skyyield.com",
            name: "Test User",
            userType: "referral_partner"
          }
        }
        
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string
        token.userType = (user as any).userType as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string
        session.user.userType = token.userType as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt"
  }
})