# Chapter 2: Authentication & Authorization System

Great job on mastering data persistence with [Chapter 1: Data Persistence Layer (Prisma Integration)](01_data_persistence_layer__prisma_integration__.md)! Now that we can store and retrieve data, we need to address a crucial question: who should be allowed to access this data?

## The Problem: Not Everyone Should Access Everything

Imagine you're building a social blogging platform where users can write articles and leave comments. You wouldn't want random strangers to be able to delete your articles or post comments pretending to be you, right? This is where security comes in.

Let's say Alice wants to edit her article titled "My Cooking Adventures." The system needs to answer two important questions:

1. **Who is making this request?** (Authentication - "Are you really Alice?")
2. **What are they allowed to do?** (Authorization - "Can Alice edit this specific article?")

Without proper security, anyone could pretend to be Alice and modify her content. That's a recipe for disaster!

## Enter JWT Tokens: Your Digital ID Badge

Think of our authentication system like a security checkpoint at a fancy office building. When Alice arrives at work, she shows her ID card to the security guard, who gives her a temporary visitor badge. This badge has an expiration time and allows her to access certain floors of the building.

In our application, JWT (JSON Web Token) works exactly like that temporary badge! When Alice logs in with her username and password, our system gives her a special token that acts as proof of her identity for the next 60 days.

Here's how a login looks:

```javascript
const user = await login({
  email: 'alice@example.com',
  password: 'mySecretPassword'
});
```

This returns Alice's information along with her digital "badge":

```javascript
{
  email: 'alice@example.com',
  username: 'alice_writer',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

That long string is Alice's JWT token - her temporary ID badge for accessing the system!

## Key Components of Our Security System

Let's break down the main pieces that keep our application secure:

### 1. Token Generation

When someone successfully logs in, we create a secure token for them:

```javascript
const token = jwt.sign(
  { user: { id: userId } }, 
  'superSecret',
  { expiresIn: '60d' }
);
```

This code creates a token that contains the user's ID, is signed with a secret key (like a security seal), and expires in 60 days. The token is like a tamper-proof ID badge that can't be faked.

### 2. Two Types of Security Checkpoints

Our system has two different security levels, just like a building with public lobbies and restricted offices:

**Required Authentication** - Like entering a secure office:
```javascript
auth.required
```

**Optional Authentication** - Like entering a public lobby where ID helps but isn't required:
```javascript
auth.optional
```

The first type blocks anyone without a valid token, while the second allows everyone but gives extra privileges to authenticated users.

### 3. Password Security

We never store passwords in plain text. Instead, we use a technique called "hashing":

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

Think of this like putting your password through a magical blender that turns "myPassword123" into something like "$2a$10$N9qo8uLOickgx2ZMRZoMye...". You can't reverse this process, making passwords super secure even if someone steals our database.

## How Authentication Works Step-by-Step

Let's trace through what happens when Alice tries to log in and then access a protected article:

```mermaid
sequenceDiagram
    participant Alice as Alice's Browser
    participant API as Our API
    participant Auth as Auth System
    participant DB as Database
    participant JWT as Token Generator
    
    Alice->>API: Login with email/password
    API->>DB: Find user by email
    DB->>API: Return user data
    API->>Auth: Verify password
    Auth->>JWT: Generate token
    JWT->>API: Return signed token
    API->>Alice: Send user info + token
    
    Alice->>API: Request protected article (with token)
    API->>Auth: Validate token
    Auth->>API: ✓ Token valid, user ID: 123
    API->>DB: Fetch article data
    DB->>API: Return article
    API->>Alice: Send article data
```

Here's what happens at each step:

1. **Alice sends login credentials**: Her browser sends email and password to our API
2. **Database lookup**: We find Alice's account in the database
3. **Password verification**: We check if the provided password matches the stored hash
4. **Token creation**: If password is correct, we generate a JWT token for Alice
5. **Token delivery**: Alice receives her user information plus the token
6. **Protected access**: Alice includes the token in future requests
7. **Token validation**: We verify the token is valid and extract Alice's user ID
8. **Data access**: Alice can now access her protected content

## Implementation Deep Dive

Now let's explore how this security system is built in our codebase:

### User Registration and Login

When someone creates a new account, we need to make sure they're unique:

```javascript
const existingUser = await prisma.user.findUnique({
  where: { email }
});

if (existingUser) {
  throw new HttpException(422, {
    errors: { email: ['has already been taken'] }
  });
}
```

This code checks if someone already has that email address. If they do, we politely tell them they need to use a different email.

For password security, we hash it before storing:

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
const user = await prisma.user.create({
  data: {
    username,
    email,
    password: hashedPassword
  }
});
```

The number `10` tells bcrypt how many times to scramble the password. Higher numbers are more secure but slower.

### Token Extraction from Requests

When Alice makes a request with her token, we need to find it in the request headers:

```javascript
const getTokenFromHeaders = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.split(' ')[0] === 'Token') {
    return authHeader.split(' ')[1];
  }
  return null;
};
```

This looks for headers like `Authorization: Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` and extracts just the token part.

### Required vs Optional Authentication

Our system supports two security modes:

```javascript
const auth = {
  required: jwt({
    secret: 'superSecret',
    getToken: getTokenFromHeaders
  }),
  optional: jwt({
    secret: 'superSecret',
    credentialsRequired: false,
    getToken: getTokenFromHeaders
  })
};
```

Required authentication blocks requests without valid tokens, while optional authentication allows requests through but still extracts user information if a token is provided.

### Accessing User Information

Once authenticated, routes can access the current user's information:

```javascript
const userId = req.auth?.user?.id;
const currentUser = await getCurrentUser(userId);
```

The `req.auth` object is automatically populated by our authentication middleware when a valid token is present.

## Real-World Example: Protecting an Article

Let's see how this all comes together. Imagine Alice wants to edit her article:

1. **Alice logs in**: She gets a token that proves she's Alice
2. **Alice requests to edit**: Her browser sends the token with the edit request
3. **System verifies token**: We confirm the token is valid and belongs to Alice
4. **System checks permissions**: We verify that Alice owns this article
5. **Edit allowed**: Alice can modify her article

Here's simplified code showing the permission check:

```javascript
// Extract user from token
const userId = req.auth.user.id;

// Find the article
const article = await prisma.article.findUnique({
  where: { id: articleId }
});

// Check if user owns the article
if (article.authorId !== userId) {
  throw new HttpException(403, { 
    errors: { message: ['Not authorized'] }
  });
}
```

If Alice tries to edit someone else's article, she gets blocked with a "Not authorized" error.

## What We've Learned

In this chapter, we've built a complete security system that acts like a digital bouncer for our application. Key takeaways include:

- **JWT Tokens**: Digital ID badges that prove user identity for 60 days
- **Password Hashing**: Secure password storage using bcrypt
- **Two Security Levels**: Required authentication for sensitive operations, optional for public content
- **Permission Checking**: Making sure users can only access what they own

With authentication and authorization in place, your data is now protected from unauthorized access. Users can safely create accounts, log in, and access their personal content without worrying about security breaches.

Next up, we'll explore how to organize all these security-protected operations into a clean, maintainable API structure. Continue your journey with [Route-Based API Architecture](03_route_based_api_architecture_.md), where you'll learn how to build organized, scalable endpoints that leverage the security system we just built!

