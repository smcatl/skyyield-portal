import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string
        const userType = credentials.userType as string
        
        console.log('Auth attempt:', { email, userType }) // Debug log
        
        // Test credentials for each portal type
        const testUsers: Record<string, { email: string; password: string; name: string }> = {
          'referral': { email: 'referral@skyyield.com', password: 'test123', name: 'John Smith' },
          'location': { email: 'location@skyyield.com', password: 'test123', name: 'ABC Restaurant' },
          'relationship': { email: 'relationship@skyyield.com', password: 'test123', name: 'Strategic Partner' },
          'channel': { email: 'channel@skyyield.com', password: 'test123', name: 'Reseller Corp' },
          'contractor': { email: 'contractor@skyyield.com', password: 'test123', name: 'Tech Services' },
          'employee': { email: 'employee@skyyield.com', password: 'test123', name: 'Staff Member' },
          'admin': { email: 'admin@skyyield.com', password: 'test123', name: 'Administrator' },
        }
        
        const testUser = testUsers[userType]
        
        console.log('Looking for user:', testUser) // Debug log
        
        // Check if credentials match for the selected portal type
        if (testUser && email === testUser.email && password === testUser.password) {
          console.log('Auth successful!') // Debug log
          return {
            id: `${userType}-user-1`,
            email: testUser.email,
            name: testUser.name,
            userType: userType
          }
        }
        
        console.log('Auth failed') // Debug log
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.userType = (user as any).userType as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).userType = token.userType as string
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