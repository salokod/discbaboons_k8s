# React Native Development Plan

## Overview
Transitioning from backend-only development to full-stack with React Native mobile app. Goal is to learn bare React Native (without Expo) while building a mobile companion to the existing Express.js backend.

## Teaching Philosophy
- **Learn by Building**: Create something working at each step
- **Understand the Why**: Explain what each piece does and why
- **Build Confidence**: Start simple, add complexity gradually  
- **Real Connection**: Connect to actual API from day one
- **TDD Approach**: Follow existing project patterns with test-first development

## Architecture Decisions

### Monorepo Structure
```
discbaboons_k8s/
├── apps/
│   ├── express-server/     # Existing backend (Node 22)
│   └── mobile-app/         # New React Native app (bare)
├── packages/              # Shared code (types, utils)
├── docs/mobile/           # Mobile-specific documentation
└── package.json           # Root workspace configuration
```

### Technology Choices
- **React Native**: Bare (no Expo) for learning native bridge concepts
- **Node Version**: 22 (consistent with backend via .nvmrc)
- **Package Management**: npm workspaces for monorepo
- **State Management**: TBD (likely Redux Toolkit or Zustand)
- **Navigation**: React Navigation
- **API Integration**: Fetch with existing auth patterns

## Development Phases

### Phase 1: Foundation ✅
- [x] Set up monorepo workspace configuration
- [x] Configure npm workspaces with shared scripts
- [x] Align Node.js version requirements (22+)
- [x] Create development documentation

### Phase 2: React Native Setup ✅
- [x] Initialize bare React Native app with iOS/Android folders
- [x] Understand React Native architecture and native bridge  
- [x] Convert from TypeScript to JavaScript for cleaner learning
- [x] Set up development environment (iOS/Android)

### Phase 2.5: TDD Hello World Tutorial (In Progress)
- [ ] Phase 1: TDD Hello World Component (RED-GREEN-REFACTOR)
- [ ] Phase 2: TDD Styling with visual testing
- [ ] Phase 3: TDD User Interaction with state management
- [ ] Phase 4: TDD Component Composition with props
- [ ] Phase 5: Integration testing and simulator run

### Phase 3: Core Navigation & Auth
- [ ] Set up React Navigation
- [ ] Create login screen with form handling
- [ ] Connect to backend API authentication
- [ ] Implement token storage and management
- [ ] Add error handling patterns

### Phase 4: First Real Feature
- [ ] Build bags list screen (matching backend endpoint)
- [ ] Implement pull-to-refresh and loading states
- [ ] Add navigation between screens
- [ ] Handle API errors gracefully

### Phase 5: Advanced Features
- [ ] Add state management (Redux/Zustand)
- [ ] Implement offline support
- [ ] Add push notifications
- [ ] Performance optimization

## Key Learning Objectives

### Understanding React Native
1. **Native Bridge**: How JavaScript communicates with iOS/Android
2. **Metro Bundler**: React Native's build system
3. **Platform Differences**: iOS vs Android development patterns
4. **Native Modules**: When and how to use platform-specific code

### Development Workflow
1. **Hot Reload**: Fast iteration during development
2. **Debugging**: React Native debugging tools and techniques
3. **Testing**: Unit and integration testing patterns
4. **Build Process**: Creating production iOS/Android builds

### Integration Patterns
1. **API Communication**: Connecting to Express.js backend
2. **Authentication**: Token-based auth flow
3. **Error Handling**: Consistent error patterns across platforms
4. **State Management**: Sharing state between screens

## Progress Tracking

### Completed ✅
- Monorepo workspace setup with npm workspaces
- Root package.json configuration with shared scripts
- Node.js version alignment (22+) via .nvmrc
- Documentation structure in docs/mobile/

### Current Focus 🎯
- Initializing bare React Native application
- Understanding iOS/Android folder structure
- Setting up development environment

### Next Steps 📋
1. Check iOS (Xcode) and Android Studio installation
2. Initialize React Native app in apps/mobile-app/
3. Explore generated iOS/Android native folders
4. Create first Hello World component

## Development Environment Requirements

### Required Tools
- [ ] Node.js 22+ (via .nvmrc)
- [ ] npm 9+
- [ ] React Native CLI
- [ ] Xcode (for iOS development)
- [ ] Android Studio (for Android development)
- [ ] iOS Simulator / Android Emulator

### Platform Support
- **Primary**: iOS (if Xcode available)
- **Secondary**: Android (if Android Studio available)
- **Strategy**: Start with one platform, add second later

## API Integration Plan

### Backend Endpoints to Integrate
Based on existing Express.js API:
1. **Authentication**: POST /auth/login, /auth/register, /auth/refresh
2. **Bags**: GET /bags, POST /bags, GET /bags/:id
3. **Profile**: GET /profile, PUT /profile
4. **Friends**: GET /friends, POST /friends/request
5. **Rounds**: GET /rounds, POST /rounds (future phases)

### Authentication Strategy
- Use existing JWT token-based authentication
- Store tokens securely on device
- Implement automatic token refresh
- Handle auth state across app lifecycle

## Success Metrics
1. ✅ Can run backend and mobile app simultaneously via `npm run dev`
2. 🎯 Mobile app displays "Hello World" on device/simulator
3. 📋 Successful login connecting to backend API
4. 📋 Display user's bags list from real backend data
5. 📋 Navigate between screens smoothly
6. 📋 Handle offline scenarios gracefully

---

*Last Updated: August 3, 2025*
*Next Review: After React Native app initialization*