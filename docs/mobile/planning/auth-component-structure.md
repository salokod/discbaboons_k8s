# Authentication Component Structure

## Screen Layouts

### LoginScreen
```
┌─────────────────────────────────┐
│         SafeAreaView            │
│  ┌───────────────────────────┐  │
│  │      AppContainer          │  │
│  │  ┌───────────────────┐    │  │
│  │  │   [Logo Image]     │    │  │
│  │  │  DiscBaboons Logo  │    │  │
│  │  └───────────────────┘    │  │
│  │                            │  │
│  │  ┌───────────────────┐    │  │
│  │  │      Welcome!      │    │  │
│  │  └───────────────────┘    │  │
│  │                            │  │
│  │  ┌───────────────────┐    │  │
│  │  │ Username/Email     │    │  │
│  │  └───────────────────┘    │  │
│  │                            │  │
│  │  ┌───────────────────┐    │  │
│  │  │ Password          │    │  │
│  │  └───────────────────┘    │  │
│  │                            │  │
│  │  ┌───────────────────┐    │  │
│  │  │   Login Button    │    │  │
│  │  └───────────────────┘    │  │
│  │                            │  │
│  │  Forgot Password?          │  │
│  │  Forgot Username?          │  │
│  │                            │  │
│  │  ─────────────────────     │  │
│  │                            │  │
│  │  Don't have an account?    │  │
│  │  Register here             │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Component Hierarchy

```
src/
├── components/
│   ├── common/
│   │   ├── AppContainer.js
│   │   ├── Input.js
│   │   ├── Button.js
│   │   ├── Link.js
│   │   ├── Alert.js
│   │   ├── LoadingOverlay.js
│   │   └── Logo.js
│   │
│   └── auth/
│       ├── PasswordStrengthIndicator.js
│       └── AuthForm.js
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── ForgotUsernameScreen.js
│   │   └── ResetPasswordScreen.js
│   │
│   └── app/
│       └── HomeScreen.js
│
├── navigation/
│   ├── AuthNavigator.js
│   ├── AppNavigator.js
│   └── RootNavigator.js
│
├── services/
│   ├── api/
│   │   ├── auth.js
│   │   └── client.js
│   │
│   └── storage/
│       └── secureStorage.js
│
├── context/
│   └── AuthContext.js
│
├── constants/
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   └── api.js
│
└── utils/
    ├── validation.js
    └── formatters.js
```

## Component Examples

### AppContainer Component
```javascript
// Provides consistent padding, background, and scroll behavior
<AppContainer>
  <Logo />
  {children}
</AppContainer>
```

### Input Component
```javascript
<Input
  label="Username"
  value={username}
  onChangeText={setUsername}
  error={errors.username}
  autoCapitalize="none"
  leftIcon="user"
/>
```

### Button Component
```javascript
<Button
  title="Login"
  onPress={handleLogin}
  loading={isLoading}
  variant="primary"
  fullWidth
/>
```

### Form Validation Example
```javascript
const validationRules = {
  username: {
    required: true,
    minLength: 4,
    maxLength: 20,
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    message: 'Password must contain uppercase, lowercase, number, and special character',
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email',
  },
};
```

## Navigation Flow

```
App Start
    │
    ├── Check Auth Token
    │   ├── Valid Token → AppNavigator → HomeScreen
    │   └── No/Invalid Token → AuthNavigator → LoginScreen
    │
    └── AuthNavigator
        ├── LoginScreen
        │   ├── → RegisterScreen
        │   ├── → ForgotPasswordScreen
        │   └── → ForgotUsernameScreen
        │
        ├── RegisterScreen
        │   └── → LoginScreen (on success)
        │
        ├── ForgotPasswordScreen
        │   └── → ResetPasswordScreen
        │
        └── ResetPasswordScreen
            └── → LoginScreen (on success)
```

## State Management Flow

```
AuthContext
├── authState
│   ├── isLoading
│   ├── isAuthenticated
│   ├── user
│   └── tokens
│
├── authActions
│   ├── login(username, password)
│   ├── register(username, email, password)
│   ├── logout()
│   ├── refreshToken()
│   └── resetPassword(email, code, newPassword)
│
└── authEffects
    ├── Check stored tokens on app start
    ├── Set up axios interceptors
    └── Handle token refresh
```

## API Response Handling

### Success Response
```javascript
{
  success: true,
  data: {
    accessToken: "...",
    refreshToken: "...",
    user: {
      id: 1,
      username: "discgolfer"
    }
  }
}
```

### Error Response
```javascript
{
  success: false,
  error: {
    type: "ValidationError",
    message: "Invalid credentials"
  }
}
```

## Styling Approach

1. **Consistent Spacing**: Use spacing constants for all margins/padding
2. **Color Theming**: All colors from constants/colors.js
3. **Typography Scale**: Predefined text styles
4. **Platform Specific**: Handle iOS/Android differences
5. **Responsive**: Adapt to different screen sizes
6. **Accessibility**: Proper labels and hints
7. **Dark Mode Ready**: Structure supports theme switching