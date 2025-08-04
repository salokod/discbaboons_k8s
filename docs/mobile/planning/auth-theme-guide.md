# DiscBaboons Mobile App Theme Guide

## Brand Identity
- **Primary Color**: #ec7032 (Vibrant Orange) - Used for primary actions and brand presence
- **Secondary Color**: #1d1d41 (Deep Navy Blue) - Used for headers, important text, and secondary actions

## Visual Design Principles

### 1. Color Usage

#### Primary Actions (Orange #ec7032)
- Login/Register buttons
- Submit buttons
- Active tab indicators
- Loading spinners
- Success checkmarks

#### Secondary Elements (Navy Blue #1d1d41)
- App headers
- Navigation bars
- Input focus states
- Links on light backgrounds
- Icon tints

#### Backgrounds
- **Main Background**: White (#FFFFFF)
- **Card/Surface**: Light Gray (#F5F5F5)
- **Dark Sections**: Navy Blue (#1d1d41) with white text

### 2. Component Styling

#### Buttons
```javascript
// Primary Button (Orange)
primaryButton: {
  backgroundColor: colors.primary, // #ec7032
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  elevation: 2, // Android shadow
  shadowColor: '#000', // iOS shadow
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
}

// Secondary Button (Navy outline)
secondaryButton: {
  borderWidth: 2,
  borderColor: colors.secondary, // #1d1d41
  backgroundColor: 'transparent',
  paddingVertical: 10,
  paddingHorizontal: 22,
  borderRadius: 8,
}

// Text Link (Navy)
textLink: {
  color: colors.secondary, // #1d1d41
  fontWeight: '600',
  textDecorationLine: 'underline',
}
```

#### Input Fields
```javascript
input: {
  borderWidth: 1,
  borderColor: colors.border, // #E0E0E0
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  color: colors.text,
  backgroundColor: colors.white,
},
inputFocused: {
  borderColor: colors.secondary, // #1d1d41
  borderWidth: 2,
},
inputError: {
  borderColor: colors.error, // #D32F2F
}
```

### 3. Screen Layouts

#### Login Screen Design
```
Background: White (#FFFFFF)
┌─────────────────────────────────┐
│                                 │
│     [Orange Logo on White]      │ ← Logo prominently displayed
│                                 │
│     Welcome to DiscBaboons      │ ← Navy blue text
│     Track your disc golf        │ ← Gray text
│                                 │
│  ┌───────────────────────┐     │
│  │ Username/Email        │     │ ← Gray border, navy on focus
│  └───────────────────────┘     │
│                                 │
│  ┌───────────────────────┐     │
│  │ Password             │      │
│  └───────────────────────┘     │
│                                 │
│  ┌───────────────────────┐     │
│  │   Login (Orange)      │     │ ← Primary orange button
│  └───────────────────────┘     │
│                                 │
│  Forgot Password? (Navy link)   │
│                                 │
│  ─────────── OR ───────────     │
│                                 │
│  ┌───────────────────────┐     │
│  │  Create Account       │     │ ← Navy outline button
│  └───────────────────────┘     │
└─────────────────────────────────┘
```

#### Alternative Dark Header Design
```
┌─────────────────────────────────┐
│ Navy Blue Header (#1d1d41)      │
│     [Orange Logo]               │ ← Orange logo pops on navy
│     Welcome Back!               │ ← White text
│─────────────────────────────────│
│ White Background                │
│  ┌───────────────────────┐     │
│  │ Input fields...       │     │
│  └───────────────────────┘     │
└─────────────────────────────────┘
```

### 4. Typography Hierarchy

```javascript
// Headers (Navy Blue)
h1: {
  fontSize: 32,
  fontWeight: 'bold',
  color: colors.secondary, // #1d1d41
  marginBottom: 8,
}

// Subheaders
h2: {
  fontSize: 24,
  fontWeight: '600',
  color: colors.secondary,
  marginBottom: 6,
}

// Body Text
body: {
  fontSize: 16,
  color: colors.text, // #212121
  lineHeight: 24,
}

// Captions & Helper Text
caption: {
  fontSize: 14,
  color: colors.textLight, // #757575
  lineHeight: 20,
}

// Error Text
error: {
  fontSize: 14,
  color: colors.error, // #D32F2F
  marginTop: 4,
}
```

### 5. Icon & Illustration Strategy

- **Primary Icons**: Orange (#ec7032) for active/selected states
- **Default Icons**: Gray (#757575) for inactive states
- **Navigation Icons**: Navy (#1d1d41) when on white background
- **Logo Usage**: 
  - Orange logo on white/light backgrounds
  - White logo on navy backgrounds
  - Never orange logo on orange background

### 6. State Colors

#### Success States
- Background: #E8F5E9 (Light green)
- Text/Icon: #4CAF50 (Green)
- Used for: Success messages, completed actions

#### Error States
- Background: #FFEBEE (Light red)
- Text/Icon: #D32F2F (Red)
- Used for: Error messages, validation errors

#### Loading States
- Spinner: #ec7032 (Orange)
- Overlay: rgba(29, 29, 65, 0.7) (Navy with transparency)

### 7. Shadows & Elevation

```javascript
shadows: {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
}
```

### 8. Animation Guidelines

- **Button Press**: Scale down to 0.95 with spring animation
- **Screen Transitions**: Slide from right (iOS) or fade (Android)
- **Loading**: Rotating spinner with orange color
- **Success**: Checkmark animation in green
- **Error**: Shake animation for invalid inputs

### 9. Accessibility

- **Color Contrast**: All text meets WCAG AA standards
- **Touch Targets**: Minimum 44x44 points
- **Focus Indicators**: 2px navy border on all interactive elements
- **Text Sizes**: Minimum 14pt for body text
- **Error Messages**: Both color and text/icon indicators

### 10. Platform Differences

#### iOS
- Use native shadows
- Slide transitions
- San Francisco font
- Bottom tab navigation

#### Android
- Use elevation for shadows
- Fade transitions  
- Roboto font
- Top tab navigation or drawer

## Implementation Notes

1. **Logo File**: Use `discbaboon_logo_blue.png` (actually orange)
2. **Safe Areas**: Always use SafeAreaView on iOS
3. **Keyboard**: Use KeyboardAvoidingView for forms
4. **Dark Mode**: Prepare color structure for future dark mode
5. **Testing**: Test on both light and dark device themes