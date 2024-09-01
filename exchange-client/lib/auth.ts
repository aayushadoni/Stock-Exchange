import CredentialsProvider from "next-auth/providers/credentials"
import z from "zod";
import bcrypt from 'bcrypt';
import { SQLService } from "./sqlService"

const credentialsInput = z.object({
    email: z.string().email(),
    password: z.string()
})

const postgresUri = process.env.DATABASE_URL || ""
export const authOptions = {
    providers: [
      CredentialsProvider({
          id: "email-login",
          name: 'email-login',
          credentials: {
            email: { label: "email", type: "email", required: true },
            password: { label: "password", type: "password", required: true },
          },
          async authorize(credentials: any) {

            const { success } = credentialsInput.safeParse({email:credentials.email, password:credentials.password});
            if(!success)
                {console.error("Validation failed:");
                  return null;}

            const sqlService = SQLService.getInstance(postgresUri);
            const existingUser = await sqlService.getUserByEmail(credentials.email)

            if (!existingUser) 
                {
                    try {
                        const hashedPassword = await bcrypt.hash(credentials.password, 10);
            
                        const newUser = await sqlService.createUser(credentials.email,hashedPassword);
            
                        return {
                          id: newUser.id.toString(),
                        };
                      } catch (e) {
                        console.error(e);
                        return null;
                      }
                }



            const isPasswordValid = await bcrypt.compare(credentials.password,existingUser.password);

            if (!isPasswordValid) 
                {return null;}

            return {
                id: existingUser.id.toString()
              };
          },
        }),

        
    ],
    pages: {
        signIn: "/login"
    },
    secret: process.env.NEXT_PUBLIC_JWT_SECRET || "secret",
    callbacks: {
        async jwt({ token, user }: any) {
          if (user) {
            token.userId = user.id;
          }
          return token;
        },
        async session({ session, token }: any) {
          session.user.id = token.userId;
          return session;
        },
      },
    };
  